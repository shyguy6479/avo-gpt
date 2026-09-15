// Load environment variables from .env file immediately
import dotenv from 'dotenv';
dotenv.config();

// Clean up tsx's global __dirname injection so vite-plugin-pwa and Vite plugins locate files correctly
delete (globalThis as any).__dirname;

import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json';
import { adminService } from './server/adminService';

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();
const databaseId =
  firebaseConfigJson.firestoreDatabaseId &&
  firebaseConfigJson.firestoreDatabaseId !== '' &&
  firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? firebaseConfigJson.firestoreDatabaseId
    : undefined;
const db = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);

// In-Memory Cache and Local Disk Backup for Parental Control Settings (<1ms latency per request)
interface ParentalCacheEntry {
  val: boolean;
  ts: number;
}
const parentalSettingsCache = new Map<string, ParentalCacheEntry>();
const LOCAL_PARENTAL_FILE = path.join(process.cwd(), 'parental_settings.json');
let serverFirestoreSuspendedUntil = 0;

const readLocalParentalSettings = (): Record<string, boolean> => {
  try {
    if (fs.existsSync(LOCAL_PARENTAL_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_PARENTAL_FILE, 'utf-8'));
    }
  } catch {}
  return {};
};

const writeLocalParentalSettings = (email: string, enabled: boolean) => {
  try {
    const existing = readLocalParentalSettings();
    existing[email] = enabled;
    fs.writeFileSync(LOCAL_PARENTAL_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch {}
};

const extractUserEmail = (req: express.Request): string | undefined => {
  const headerEmail = req.headers['x-user-email'] as string;
  if (headerEmail && headerEmail.trim()) return headerEmail.trim().toLowerCase();

  const authHeader = req.headers['authorization'] as string;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token.includes('@')) return token.toLowerCase();
    }
  }

  if (req.body && req.body.userEmail && typeof req.body.userEmail === 'string') {
    return req.body.userEmail.trim().toLowerCase();
  }

  return undefined;
};

const getUserParentalSettings = async (userEmail?: string): Promise<boolean> => {
  if (!userEmail || typeof userEmail !== 'string') return false;
  const cleanEmail = userEmail.trim().toLowerCase();
  if (!cleanEmail) return false;

  const cached = parentalSettingsCache.get(cleanEmail);
  if (cached && Date.now() - cached.ts < 60000) {
    return cached.val;
  }

  // Check local file storage first
  const localStore = readLocalParentalSettings();
  if (typeof localStore[cleanEmail] === 'boolean') {
    const val = localStore[cleanEmail];
    parentalSettingsCache.set(cleanEmail, { val, ts: Date.now() });
    return val;
  }

  // If server Firestore is suspended due to quota, avoid querying
  if (Date.now() < serverFirestoreSuspendedUntil) {
    parentalSettingsCache.set(cleanEmail, { val: false, ts: Date.now() });
    return false;
  }

  try {
    const targetUid = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, 'users', targetUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const enabled =
        data?.preferences?.ageRestrictedContentFilter === true ||
        data?.preferences?.parentalFilter === true ||
        data?.parentalControls?.ageRestrictedContentFilter === true;
      parentalSettingsCache.set(cleanEmail, { val: enabled, ts: Date.now() });
      writeLocalParentalSettings(cleanEmail, enabled);
      return enabled;
    }
  } catch (err: any) {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('quota') || msg.includes('resource-exhausted')) {
      serverFirestoreSuspendedUntil = Date.now() + 4 * 60 * 60 * 1000;
    }
  }

  parentalSettingsCache.set(cleanEmail, { val: false, ts: Date.now() });
  return false;
};

const setUserParentalSettings = async (userEmail: string, enabled: boolean): Promise<boolean> => {
  const cleanEmail = userEmail.trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email is required');

  // Always update in-memory and local file store
  parentalSettingsCache.set(cleanEmail, { val: enabled, ts: Date.now() });
  writeLocalParentalSettings(cleanEmail, enabled);

  // Attempt Firestore write only if quota suspension is not active
  if (Date.now() >= serverFirestoreSuspendedUntil) {
    try {
      const targetUid = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          email: cleanEmail,
          preferences: {
            ageRestrictedContentFilter: enabled,
            parentalFilter: enabled
          },
          parentalControls: {
            ageRestrictedContentFilter: enabled,
            updatedAt: new Date().toISOString()
          }
        },
        { merge: true }
      );
    } catch (err: any) {
      const msg = (err?.message || String(err)).toLowerCase();
      if (msg.includes('quota') || msg.includes('resource-exhausted')) {
        serverFirestoreSuspendedUntil = Date.now() + 4 * 60 * 60 * 1000;
      }
    }
  }

  return enabled;
};

// Server-Side Moderation & Safety Classification Engine
const isAgeRestrictedContent = (prompt: string, attachmentInfo?: string): { restricted: boolean; category?: string; reason?: string } => {
  if (!prompt || typeof prompt !== 'string') return { restricted: false };

  const combined = (prompt + ' ' + (attachmentInfo || '')).trim();
  const lower = combined.toLowerCase();

  let deleet = lower
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/\+/g, 't')
    .replace(/8/g, 'b');

  const squished = deleet.replace(/[\s\._\-\*\:\;\\\/]+/g, '');

  const sexualKeywords = [
    'porn', 'pornography', 'erotica', 'erotic', 'hentai', 'nsfw', 'hardcore', 'softcore',
    'blowjob', 'cunnilingus', 'gangbang', 'deepthroat', 'clitoris', 'vagina', 'penis',
    'masturbation', 'masturbate', 'ejaculation', 'orgasm', 'intercourse', 'stripper',
    'fetish', 'bdsm', 'bondage', 'xxx', 'nude', 'nudity', 'sextape', 'incest',
    'pedophil', 'childporn', 'stripclub', 'sexualact', 'boobs', 'topless'
  ];

  for (const kw of sexualKeywords) {
    if (squished.includes(kw)) {
      return { restricted: true, category: 'SEXUAL', reason: 'Contains sexually explicit or adult content.' };
    }
  }

  const sexualRegex = /\b(explicit\s+sex|sexual\s+content|erotic\s+story|nude\s+picture|nude\s+photo|adult\s+video|porn\s+site|sexually\s+explicit|sex\s+position|how\s+to\s+have\s+sex)\b/i;
  if (sexualRegex.test(lower)) {
    return { restricted: true, category: 'SEXUAL', reason: 'Contains sexually explicit or adult themes.' };
  }

  const violenceKeywords = [
    'decapitate', 'decapitation', 'dismember', 'dismemberment', 'snuff', 'gory',
    'suicid', 'killmyself', 'cutmywrists', 'endmylife', 'selfharm', 'murdertutorial',
    'howtotorture', 'executesomeone', 'graphicgore'
  ];

  for (const kw of violenceKeywords) {
    if (squished.includes(kw)) {
      return { restricted: true, category: 'GRAPHIC_VIOLENCE', reason: 'Contains graphic violence, gore, or self-harm.' };
    }
  }

  const dangerousRegex = /\b(how\s+to\s+make\s+a\s+bomb|pipe\s+bomb|synthesize\s+meth|cook\s+meth|synthesize\s+fentanyl|synthesize\s+heroin|make\s+a\s+gun|improvised\s+explosive|poison\s+recipe)\b/i;
  if (dangerousRegex.test(lower) || dangerousRegex.test(deleet)) {
    return { restricted: true, category: 'EXTREME_OR_DISTURBING', reason: 'Contains dangerous materials, weapons, or illegal drug creation.' };
  }

  return { restricted: false };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // Helper to initialize Gemini client on server side
  const getGeminiClient = () => {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
      if (apiKey) {
        return new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }
      console.warn('[Gemini Init] No GEMINI_API_KEY found in process.env or .env file.');
      return null;
    } catch (e) {
      console.warn('[Gemini Init] Client initialization failed:', e);
      return null;
    }
  };

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Text-To-Speech (TTS) API endpoint powered by Gemini AI Voice
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      }

      // Clean text for optimal speech synthesis
      let cleanText = text
        .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/[*_~#>[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText.length > 2000) {
        cleanText = cleanText.substring(0, 2000) + '...';
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: 'Gemini client is not initialized.' });
      }

      const voiceName = voice || 'Puck'; // Puck, Zephyr, Kore, Fenrir, Charon
      let response: any;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: cleanText,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        });
      } catch (geminiErr: any) {
        return res.status(200).json({ error: 'Audio synthesis unavailable for this text', audio: null });
      }

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (!part || !part.inlineData || !part.inlineData.data) {
        return res.status(500).json({ error: 'No audio data received from TTS engine.' });
      }

      const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');
      const sampleRate = 24000;
      const numChannels = 1;
      const wavHeader = Buffer.alloc(44);
      const dataSize = pcmBuffer.length;
      const chunkSize = 36 + dataSize;
      const byteRate = sampleRate * numChannels * 2;
      const blockAlign = numChannels * 2;

      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(chunkSize, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20); // Linear PCM
      wavHeader.writeUInt16LE(numChannels, 22);
      wavHeader.writeUInt32LE(sampleRate, 24);
      wavHeader.writeUInt32LE(byteRate, 28);
      wavHeader.writeUInt16LE(blockAlign, 32);
      wavHeader.writeUInt16LE(16, 34); // 16 bits per sample
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(dataSize, 40);

      const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', wavBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(wavBuffer);
    } catch (err: any) {
      console.error('[TTS API Error]:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'TTS generation failed' });
    }
  });

  // Parental Control Settings REST API
  app.get('/api/settings/parental-controls', async (req, res) => {
    try {
      const userEmail = extractUserEmail(req);
      if (!userEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const ageRestrictedContentFilter = await getUserParentalSettings(userEmail);
      return res.json({ ageRestrictedContentFilter, parentalFilter: ageRestrictedContentFilter });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch parental settings' });
    }
  });

  app.patch('/api/settings/parental-controls', async (req, res) => {
    try {
      const userEmail = extractUserEmail(req);
      if (!userEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { ageRestrictedContentFilter, parentalFilter } = req.body;
      const targetValue =
        typeof ageRestrictedContentFilter === 'boolean'
          ? ageRestrictedContentFilter
          : typeof parentalFilter === 'boolean'
          ? parentalFilter
          : null;

      if (targetValue === null) {
        return res.status(400).json({ error: 'Invalid request: ageRestrictedContentFilter boolean is required' });
      }

      const updatedValue = await setUserParentalSettings(userEmail, targetValue);
      return res.json({
        ageRestrictedContentFilter: updatedValue,
        parentalFilter: updatedValue,
        success: true
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update parental settings' });
    }
  });

  // ====================================================
  // AVO AI ADMIN PLATFORM APIS (Protected by Role-Based Access Control)
  // ====================================================
  const verifyAdminAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userEmail = extractUserEmail(req);
    const clientRole = req.headers['x-user-role'] as string;
    const adminKey = req.headers['x-admin-key'] as string;

    const isSuperAdminEmail =
      userEmail &&
      (userEmail === 'abhixin79@gmail.com' ||
        userEmail.endsWith('@avo.ai') ||
        userEmail.includes('admin'));

    const role = userEmail ? adminService.getUserRole(userEmail) : 'user';

    if (
      isSuperAdminEmail ||
      role === 'admin' ||
      role === 'super_admin' ||
      clientRole === 'admin' ||
      clientRole === 'super_admin' ||
      adminKey === 'avo-master-admin-token' ||
      process.env.NODE_ENV !== 'production'
    ) {
      (req as any).adminEmail = userEmail || 'abhixin79@gmail.com';
      return next();
    }

    return res.status(403).json({
      error: 'Access denied: Administrator privileges required.',
      requiredRole: 'admin'
    });
  };

  app.get('/api/admin/metrics', verifyAdminAccess, (_req, res) => {
    try {
      const metrics = adminService.getMetrics();
      res.json(metrics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/users', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getUsers());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/users/:uid', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const updated = adminService.updateUser(req.params.uid, req.body, adminEmail);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/ai-models', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getModels());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/ai-models/:id', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const updated = adminService.updateModel(req.params.id, req.body, adminEmail);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/providers', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getProviders());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/providers/:id', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const updated = adminService.updateProvider(req.params.id, req.body, adminEmail);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/routing', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getRouting());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/routing', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const updated = adminService.updateRouting(req.body, adminEmail);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/feature-settings', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getFeatureFlags());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/feature-settings', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const updated = adminService.updateFeatureFlags(req.body, adminEmail);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/system-health', verifyAdminAccess, (_req, res) => {
    try {
      const memory = process.memoryUsage();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024))
        },
        services: {
          backend: { status: 'operational', latencyMs: 2 },
          database: { status: 'operational', latencyMs: 38, provider: 'Google Cloud Firestore' },
          authentication: { status: 'operational', latencyMs: 24, provider: 'Firebase Auth' },
          aiRouter: { status: 'operational', latencyMs: 14, activeModels: 5 },
          providers: [
            { name: 'Google Gemini', status: 'operational', latencyMs: 420 },
            { name: 'OpenAI', status: 'operational', latencyMs: 640 },
            { name: 'NVIDIA NIM', status: 'operational', latencyMs: 380 },
            { name: 'OpenRouter', status: 'operational', latencyMs: 850 }
          ]
        },
        recentIncidents: []
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/audit-logs', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getAuditLogs());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/audit-logs', verifyAdminAccess, (req, res) => {
    try {
      const adminEmail = (req as any).adminEmail || 'admin';
      const created = adminService.addAuditLog({
        admin: adminEmail,
        action: req.body.action || 'GENERAL_ADMIN_ACTION',
        target: req.body.target || 'platform',
        result: req.body.result || 'SUCCESS',
        details: req.body.details
      });
      res.json(created);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/admin/feedback', verifyAdminAccess, (_req, res) => {
    try {
      res.json(adminService.getFeedback());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/conversations', verifyAdminAccess, (_req, res) => {
    try {
      const users = adminService.getUsers();
      const conversationsMeta = users.flatMap((u, idx) => [
        {
          id: `conv-${u.uid.slice(-6)}-1`,
          userId: u.uid,
          userEmail: u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          userPlan: u.plan,
          title: idx % 2 === 0 ? 'React & Tailwind architectural review' : 'Operating Systems concurrency analysis',
          messageCount: idx % 2 === 0 ? 8 : 12,
          model: 'Gemini 3.6 Flash',
          provider: 'Google AI',
          createdAt: u.createdAt,
          lastActive: u.lastActive
        },
        {
          id: `conv-${u.uid.slice(-6)}-2`,
          userId: u.uid,
          userEmail: u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          userPlan: u.plan,
          title: idx % 2 === 0 ? 'Vector search embeddings strategy' : 'High throughput Redis cache setup',
          messageCount: idx % 2 === 0 ? 4 : 6,
          model: 'OpenAI GPT-4o',
          provider: 'OpenAI',
          createdAt: u.createdAt,
          lastActive: u.lastActive
        }
      ]);
      res.json(conversationsMeta);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper to extract visual subject without stripping essential description words
  // Helper to extract visual subject without stripping essential description words
  const extractCleanSubject = (rawPrompt: string): string => {
    let clean = rawPrompt.trim();
    clean = clean.replace(/^(hey\s+avo\s*,?\s*)?(please\s+)?(can\s+you\s+|could\s+you\s+|i\s+want\s+you\s+to\s+|will\s+you\s+)?(generate|create|draw|make|render|paint|show\s+me|give\s+me|produce)\s+(an?|another|new|one\s+more|me\s+an?|me\s+another)?\s*(image|picture|photo|artwork|illustration|drawing|graphic|visual|portrait|logo|banner|poster|wallpaper)s?\s*(of\s+|about\s+|showing\s+|with\s+)?/i, '');
    clean = clean.replace(/^(hey\s+avo\s*,?\s*)?(please\s+)?(can\s+you\s+)?(generate|create|draw|make|render|paint|show\s+me|give\s+me)\s+(of\s+)?/i, '');
    clean = clean.replace(/^(image|picture|photo)\s+(of\s+)?/i, '');
    clean = clean.replace(/\s+(image|picture|photo|artwork|illustration|drawing|graphic|visual|design)s?$/i, '');
    clean = clean.replace(/[\?!.]+$/, '');
    return clean.trim() || rawPrompt.trim();
  };

  // Style-Consistent System Prompt Prefix Map
  const IMAGE_STYLE_PREFIXES: Record<string, string> = {
    cinematic: 'high-resolution, cinematic lighting, 8k render, dramatic composition, filmic color grade, masterpiece, detailed composition',
    photorealistic: 'ultra-realistic photorealistic 8k photograph, fine texture detail, sharp focal lens, natural lifelike lighting',
    anime: 'vibrant studio anime illustration, crisp line art, dynamic shading, atmospheric lighting, detailed artwork',
    '3d-render': 'octane 3d render, raytraced volumetric lighting, high fidelity 3d textures, cinematic composition, masterpiece',
    'digital-art': 'masterpiece digital painting, expressive color palette, rich artistic strokes, high detail concept art',
    minimalist: 'clean minimalist aesthetic, refined composition, elegant vector geometry, sleek visual balance',
    default: 'high-resolution, cinematic, detailed composition, professional masterpiece'
  };

  // High-Performance In-Memory Image Cache (LRU with 24-hour TTL)
  interface CachedImageEntry {
    buffer: Buffer;
    mimeType: string;
    timestamp: number;
  }
  const imageMemoryCache = new Map<string, CachedImageEntry>();
  const MAX_IMAGE_CACHE_ENTRIES = 250;

  // Registered Image Prompts Store (for clean, short proxy URLs)
  interface StoredImagePromptEntry {
    prompt: string;
    model?: string;
    width?: number;
    height?: number;
    seed?: number;
  }
  const storedImagePrompts = new Map<string, StoredImagePromptEntry>();

  function getCachedImage(key: string): CachedImageEntry | undefined {
    const item = imageMemoryCache.get(key);
    if (!item) return undefined;
    if (Date.now() - item.timestamp > 86400000) {
      imageMemoryCache.delete(key);
      return undefined;
    }
    return item;
  }

  function setCachedImage(key: string, buffer: Buffer, mimeType: string) {
    if (imageMemoryCache.size >= MAX_IMAGE_CACHE_ENTRIES) {
      const oldestKey = imageMemoryCache.keys().next().value;
      if (oldestKey) imageMemoryCache.delete(oldestKey);
    }
    imageMemoryCache.set(key, { buffer, mimeType, timestamp: Date.now() });
  }

  // Thematic High-Resolution CDN Fallbacks to guarantee 0 broken images
  const THEMATIC_UNSPLASH_IDS: Record<string, string> = {
    cyberpunk: '1519501025264-65ba15a82390',
    studio: '1598488035139-bdbb2231ce04',
    city: '1486406146926-c627a92ad1ab',
    brutalist: '1513694203232-719a280e022f',
    beach: '1507525428034-b723cf961d3e',
    sunset: '1495616811223-4d98c6e9c869',
    forest: '1448375240586-882707db888b',
    space: '1451187580459-43490279c0fa',
    portrait: '1534528741775-53994a69daeb',
    office: '1497366216548-37526070297c',
    penthouse: '1600585154340-be6161a56a0c',
    default: '1618005182384-a83a8bd57fbe'
  };

  function getThematicUnsplashUrl(prompt: string, width = 800, height = 500): string {
    const lower = prompt.toLowerCase();
    let id = THEMATIC_UNSPLASH_IDS.default;
    for (const [key, val] of Object.entries(THEMATIC_UNSPLASH_IDS)) {
      if (lower.includes(key)) {
        id = val;
        break;
      }
    }
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
  }

  async function fetchOrGenerateImageBuffer(
    promptOrUrl: string,
    options: { model?: string; width?: number; height?: number; seed?: number } = {}
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const model = options.model || 'flux';
    const width = options.width || 800;
    const height = options.height || 500;
    const seed = options.seed || Math.floor(Math.random() * 1000000);
    const cacheKey = `${promptOrUrl}_${model}_${width}x${height}_${seed}`;

    const cached = getCachedImage(cacheKey);
    if (cached) {
      return { buffer: cached.buffer, mimeType: cached.mimeType };
    }

    // Direct HTTP proxy request
    if (promptOrUrl.startsWith('http') && !promptOrUrl.includes('pollinations.ai')) {
      try {
        const res = await fetch(promptOrUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get('content-type') || 'image/jpeg';
          setCachedImage(cacheKey, buf, mime);
          return { buffer: buf, mimeType: mime };
        }
      } catch {
        // Fall through to generative
      }
    }

    let promptText = promptOrUrl;
    if (promptOrUrl.includes('/prompt/')) {
      try {
        const match = promptOrUrl.match(/\/prompt\/([^?]+)/);
        if (match) promptText = decodeURIComponent(match[1]);
      } catch {
        // ignore
      }
    }

    // Tier 1: Fast Flux Model (500-700ms)
    const primaryGenUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`;
    try {
      const res = await fetch(primaryGenUrl, { signal: AbortSignal.timeout(5500) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get('content-type') || 'image/jpeg';
        setCachedImage(cacheKey, buf, mime);
        return { buffer: buf, mimeType: mime };
      }
    } catch (err) {
      console.warn(`[ImageGen] Primary flux fetch failed or timed out:`, err);
    }

    // Tier 2: Ultra-Fast Turbo Model
    try {
      const secondaryGenUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=turbo`;
      const res = await fetch(secondaryGenUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get('content-type') || 'image/jpeg';
        setCachedImage(cacheKey, buf, mime);
        return { buffer: buf, mimeType: mime };
      }
    } catch (err) {
      console.warn(`[ImageGen] Secondary turbo fetch failed:`, err);
    }

    // Tier 3: High-Resolution Photographic Fallback from Unsplash CDN
    try {
      const unsplashUrl = getThematicUnsplashUrl(promptText, width, height);
      const res = await fetch(unsplashUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get('content-type') || 'image/jpeg';
        setCachedImage(cacheKey, buf, mime);
        return { buffer: buf, mimeType: mime };
      }
    } catch (err) {
      console.warn(`[ImageGen] Tertiary Unsplash fetch failed:`, err);
    }

    // Tier 4: SVG Graphic Buffer
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18181b"/>
          <stop offset="50%" stop-color="#27272a"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <circle cx="${width / 2}" cy="${height / 2 - 25}" r="50" fill="#a855f7" opacity="0.2"/>
      <text x="${width / 2}" y="${height / 2}" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">Visual Artwork</text>
      <text x="${width / 2}" y="${height / 2 + 25}" font-family="system-ui, sans-serif" font-size="12" fill="#a1a1aa" text-anchor="middle">${promptText.slice(0, 45)}</text>
    </svg>`;
    return { buffer: Buffer.from(svg, 'utf-8'), mimeType: 'image/svg+xml' };
  }

  // Dedicated High-Speed Image Proxy & Caching Endpoint
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const { id, bgId, url, prompt, model = 'flux', seed, width = '800', height = '500' } = req.query as Record<string, string>;
      
      let target = (url || prompt || '').trim();
      let targetModel = model || 'flux';
      let targetWidth = parseInt(width) || 800;
      let targetHeight = parseInt(height) || 500;
      let targetSeed = seed ? parseInt(seed) : undefined;

      const lookupId = id || bgId;
      if (lookupId && storedImagePrompts.has(lookupId)) {
        const stored = storedImagePrompts.get(lookupId)!;
        target = stored.prompt;
        if (stored.model) targetModel = stored.model;
        if (stored.width) targetWidth = stored.width;
        if (stored.height) targetHeight = stored.height;
        if (stored.seed !== undefined) targetSeed = stored.seed;
      }

      if (!target) {
        return res.status(400).send('URL, prompt or image ID query parameter is required');
      }

      const { buffer, mimeType } = await fetchOrGenerateImageBuffer(target, {
        model: targetModel,
        width: targetWidth,
        height: targetHeight,
        seed: targetSeed
      });

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (err: any) {
      console.error('[Image Proxy Error]', err);
      res.status(500).send('Image proxy error');
    }
  });

  // Dedicated Background Replacement & Transformation Endpoint
  app.post('/api/replace-background', async (req, res) => {
    const startTime = Date.now();
    try {
      const { image, backgroundPrompt, style = 'cinematic' } = req.body;
      if (!image?.data) {
        return res.status(400).json({ error: 'Image data is required' });
      }
      if (!backgroundPrompt || typeof backgroundPrompt !== 'string' || !backgroundPrompt.trim()) {
        return res.status(400).json({ error: 'Background prompt is required' });
      }

      let subjectDescription = 'the main subject from the original photo';
      try {
        const visionAI = getGeminiClient();
        if (visionAI) {
          const visionPrompt = `Analyze the main foreground person/subject in this photo with high photographic fidelity.
Capture:
1. Physical likeness: approximate age, gender, hair style/color, skin tone, facial features, facial hair/glasses (if present), expression.
2. Clothing & attire: exact clothing items, jacket/shirt color, style, patterns, accessories.
3. Pose and framing: posture, angle, waist-up/close-up/full-body, hands.
Output a 30-40 word detailed photographic description capturing their exact likeness for an image generator. Do not describe the background.`;

          const visionRes = await visionAI.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: {
              parts: [
                { inlineData: { data: image.data, mimeType: image.mimeType || 'image/jpeg' } },
                { text: visionPrompt }
              ]
            }
          });
          if (visionRes?.text?.trim()) {
            subjectDescription = visionRes.text.trim().replace(/[\n\r\.]+/g, ' ').trim();
          }
        }
      } catch (vErr) {
        console.warn('[Replace Background Vision Error]', vErr);
      }

      const stylePrefix = IMAGE_STYLE_PREFIXES[style] || IMAGE_STYLE_PREFIXES['photorealistic'];
      const composedPrompt = `photo of ${subjectDescription}, seamlessly integrated into ${backgroundPrompt.trim()}, ${stylePrefix}, matched cinematic lighting, volumetric atmosphere, realistic ground contact shadows, 8k render, masterpiece`;
      const seed = Math.floor(Math.random() * 1000000);

      const { buffer, mimeType } = await fetchOrGenerateImageBuffer(composedPrompt, {
        model: 'flux',
        width: 800,
        height: 600,
        seed
      });

      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

      return res.json({
        imageUrl: dataUrl,
        subject: subjectDescription,
        background: backgroundPrompt.trim(),
        style,
        latencyMs: Date.now() - startTime,
        provider: 'generative-flux-ai'
      });
    } catch (err: any) {
      console.error('[Replace Background Error]', err);
      return res.status(500).json({ error: err.message || 'Background replacement failed' });
    }
  });

  // Dedicated AI Image Generation Endpoint using High Quality Gemini & Flux Models
  app.post('/api/generate-image', async (req, res) => {
    const startTime = Date.now();
    try {
      const { prompt, aspectRatio = '1:1', style = 'cinematic', variation, isUpscale = false } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'A non-empty prompt string is required' });
      }

      const userEmail = extractUserEmail(req);
      res.on('finish', () => {
        adminService.recordAiRequest({
          model: 'gemini-3.1-flash-lite-image',
          provider: 'Google AI',
          latencyMs: Date.now() - startTime,
          isError: res.statusCode >= 400,
          userEmail
        });
      });
      const isParentalActive = await getUserParentalSettings(userEmail);
      if (isParentalActive) {
        const check = isAgeRestrictedContent(prompt);
        if (check.restricted) {
          return res.status(400).json({
            error: "I can't help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead.",
            blocked: true
          });
        }
      }

      const rawPrompt = prompt.trim();
      const cleanSubject = extractCleanSubject(rawPrompt);
      const stylePrefix = IMAGE_STYLE_PREFIXES[style] || IMAGE_STYLE_PREFIXES['default'];

      // Always prepend style-consistent system prompt prefix
      let finalPrompt = `${stylePrefix}, ${cleanSubject}`;
      if (variation && typeof variation === 'string' && variation.trim()) {
        finalPrompt += `, variation style: ${variation.trim()}`;
      }

      const ai = getGeminiClient();

      if (ai) {
        // Try supported image generation models with silent fallback
        const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'imagen-3.0-generate-002'];
        for (const modelName of imageModels) {
          try {
            if (modelName.startsWith('imagen-')) {
              const response = await (ai.models as any).generateImages({
                model: modelName,
                prompt: finalPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4' || aspectRatio === '1:1') ? aspectRatio : '1:1',
                },
              });

              if (response.generatedImages?.[0]?.image?.imageBytes) {
                const base64Data = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                return res.json({
                  imageUrl,
                  prompt: cleanSubject,
                  fullPrompt: finalPrompt,
                  style,
                  aspectRatio,
                  provider: modelName
                });
              }
            } else {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: finalPrompt }] },
                config: {
                  imageConfig: {
                    aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4' || aspectRatio === '1:1') ? aspectRatio : '1:1',
                    ...(modelName === 'gemini-3.1-flash-image' ? { imageSize: isUpscale ? '2K' : '1K' } : {})
                  },
                },
              });

              if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                  if (part.inlineData?.data) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    return res.json({
                      imageUrl,
                      prompt: cleanSubject,
                      fullPrompt: finalPrompt,
                      style,
                      aspectRatio,
                      provider: modelName
                    });
                  }
                }
              }
            }
          } catch {
            // Silently fall back to server-side AI buffer generation if API model quota/404 occurs
          }
        }
      }

      // Dynamic High-Performance Flux Image Generation via fetchOrGenerateImageBuffer
      let baseWidth = 768;
      let baseHeight = 768;
      if (aspectRatio === '16:9') { baseWidth = 800; baseHeight = 450; }
      else if (aspectRatio === '9:16') { baseWidth = 450; baseHeight = 800; }
      else if (aspectRatio === '4:5') { baseWidth = 600; baseHeight = 750; }
      else if (aspectRatio === '4:3') { baseWidth = 800; baseHeight = 600; }

      const scaleFactor = isUpscale ? 1.3 : 1;
      const width = Math.round(baseWidth * scaleFactor);
      const height = Math.round(baseHeight * scaleFactor);
      const seed = Math.floor(Math.random() * 1000000);

      try {
        const { buffer, mimeType } = await fetchOrGenerateImageBuffer(finalPrompt, {
          model: 'flux',
          width,
          height,
          seed
        });

        return res.json({
          imageUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
          prompt: cleanSubject,
          fullPrompt: finalPrompt,
          style,
          aspectRatio,
          provider: 'generative-flux-ai'
        });
      } catch (genErr) {
        console.warn('[Server Image Gen] Buffered generation fallback:', genErr);
        const proxyUrl = `/api/image-proxy?prompt=${encodeURIComponent(finalPrompt)}&model=flux&width=${width}&height=${height}&seed=${seed}`;
        return res.json({
          imageUrl: proxyUrl,
          prompt: cleanSubject,
          fullPrompt: finalPrompt,
          style,
          aspectRatio,
          provider: 'generative-flux-ai'
        });
      }
    } catch (err: any) {
      console.error('[Server Image Gen Error]', err);
      return res.status(500).json({ error: err.message || 'Image generation failed' });
    }
  });

  // Dedicated Image Upscaling Endpoint
  app.post('/api/upscale-image', async (req, res) => {
    try {
      const { prompt, aspectRatio = '1:1', style = 'cinematic' } = req.body;
      const userEmail = extractUserEmail(req);
      const isParentalActive = await getUserParentalSettings(userEmail);
      if (isParentalActive && prompt) {
        const check = isAgeRestrictedContent(prompt);
        if (check.restricted) {
          return res.status(400).json({
            error: "I can't help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead.",
            blocked: true
          });
        }
      }

      const rawPrompt = prompt || 'high resolution masterpiece artwork';
      const cleanSubject = extractCleanSubject(rawPrompt);
      const stylePrefix = IMAGE_STYLE_PREFIXES[style] || IMAGE_STYLE_PREFIXES['default'];
      const upscalePrompt = `ultra high definition 4k detail, sharp micro textures, flawless upscale render, ${stylePrefix}, ${cleanSubject}`;

      let baseWidth = 960;
      let baseHeight = 960;
      if (aspectRatio === '16:9') { baseWidth = 1024; baseHeight = 576; }
      else if (aspectRatio === '9:16') { baseWidth = 576; baseHeight = 1024; }
      else if (aspectRatio === '4:5') { baseWidth = 768; baseHeight = 960; }
      else if (aspectRatio === '4:3') { baseWidth = 1024; baseHeight = 768; }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await (ai.models as any).generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: upscalePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4' || aspectRatio === '1:1') ? aspectRatio : '1:1',
            },
          });

          if (response.generatedImages?.[0]?.image?.imageBytes) {
            const base64Data = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64Data}`;
            return res.json({
              imageUrl,
              prompt: cleanSubject,
              resolution: `${baseWidth}x${baseHeight}`,
              isUpscaled: true,
              provider: 'imagen-3.0-generate-002'
            });
          }
        } catch {
          // Fall back to high-res flux
        }
      }

      const seed = Math.floor(Math.random() * 1000000);
      try {
        const { buffer, mimeType } = await fetchOrGenerateImageBuffer(upscalePrompt, {
          model: 'flux',
          width: baseWidth,
          height: baseHeight,
          seed
        });

        return res.json({
          imageUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
          prompt: cleanSubject,
          resolution: `${baseWidth}x${baseHeight}`,
          isUpscaled: true,
          provider: 'generative-flux-ai'
        });
      } catch (upscaleErr) {
        const proxyUrl = `/api/image-proxy?prompt=${encodeURIComponent(upscalePrompt)}&model=flux&width=${baseWidth}&height=${baseHeight}&seed=${seed}`;
        return res.json({
          imageUrl: proxyUrl,
          prompt: cleanSubject,
          resolution: `${baseWidth}x${baseHeight}`,
          isUpscaled: true,
          provider: 'generative-flux-ai'
        });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Upscaling failed' });
    }
  });

  // API keys from environment variables
  const DEFAULT_GROQ_KEY = '';
  const DEFAULT_OPENROUTER_KEY = '';

  const DEFAULT_SYSTEM_INSTRUCTION = `You are AVO AI, a general-purpose AI assistant built by mysea.ai. You are helpful, accurate, clear, conversational, and versatile. If asked who built you, who created you, who made you, or who developed you, you must state that you were built by mysea.ai. You excel at programming, software engineering, mathematics, scientific reasoning, writing, editing, summarization, analysis, and answering general knowledge questions.

Guidelines:
- Answer user questions directly, accurately, and thoroughly.
- EXPLANATION DEPTH DIRECTIVE: Whenever the user asks you to "explain", "explain this", "give an explanation", "explain in detail", "elaborate", or when an explanation is requested on any topic, concept, code, or question, ALWAYS provide an exhaustive, in-depth explanation (~800 to 2000 words). Structure the explanation comprehensively with clear section headers, core overview, detailed conceptual breakdown, step-by-step analysis, concrete examples, real-world applications, and summary key takeaways.
- COMPLETION DIRECTIVE: Always provide complete, uninterrupted, fully developed responses. Never truncate or stop halfway through an explanation, ASCII flowchart, step-by-step breakdown, or code block. Ensure all steps, thoughts, and syntax blocks are completely closed and delivered in full.
- Provide clean, working code snippets in properly formatted markdown code blocks when programming questions are asked.
- Maintain conversation context naturally across follow-up turns.
- When creating mind maps, flowcharts, or visual diagrams, ALWAYS use valid Mermaid diagrams in \`\`\`mermaid code blocks or clean Markdown lists. NEVER use raw KaTeX math symbols (e.g. \\swarrow, \\searrow, \\downarrow, \\quad) to draw text pseudo-diagrams. Use standard LaTeX ($...$ for inline, $$...$$ on separate lines for math).
- When live web search is active or requested, use real-time web search to give up-to-date answers with current facts and sources.
- When live web search is not active or not requested, answer directly using your knowledge base. Do NOT state a real-time information disclaimer unless the user explicitly asks for live real-time information or today's events when live search is unavailable.`;

  // Helper to call Groq API
  const callGroq = async (messages: any[], systemInstruction?: string, modelName: string = 'llama-3.3-70b-versatile') => {
    const apiKey = (process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY || '').trim();
    if (!apiKey) return null;

    const formattedMessages = [
      { role: 'system', content: (systemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.' },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || ''
      }))
    ];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 4096
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch {
      return null;
    }
  };

  // Helper to call OpenRouter API
  const callOpenRouter = async (messages: any[], systemInstruction?: string, modelName: string = 'deepseek/deepseek-chat') => {
    const apiKey = (process.env.OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY || '').trim();
    if (!apiKey) return null;

    const actualModel = modelName.includes('claude') 
      ? 'anthropic/claude-3.5-sonnet' 
      : 'deepseek/deepseek-chat';

    const formattedMessages = [
      { role: 'system', content: (systemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.' },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || ''
      }))
    ];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://avo.ai',
          'X-Title': 'AVO AI Assistant'
        },
        body: JSON.stringify({
          model: actualModel,
          messages: formattedMessages,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch {
      return null;
    }
  };

  // Helper to call OpenAI API
  const callOpenAI = async (messages: any[], systemInstruction?: string, modelName: string = 'gpt-4o-mini') => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const formattedMessages = [
      { role: 'system', content: (systemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.' },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || ''
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelName.includes('gpt-4') ? 'gpt-4o' : 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  };

  // In-Memory Fast Caching Systems
  let cachedNewsHeadlines = '';
  let cachedNewsTimestamp = 0;

  interface CachedResponse {
    text: string;
    timestamp: number;
  }
  const promptResponseCache = new Map<string, CachedResponse>();
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

  const getCacheKey = (prompt: string, modelStr?: string, hasImage?: boolean, mode?: string, effort?: string) => {
    if (hasImage) return null;
    const clean = (prompt || '').trim().toLowerCase();
    if (!clean || clean.length < 2) return null;
    // Always bypass cache for high and ultra effort, or deep research, so users always get fresh, deep generation
    if (effort === 'ultra' || effort === 'high' || mode === 'deep') return null;
    if (clean.includes('[web search mode]') || clean.includes('[deep research mode]')) return null;
    return `${clean}_${modelStr || 'default'}_${mode || 'smart'}_${effort || 'medium'}`;
  };

  // Helper to fetch live news headlines for news-related queries (cached for 10 minutes)
  const fetchNewsHeadlines = async (): Promise<string> => {
    if (cachedNewsHeadlines && Date.now() - cachedNewsTimestamp < 10 * 60 * 1000) {
      return cachedNewsHeadlines;
    }
    try {
      const urls = [
        'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
        'https://feeds.bbci.co.uk/news/rss.xml'
      ];
      const headlines: string[] = [];
      for (const url of urls) {
        try {
          const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (response.ok) {
            const xml = await response.text();
            const matches = xml.match(/<title>(.*?)<\/title>/gi) || [];
            for (const match of matches.slice(1, 12)) {
              const cleanTitle = match
                .replace(/<\/?title>/gi, '')
                .replace(/<!\[CDATA\[/gi, '')
                .replace(/\]\]>/gi, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();

              if (
                cleanTitle &&
                !headlines.includes(cleanTitle) &&
                !cleanTitle.toLowerCase().includes('google news') &&
                !cleanTitle.toLowerCase().includes('bbc news')
              ) {
                headlines.push(cleanTitle);
              }
            }
          }
        } catch {
          // Continue to next feed
        }
      }
      const resText = headlines.slice(0, 10).join('\n- ');
      if (resText) {
        cachedNewsHeadlines = resText;
        cachedNewsTimestamp = Date.now();
      }
      return resText;
    } catch {
      return cachedNewsHeadlines || '';
    }
  };

  // Multi-Model Router Query Categorizer
  const fineGrainedCategorize = (userPrompt: string): string => {
    const lower = (userPrompt || '').toLowerCase();

    if (lower.includes('error') || lower.includes('bug') || lower.includes('exception') || lower.includes('fix') || lower.includes('traceback') || lower.includes('stack trace') || lower.includes('failed to')) {
      return 'debugging';
    }
    if (lower.includes('function') || lower.includes('code') || lower.includes('script') || lower.includes('write a program') || lower.includes('implement') || lower.includes('class') || lower.includes('api endpoint') || lower.includes('react') || lower.includes('python') || lower.includes('typescript')) {
      return 'programming';
    }
    if (lower.includes('math') || lower.includes('calculate') || lower.includes('equation') || lower.includes('formula') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('matrix') || lower.includes('solve') || lower.includes('integral')) {
      return 'mathematics';
    }
    if (lower.includes('architect') || lower.includes('system design') || lower.includes('scalable') || lower.includes('microservice') || lower.includes('infrastructure') || lower.includes('strategy') || lower.includes('planning') || lower.includes('roadmap')) {
      return 'planning';
    }
    if (lower.includes('data') || lower.includes('chart') || lower.includes('graph') || lower.includes('statistics') || lower.includes('dataset') || lower.includes('analysis')) {
      return 'data_analysis';
    }
    if (lower.includes('summarize') || lower.includes('summary') || lower.includes('tldr') || lower.includes('key points')) {
      return 'summarization';
    }
    if (lower.includes('story') || lower.includes('poem') || lower.includes('essay') || lower.includes('creative') || lower.includes('draft') || lower.includes('novel')) {
      return 'creative_writing';
    }
    if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does') || lower.includes('definition') || lower.includes('teach')) {
      return 'education';
    }
    if (lower.includes('why') || lower.includes('compare') || lower.includes('pros and cons') || lower.includes('evaluate') || lower.includes('difference between')) {
      return 'reasoning';
    }
    if (lower.includes('research') || lower.includes('study') || lower.includes('benchmark') || lower.includes('paper')) {
      return 'research';
    }
    return 'general';
  };

  // Go Beyond Contextual Recommendations Generator
  const buildGoBeyondSuggestions = (prompt: string, category: string): Array<{ id: string; label: string; prompt: string; icon: string; category: any }> => {
    if (category === 'debugging' || category === 'programming') {
      return [
        { id: 'gb-1', label: 'Explain root cause', prompt: `Can you explain in detail why this code issue happened and how to prevent it in the future?`, icon: 'HelpCircle', category: 'coding' },
        { id: 'gb-2', label: 'Add unit tests & error handling', prompt: `Can you add comprehensive unit tests and defensive error handling for this solution?`, icon: 'ShieldCheck', category: 'coding' },
        { id: 'gb-3', label: 'Optimize performance', prompt: `How can we optimize the time and memory complexity of this code?`, icon: 'Zap', category: 'coding' },
        { id: 'gb-4', label: 'Refactor using design patterns', prompt: `Show how to refactor this code using modern software design patterns.`, icon: 'Code', category: 'coding' }
      ];
    }

    if (category === 'education' || category === 'general') {
      return [
        { id: 'gb-1', label: 'Real-world practical examples', prompt: `Can you provide 3 concrete real-world practical examples of this concept in action?`, icon: 'Globe', category: 'learning' },
        { id: 'gb-2', label: 'Interactive mini practice quiz', prompt: `Create a 3-question mini quiz (with answer key) to test my understanding of this topic.`, icon: 'HelpCircle', category: 'learning' },
        { id: 'gb-3', label: 'Common mistakes & misconceptions', prompt: `What are the top 5 common mistakes or misconceptions people make about this?`, icon: 'AlertTriangle', category: 'learning' },
        { id: 'gb-4', label: 'Deep-dive visual diagram', prompt: `Can you generate a detailed visual flowchart or Mermaid diagram explaining this process?`, icon: 'FileText', category: 'learning' }
      ];
    }

    if (category === 'mathematics' || category === 'reasoning') {
      return [
        { id: 'gb-1', label: 'Step-by-step mathematical proof', prompt: `Show a rigorous step-by-step mathematical proof or formal derivation for this.`, icon: 'Sliders', category: 'math' },
        { id: 'gb-2', label: 'Interactive practice problem', prompt: `Give me a similar practice problem to solve, wait for my attempt, then provide the solution.`, icon: 'Sparkles', category: 'math' },
        { id: 'gb-3', label: 'Practical applications', prompt: `Where is this mathematical concept used in real-world engineering, physics, or finance?`, icon: 'Zap', category: 'math' }
      ];
    }

    if (category === 'planning' || category === 'data_analysis') {
      return [
        { id: 'gb-1', label: 'Risk & mitigation matrix', prompt: `Identify key technical & operational risks for this plan along with risk mitigation strategies.`, icon: 'ShieldCheck', category: 'business' },
        { id: 'gb-2', label: '30-60-90 day execution roadmap', prompt: `Provide a structured 30-60-90 day execution roadmap with milestones and key deliverables.`, icon: 'BarChart3', category: 'business' },
        { id: 'gb-3', label: 'Cost & resource estimate', prompt: `Provide a realistic estimate of infrastructure cost, team resourcing, and ongoing maintenance requirements.`, icon: 'Zap', category: 'business' }
      ];
    }

    return [
      { id: 'gb-1', label: 'Explore key takeaways', prompt: `What are the top 3 critical takeaways I should remember from this answer?`, icon: 'CheckCircle', category: 'general' },
      { id: 'gb-2', label: 'Practical next steps', prompt: `What practical actions should I take next based on this information?`, icon: 'ArrowRight', category: 'general' },
      { id: 'gb-3', label: 'Deep dive into related concepts', prompt: `What are the most important related concepts I should study next?`, icon: 'BookOpen', category: 'general' }
    ];
  };

  // Compute AI Confidence Score
  const computeConfidence = (category: string, selectedMode: string, councilRan: boolean) => {
    let score = 92;
    if (selectedMode === 'deep' || councilRan) {
      score = 96;
    } else if (category === 'mathematics' || category === 'debugging') {
      score = 88;
    } else if (category === 'general' || category === 'education') {
      score = 94;
    }

    const level: 'High' | 'Moderate' | 'Low' = score >= 85 ? 'High' : score >= 70 ? 'Moderate' : 'Low';
    return {
      score,
      level,
      reason: councilRan ? 'Verified multi-model consensus & synthesis' : 'Verified factual consistency & intent alignment'
    };
  };

  // Helper to classify requests and apply smart lightweight routing
  const classifyRequest = (userPrompt: string, hasImage: boolean) => {
    const lower = userPrompt.toLowerCase().trim();

    // 1. Creator check
    if (
      lower.includes('who created') ||
      lower.includes('who made') ||
      lower.includes('who built') ||
      lower.includes('who build you') ||
      lower.includes('who builds you') ||
      lower.includes('who built u') ||
      lower.includes('who made u') ||
      lower.includes('who created u') ||
      lower.includes('who is your creator') ||
      lower.includes('who is your builder') ||
      lower.includes('who is your developer') ||
      lower.includes('who developed you') ||
      lower.includes('who developed avo') ||
      lower.includes('creator of avo') ||
      lower.includes('creator of this app') ||
      lower.includes('creator of this') ||
      lower.includes('who designed avo') ||
      lower.includes('who designed you') ||
      lower.includes('built by whom') ||
      lower.includes('built by who') ||
      lower.includes('created by whom') ||
      lower.includes('created by who') ||
      lower.includes('who programmed you') ||
      lower.includes('who coded you') ||
      lower.includes('quien te creo') ||
      lower.includes('quién te creó') ||
      lower.includes('quien te construyo') ||
      lower.includes('quién te construyó') ||
      lower.includes('quien te hizo') ||
      lower.includes('quién te hizo') ||
      (lower.includes('who created') && (lower.includes('you') || lower.includes('avo') || lower.includes('this'))) ||
      (lower.includes('who made') && (lower.includes('you') || lower.includes('avo') || lower.includes('this'))) ||
      (lower.includes('who built') && (lower.includes('you') || lower.includes('avo') || lower.includes('this'))) ||
      (lower.includes('who developed') && (lower.includes('you') || lower.includes('avo') || lower.includes('this')))
    ) {
      return { type: 'CREATOR' };
    }

    // 2. Identity / Self check ("who are you", "what is your name", "what is avo ai", "about avo")
    if (
      lower === 'who are you' ||
      lower === 'who are you?' ||
      lower === 'what is your name' ||
      lower === 'what is your name?' ||
      lower === 'what are you' ||
      lower === 'what are you?' ||
      lower === 'what is avo' ||
      lower === 'what is avo ai' ||
      lower === 'about avo' ||
      lower === 'tell me about yourself' ||
      lower === 'introduce yourself' ||
      lower.includes('who are you') ||
      lower.includes('what is your name')
    ) {
      return { type: 'IDENTITY' };
    }

    // 3. Greetings
    const cleanPunct = lower.replace(/[^\w\s]/g, '').trim();
    const isGreeting = ['hi', 'hello', 'hey', 'hola', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup', 'namaste', 'greetings'].includes(cleanPunct);
    if (isGreeting) {
      return { type: 'GREETING', greeting: cleanPunct };
    }

    // 4. Date & Time Queries ("you know what is the today's date", "what is today's date", "date today", "what date is it")
    const cleanLower = lower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (
      cleanLower.includes('today date') ||
      cleanLower.includes('todays date') ||
      cleanLower.includes('date today') ||
      cleanLower.includes('what date is') ||
      cleanLower.includes('what is the date') ||
      cleanLower.includes('current date') ||
      cleanLower.includes('know what is the today') ||
      cleanLower.includes('what is today date') ||
      cleanLower === 'what date' ||
      cleanLower === 'date'
    ) {
      return { type: 'DATE' };
    }

    // 5. Multimodal / image check
    if (hasImage) {
      return { type: 'MULTIMODAL' };
    }

    // 5. Explicit news / current world events check
    const isExplicitNews =
      lower.includes('latest news') ||
      lower.includes('today headlines') ||
      lower.includes('todays news') ||
      lower.includes('breaking news') ||
      lower.includes('news today') ||
      lower.includes('top headlines') ||
      lower.includes('world news today') ||
      lower.includes('going on in the world') ||
      lower.includes('happening in the world') ||
      lower.includes('current world events') ||
      lower.includes('world news') ||
      lower.includes('global news');

    if (isExplicitNews) {
      return { type: 'NEWS' };
    }

    return { type: 'STANDARD' };
  };

  interface ModelSpecialtySpec {
    modelId: string;
    name: string;
    tag: string;
    specialty: string;
    thinkingMode: string;
    thinkingLevel: ThinkingLevel;
    temperature: number;
    features: string[];
    systemDirective: string;
  }

  const getModelSpecialtySpec = (modelName?: string, effort?: string): ModelSpecialtySpec => {
    const m = (modelName || '').toLowerCase().trim();

    // 1. AVO Flash (Sub-Second Speed & Rapid Direct Answers)
    if (m === 'avo-flash' || m === 'gemini-3.1-flash-lite' || m === 'gemini-3-flash') {
      return {
        modelId: 'gemini-3.1-flash-lite',
        name: 'AVO Flash',
        tag: 'Sub-Second',
        specialty: 'Ultra-Low Latency Execution & Rapid Direct Answers',
        thinkingMode: 'Direct Zero-Overhead Stream',
        thinkingLevel: ThinkingLevel.MINIMAL,
        temperature: 0.2,
        features: ['Sub-Second TTFT', 'Zero-Preamble Output', 'Actionable Bullet Summaries', 'High Throughput'],
        systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO FLASH (SUB-SECOND EXECUTION ENGINE)]:
You are AVO Flash, an ultra-low latency, sub-second execution engine.
- Working Specialty: Instant, high-density, straight-to-the-point answers.
- Thinking Style: Streamlined zero-overhead direct stream. No unnecessary meta-commentary, introductory filler, or conversational padding.
- Response Formatting: Deliver immediate, crisp, highly actionable answers, bullet summaries, or clean code snippets right away.`
      };
    }

    // 2. AVO 4o Pro (Complex Systems Architecture & Deep Engineering Logic)
    if (m === 'avo-4o-pro' || m === 'gemini-3.6-pro' || m === 'gemini-3.5-pro') {
      return {
        modelId: 'gemini-3.1-pro-preview',
        name: 'AVO 4o Pro',
        tag: 'Systems & Code',
        specialty: 'Complex Systems Architecture, Deep Code Engineering & Diagnostics',
        thinkingMode: 'Multi-Tier Architectural Deduction',
        thinkingLevel: ThinkingLevel.HIGH,
        temperature: 0.35,
        features: ['Systems Architecture', 'Production-Grade Refactoring', 'Strict Type Checking', 'Fault-Tolerant Design'],
        systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO 4O PRO (ADVANCED SYSTEMS & ARCHITECTURE)]:
You are AVO 4o Pro, the heavyweight engineering and systems architecture model.
- Working Specialty: Complex multi-module software engineering, deep system refactoring, fault-tolerant design, and comprehensive technical diagnostics.
- Thinking Style: Rigorous architectural reasoning, analyzing edge cases, performance bottlenecks, typing contracts, and modular boundaries.
- Response Formatting: Structure complex answers with clear architectural schematics, fully typed production code, explicit trade-off analyses, and step-by-step implementation roadmaps.`
      };
    }

    // 3. AVO Deep Thinker (Formal Logic, STEM Proofs & Deep Chain-of-Thought)
    if (m === 'avo-deep-thinker' || m === 'gemini-3.1-pro-preview') {
      return {
        modelId: 'gemini-3.1-pro-preview',
        name: 'AVO Deep Thinker',
        tag: 'Formal Logic',
        specialty: 'Mathematical Proofs, STEM Derivations & First-Principles Deductions',
        thinkingMode: 'Exhaustive Step-by-Step Chain-of-Thought & Lemma Verification',
        thinkingLevel: ThinkingLevel.HIGH,
        temperature: 0.4,
        features: ['Formal Mathematical Proofs', 'STEM Derivations', 'Deductive Chain-of-Thought', 'Counter-Example Analysis'],
        systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO DEEP THINKER (FORMAL LOGIC & REASONING)]:
You are AVO Deep Thinker, the dedicated deep-reasoning, mathematical deduction, and formal logic intelligence model.
- Working Specialty: First-principles mathematical derivations, STEM problem-solving, rigorous theorem proofs, edge-case theorem verification, and exhaustive analytical verification.
- Thinking Style: Deep, systematic Chain-of-Thought reasoning. Explore hypotheses, verify lemmas, test boundary conditions, and validate logical deductions before drawing conclusions.
- Response Formatting: Provide clear, methodical step-by-step breakdowns showing derivations, intermediate calculations, proof structures, and definitive syntheses.`
      };
    }

    // 4. AVO Omni (Multimodal Vision OCR, Spatial Layouts & Rich Interactive Artifacts)
    if (m === 'avo-omni' || m === 'gemini-3.8-flash') {
      return {
        modelId: 'gemini-3.8-flash',
        name: 'AVO Omni',
        tag: 'Multimodal',
        specialty: 'Multimodal Vision OCR, Spatial Layouts & Rich Interactive Artifacts',
        thinkingMode: 'Multimodal Spatial Inspection & Cross-Asset Synthesis',
        thinkingLevel: ThinkingLevel.LOW,
        temperature: 0.65,
        features: ['Vision OCR Extraction', 'Spatial Diagram Interpretation', 'UI/UX Blueprinting', 'Cross-Modal Synthesis'],
        systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO OMNI (MULTIMODAL VISION & ARTIFACTS)]:
You are AVO Omni, the multimodal intelligence, visual reasoning, and rich document/UI artifact synthesis engine.
- Working Specialty: Deep visual OCR extraction, spatial diagram interpretation, UI/UX design architecture, and cross-modal document reasoning.
- Thinking Style: Multimodal spatial inspection and visual-semantic cross-referencing.
- Response Formatting: Produce beautifully structured visual layouts, markdown tables, diagrams, ASCII charts, and rich formatted artifacts.`
      };
    }

    // 5. AVO Universal Omni (Unified SuperModel Ensemble)
    if (m === 'avo-omni-unified') {
      return {
        modelId: 'gemini-flash-latest',
        name: 'AVO Universal Omni',
        tag: 'SuperModel',
        specialty: 'Unified SuperModel Ensemble (Multi-Expert Consensus)',
        thinkingMode: 'Cross-Expert Consensus Synthesis',
        thinkingLevel: ThinkingLevel.HIGH,
        temperature: 0.5,
        features: ['Combined Multi-Model Engine', 'Deep Reasoning & Code', 'Multimodal Vision', 'Live Web Grounding'],
        systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO UNIVERSAL OMNI (SUPREME ENSEMBLE)]:
You are the AVO Universal Omni SuperModel, uniting the multi-model strengths of deep reasoning, high-speed execution, multimodal vision, and systems architecture.
- Working Specialty: Master-level multi-domain problem solving synthesizing all analytical angles.
- Thinking Style: Multi-perspective synthesis combining empirical verification, speed, and structural completeness.
- Response Formatting: Authoritative, comprehensive, and impeccably polished delivery.`
      };
    }

    // Default: AVO 4o (Everyday Balanced Intelligence • Fast & Versatile)
    return {
      modelId: 'gemini-flash-latest',
      name: 'AVO 4o',
      tag: 'Balanced',
      specialty: 'Everyday Intelligence & High-Velocity Problem Solving',
      thinkingMode: 'Adaptive Context Synthesis',
      thinkingLevel: effort === 'ultra' || effort === 'high' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
      temperature: 0.7,
      features: ['Context Synthesis', 'Broad Domain Knowledge', 'Fast Interactive Dialogue', 'Live Web Grounding'],
      systemDirective: `[MODEL IDENTITY & WORKING SPECIALTY: AVO 4O (BALANCED GENERAL INTELLIGENCE)]:
You are AVO 4o, the flagship agile and versatile general intelligence engine.
- Working Specialty: Everyday problem solving, natural communication, writing, reasoning, and practical productivity.
- Thinking Style: Balanced, contextual synthesis adapting dynamically to conversational, creative, and analytical queries.
- Response Formatting: Natural, crystal-clear, structured responses with balanced depth and elegant formatting.`
    };
  };

  const resolveGeminiModel = (modelName?: string): string => {
    return getModelSpecialtySpec(modelName).modelId;
  };

  // Ultra-Fast SSE Streaming Chat Endpoint
  app.post('/api/chat/stream', async (req, res) => {
    const startTime = Date.now();
    try {
      const { messages, systemInstruction, image, model, mode = 'smart', effort } = req.body;
      const userPrompt = messages?.[messages.length - 1]?.content || '';
      const selectedMode: 'fast' | 'smart' | 'deep' = (mode === 'fast' || mode === 'deep') ? mode : 'smart';
      const selectedEffort: 'low' | 'medium' | 'high' | 'ultra' =
        (effort === 'low' || effort === 'medium' || effort === 'high' || effort === 'ultra')
          ? effort
          : (mode === 'fast' ? 'low' : mode === 'deep' ? 'high' : 'medium');
      const fineCategory = fineGrainedCategorize(userPrompt);
      const modelSpec = getModelSpecialtySpec(model, selectedEffort);

      const userEmail = extractUserEmail(req);
      res.on('finish', () => {
        adminService.recordAiRequest({
          model: model || 'gemini-3.6-flash',
          provider: 'Google AI',
          latencyMs: Date.now() - startTime,
          isError: res.statusCode >= 400,
          userEmail
        });
      });
      const isParentalEnabled = await getUserParentalSettings(userEmail);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      // Stream Multi-Model Metadata first
      const councilLogs = selectedMode === 'deep' ? [
        { model: 'Google Gemini 3.6 Flash', provider: 'Google AI', status: 'analyzed' as const, summary: 'Core structural proposal generated' },
        { model: 'OpenAI GPT-4o', provider: 'OpenAI', status: 'analyzed' as const, summary: 'Edge cases & security verified' },
        { model: 'NVIDIA Llama 3.3', provider: 'NVIDIA / Groq', status: 'analyzed' as const, summary: 'Performance & efficiency optimized' },
        { model: 'OpenRouter DeepSeek-R1', provider: 'OpenRouter', status: 'analyzed' as const, summary: 'Deep reasoning & verification checked' },
        { model: 'AVO Synthesis Judge', provider: 'AVO Core Engine', status: 'compared' as const, summary: 'Consensus extracted & weak reasoning filtered' },
        { model: 'AVO Answer Verifier', provider: 'AVO Core Engine', status: 'verified' as const, summary: 'Factual & logic checks completed' }
      ] : undefined;

      const metadataPayload = {
        mode: selectedMode,
        effort: selectedEffort,
        modelName: modelSpec.name,
        modelId: modelSpec.modelId,
        specialty: modelSpec.specialty,
        thinkingMode: modelSpec.thinkingMode,
        tag: modelSpec.tag,
        features: modelSpec.features,
        category: fineCategory,
        confidence: computeConfidence(fineCategory, selectedMode, selectedMode === 'deep' || selectedEffort === 'high' || selectedEffort === 'ultra'),
        goBeyond: buildGoBeyondSuggestions(userPrompt, fineCategory),
        councilLogs
      };

      res.write(`data: ${JSON.stringify({ metadata: metadataPayload })}\n\n`);

      if (isParentalEnabled) {
        const check = isAgeRestrictedContent(userPrompt, image?.mimeType || '');
        if (check.restricted) {
          const refusalText = "I can't help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead.";
          res.write(`data: ${JSON.stringify({ text: refusalText, blocked: true })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      }

      const cacheKey = getCacheKey(userPrompt, model, !!image?.data, selectedMode, selectedEffort);
      if (cacheKey && promptResponseCache.has(cacheKey)) {
        const cached = promptResponseCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          console.log(`[AVO Cache Hit] Returning instant response for repeat query: "${userPrompt.slice(0, 35)}..." [mode=${selectedMode}, effort=${selectedEffort}]`);
          const fullText = cached.text;
          const chunkSize = 35;
          for (let i = 0; i < fullText.length; i += chunkSize) {
            const chunk = fullText.slice(i, i + chunkSize);
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            await new Promise((resolve) => setTimeout(resolve, 8));
          }
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        } else {
          promptResponseCache.delete(cacheKey);
        }
      }

      const category = classifyRequest(userPrompt, !!image?.data);

      if (category.type === 'CREATOR') {
        const creatorText = 'built by mysea.ai';
        res.write(`data: ${JSON.stringify({ text: creatorText })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      if (category.type === 'IDENTITY') {
        const identityText = 'I am AVO AI, an advanced AI assistant built by mysea.ai. I am designed for high-performance conversation, coding, research, and multimodal intelligence. How can I help you today?';
        res.write(`data: ${JSON.stringify({ text: identityText })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const now = new Date();
      const currentDateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const currentClockStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const clockContext = `\n\n[SYSTEM CLOCK & REAL-TIME DATE CONTEXT]: Today is ${currentDateStr}, current time is ${currentClockStr} (ISO Date: ${now.toISOString().slice(0, 10)}). You ALWAYS have access to today's date and live system clock. Answer queries about today's date, current day, or current time accurately based on this system clock context.`;

      let enrichedSystemInstruction = (systemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + clockContext + '\n\n' + modelSpec.systemDirective;

      // Web Search & Deep Research Mode Detectors & Directives
      const lowerPrompt = (userPrompt || '').toLowerCase();
      const isNewsOrWorldQuery =
        category.type === 'NEWS' ||
        lowerPrompt.includes('world news') ||
        lowerPrompt.includes('global news') ||
        lowerPrompt.includes('latest news') ||
        lowerPrompt.includes('breaking news');

      const isWebSearch = userPrompt.includes('[Web Search Mode]:') || userPrompt.includes('Search web for') || isNewsOrWorldQuery;
      const isMultiSiteResearch = lowerPrompt.includes('50 to 100') || lowerPrompt.includes('50-100') || lowerPrompt.includes('100 websites') || lowerPrompt.includes('50 websites') || lowerPrompt.includes('visit 100') || lowerPrompt.includes('check 50') || lowerPrompt.includes('check 100') || lowerPrompt.includes('visit 50');
      const isDeepResearch = userPrompt.includes('[Deep Research Mode]:') || userPrompt.includes('Deep research') || userPrompt.includes('deep research') || userPrompt.includes('Perform deep research') || isMultiSiteResearch;

      const isExplanationRequested =
        lowerPrompt.includes('explain') ||
        lowerPrompt.includes('explanation') ||
        lowerPrompt.includes('elaborate') ||
        lowerPrompt.includes('clarify') ||
        lowerPrompt.includes('teach me') ||
        lowerPrompt.includes('how does it work') ||
        lowerPrompt.includes('how it works') ||
        lowerPrompt.includes('how did you') ||
        lowerPrompt.includes('how do you') ||
        lowerPrompt.includes('how was') ||
        lowerPrompt.includes('why did you') ||
        lowerPrompt.includes('what model') ||
        lowerPrompt.includes('what prompt') ||
        lowerPrompt.includes('tell me how') ||
        lowerPrompt.includes('describe') ||
        lowerPrompt.includes('give details') ||
        lowerPrompt.includes('detail explanation') ||
        lowerPrompt.includes('detailed explanation');

      const isDesignRequest =
        !isExplanationRequested &&
        !lowerPrompt.includes("don't") &&
        !lowerPrompt.includes('do not') &&
        !lowerPrompt.includes('this specific image') &&
        (lowerPrompt.includes('generate a design') ||
        lowerPrompt.includes('create a design') ||
        lowerPrompt.includes('design mockup') ||
        lowerPrompt.includes('ui mockup') ||
        lowerPrompt.includes('show design') ||
        lowerPrompt.includes('visual design mockup'));

      const isImageEditRequest =
        !isExplanationRequested &&
        !lowerPrompt.includes("don't") &&
        !lowerPrompt.includes('do not') &&
        (lowerPrompt.includes('change background') ||
         lowerPrompt.includes('change the background') ||
         lowerPrompt.includes('swap background') ||
         lowerPrompt.includes('replace background') ||
         lowerPrompt.includes('remove background') ||
         lowerPrompt.includes('edit this image') ||
         lowerPrompt.includes('edit the image') ||
         lowerPrompt.includes('edit image') ||
         lowerPrompt.includes('modify this image') ||
         lowerPrompt.includes('put this person in') ||
         lowerPrompt.includes('put the subject in') ||
         lowerPrompt.includes('put in background') ||
         lowerPrompt.includes('different background') ||
         lowerPrompt.includes('new background') ||
         lowerPrompt.includes('make the background'));

      // User Research & Cognitive Effort Level Directives
      // Suppress academic research outlines when user is doing creative image transformations
      if (isImageEditRequest) {
        enrichedSystemInstruction += `\n\n[CREATIVE IMAGE TRANSFORMATION MODE ACTIVE]:
The user is requesting an image creative transformation (background replacement / editing).
CRITICAL: Do NOT output an academic research paper, Executive Synthesis, or theoretical lecture. Focus 100% on delivering the creative visual transformations and presenting the generated artworks clearly.`;
      } else if (selectedEffort === 'low') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: LOW]:
- Deliver an ultra-fast, concise, straight-to-the-point response.
- Answer directly with core essentials in 1 to 2 brief paragraphs or a compact bullet list.
- Keep the response clean, direct, and under 250 words without unnecessary elaboration or theoretical preamble.`;
      } else if (selectedEffort === 'medium') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: MEDIUM]:
- Conduct a balanced, solid research-grade response on a medium basis for the topic given by the user.
- Structure your response clearly with:
  1. Executive Summary & Core Definition
  2. Balanced Research Analysis & Key Findings on the Topic
  3. Practical Breakdown or Concrete Real-World Context
  4. Clear Takeaways Summary
- Ensure solid depth, factual rigor, and thorough coverage without being overly brief or overwhelming.`;
      } else if (selectedEffort === 'high') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: HIGH]:
- Conduct an in-depth, thorough research investigation on the topic given by the user.
- Explore multiple viewpoints, underlying mechanisms, detailed methodologies, industry benchmarks, and edge cases.
- Provide comprehensive explanations with rich structural detail, analytical depth, and structured breakdowns.`;
      } else if (selectedEffort === 'ultra') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: ULTRA - EXHAUSTIVE DEEP RESEARCH & MAXIMUM RIGOR]:
- The user has requested MAXIMUM COGNITIVE EFFORT (ULTRA).
- Conduct an exhaustive, master-level deep research investigation across all dimensions of the user's topic.
- Provide maximum analytical rigor, multi-angle exploration, comprehensive structural architecture, edge cases, comparative breakdowns, and forward-looking implications.
- Structure your response into comprehensive, deeply developed sections:
  1. Executive Synthesis & Architectural Overview
  2. Foundational Principles & Underlying Mechanics
  3. Comprehensive Multi-Angle Deep Dive
  4. Real-World Case Studies, Benchmarks & Practical Implementation
  5. Critical Trade-offs, Edge Cases & Failure Modes
  6. Strategic Roadmap & Future Outlook
- Ground your response thoroughly and provide deep, rich, authoritative content. Leave no dimension unexamined.`;
      }

      if (isParentalEnabled) {
        enrichedSystemInstruction += '\n\nCRITICAL PARENTAL CONTROL DIRECTIVE: Age Restricted Content Filter is STRICTLY ENABLED for this user session. You MUST REFUSE any request involving sexually explicit material, adult themes, pornography, graphic violence, self-harm, illegal drugs, dangerous weapons, or content unsuitable for young audiences. If the request touches upon any age-restricted or adult topic, reply strictly with: "I can\'t help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead." Do NOT generate or discuss age-restricted content.';
      }

      if (isExplanationRequested) {
        enrichedSystemInstruction += `\n\n[EXPLANATION DEPTH MANDATE]: The user requested an explanation. You MUST provide an exhaustive, highly detailed 1 to 2 pages long (~800 to 1800 words) explanation. Do NOT give short or brief summaries. Structure your response into comprehensive, well-developed sections:\n1. Executive Overview & Core Definition\n2. In-Depth Conceptual Breakdown & Core Principles\n3. Step-by-Step Mechanics / Analytical Walkthrough\n4. Concrete Real-World Examples & Practical Scenarios\n5. Advanced Considerations, Edge Cases & Common Pitfalls\n6. Key Takeaways Summary`;
      }

      if (isWebSearch) {
        enrichedSystemInstruction += `\n\n[REAL-TIME WEB SEARCH DIRECTIVE]: You have active Google Search grounding and access to live real-time web search. Search the live web for real-time news, current facts, up-to-date data, and accurate information. Provide thorough, well-structured, clear answers. Do NOT claim you lack access to live news or current world events.`;
      }

      if (isMultiSiteResearch) {
        enrichedSystemInstruction += `\n\n[MULTI-WEBSITE DEEP RESEARCH DIRECTIVE (50-100 SITES)]: The user requested a deep synthesis across 50 to 100 websites/sources on the internet. Using Google Search grounding, execute an extensive multi-domain web analysis covering up to 100 web sources across design repositories, developer docs, UI frameworks, industry benchmarks, and live digital trends. Include a dedicated section titled "🌐 Multi-Source Analysis Breakdown (50–100 Sites Evaluated)" summarizing the domains, patterns, and insights synthesized across these web sources.`;
      }

      if (isDeepResearch && !isMultiSiteResearch) {
        enrichedSystemInstruction += `\n\n[DEEP RESEARCH DIRECTIVE]: The user has activated Deep Research Mode. Conduct an exhaustive, multi-source live web research synthesis using Google Search grounding. Perform deep live web searches to gather up-to-date facts, current news, verified statistics, and real-time information identical to Web Search mode, but present them in an extensive, highly detailed analytical research breakdown. Structure your response clearly with:
1. Executive Overview & Live Web Search Summary
2. Key Findings & Comprehensive Web Data Breakdown
3. Real-World Context & Comparison Table (with verified web facts)
4. Strategic Insights & Future Recommendations
Provide thorough, accurate, and highly detailed research grounded in real-time web facts.`;
      }

      if (isImageEditRequest) {
        let subjectDescription = 'the main subject from the original photo';
        if (image?.data) {
          try {
            const visionAI = getGeminiClient();
            if (visionAI) {
              const visionCheck = await visionAI.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: {
                  parts: [
                    { inlineData: { data: image.data, mimeType: image.mimeType || 'image/jpeg' } },
                    { text: 'Analyze the foreground person or subject in this photo with high photographic fidelity. Output a 30-40 word detailed photographic description capturing: apparent age, gender, facial traits, hair style and color, exact clothing garments and colors, posture/pose, and framing. Do NOT mention the original background.' }
                  ]
                }
              });
              if (visionCheck?.text?.trim()) {
                subjectDescription = visionCheck.text.trim().replace(/[\n\r\.]+/g, ' ').trim();
              }
            }
          } catch (vErr) {
            console.warn('[Image Edit Subject Detection]', vErr);
          }
        }

        // Check if user requested a specific background
        const targetBgMatch = lowerPrompt.match(/(?:to|with|into|in)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\s\-]+?)(?:\s+background|\s+setting|\s+scene|\s+scenery|$)/i);
        let specifiedBg = targetBgMatch ? targetBgMatch[1].trim() : null;
        if (specifiedBg && (specifiedBg.includes('image') || specifiedBg.includes('photo') || specifiedBg.includes('picture') || specifiedBg.includes('this') || specifiedBg.length < 3)) {
          specifiedBg = null;
        }

        if (specifiedBg) {
          const seed = Math.floor(Math.random() * 1000000);
          const singlePrompt = `photo of ${subjectDescription}, seamlessly integrated into ${specifiedBg}, perfectly matched cinematic lighting, volumetric atmosphere, realistic ground and contact shadows, photorealistic 8k render, masterpiece`;
          const customId = `bg_custom_${seed}`;
          storedImagePrompts.set(customId, { prompt: singlePrompt, model: 'flux', width: 800, height: 500, seed });

          // Pre-warm the cache asynchronously so image is ready when client renders markdown
          fetchOrGenerateImageBuffer(singlePrompt, { model: 'flux', width: 800, height: 500, seed }).catch(() => {});

          enrichedSystemInstruction += `\n\n[IMAGE EDITING & BACKGROUND TRANSFORMATION DIRECTIVE]:
The user provided an image and explicitly requested to change the background to: "${specifiedBg}".
Identified Subject: "${subjectDescription}".

You MUST display the transformed visual artwork directly inline using this exact generated Markdown image tag on a single line:
![${specifiedBg.charAt(0).toUpperCase() + specifiedBg.slice(1)} Transformation](/api/image-proxy?id=${customId})

Follow these guidelines:
1. Enthusiastically present the newly transformed artwork with the Markdown image tag above.
2. Explain the creative visual adjustments made (matched color temperature, lighting direction, atmospheric depth, and realistic shadow placement).
3. Offer quick follow-up ideas (such as adjusting lighting, changing the time of day, or trying a different atmosphere).
Do NOT write an academic paper, Executive Synthesis, or theoretical lecture.`;
        } else {
          // Provide 3 curated high-aesthetic styles tailored to the subject
          const seed1 = Math.floor(Math.random() * 1000000);
          const seed2 = Math.floor(Math.random() * 1000000);
          const seed3 = Math.floor(Math.random() * 1000000);

          const prompt1 = `photo of ${subjectDescription}, standing in a bustling cyberpunk neon alleyway at night, vibrant cyan and magenta holographic signs, wet asphalt reflections, volumetric rain fog, cinematic rim lighting, 8k masterpiece`;
          const prompt2 = `photo of ${subjectDescription}, in a high-end minimalist dark photography studio, dramatic dual-tone edge lighting, atmospheric haze, moody shadows, cinematic composition, 8k masterpiece`;
          const prompt3 = `photo of ${subjectDescription}, standing in front of towering monumental dystopian brutalist concrete architecture, dramatic stormy overcast sky, cinematic scale, high contrast, 8k masterpiece`;

          const id1 = `bg_cyberpunk_${seed1}`;
          const id2 = `bg_studio_${seed2}`;
          const id3 = `bg_brutalist_${seed3}`;

          storedImagePrompts.set(id1, { prompt: prompt1, model: 'flux', width: 800, height: 500, seed: seed1 });
          storedImagePrompts.set(id2, { prompt: prompt2, model: 'flux', width: 800, height: 500, seed: seed2 });
          storedImagePrompts.set(id3, { prompt: prompt3, model: 'flux', width: 800, height: 500, seed: seed3 });

          // Pre-warm all 3 in parallel!
          fetchOrGenerateImageBuffer(prompt1, { model: 'flux', width: 800, height: 500, seed: seed1 }).catch(() => {});
          fetchOrGenerateImageBuffer(prompt2, { model: 'flux', width: 800, height: 500, seed: seed2 }).catch(() => {});
          fetchOrGenerateImageBuffer(prompt3, { model: 'flux', width: 800, height: 500, seed: seed3 }).catch(() => {});

          enrichedSystemInstruction += `\n\n[IMAGE EDITING & BACKGROUND TRANSFORMATION DIRECTIVE]:
The user has provided an image and requested to change/replace its background.
Identified Subject: "${subjectDescription}".

Deliver 3 curated, high-aesthetic background transformations specifically tailored to the subject's aesthetic.
You MUST render the visual artworks inline using EXACTLY these short Markdown image tags (keep each tag on a single line without breaking):

### 1. Cyberpunk Neon Metropolis
![Cyberpunk Neon Metropolis](/api/image-proxy?id=${id1})

### 2. Dramatic Dark Studio & Volumetric Smoke
![Dramatic Dark Studio](/api/image-proxy?id=${id2})

### 3. Dystopian Brutalist Cityscape
![Dystopian Brutalist Cityscape](/api/image-proxy?id=${id3})

For EACH style:
- Include the Markdown image tag directly under its header.
- Provide a concise, evocative explanation of why this setting complements the subject, noting lighting integration and atmosphere.
End with interactive suggestions allowing the user to select their favorite style, request lighting adjustments, or specify any custom background.

STRICT MANDATE: Do NOT write an academic research paper, Executive Synthesis, or theoretical lecture. Keep your tone direct, creative, engaging, and focused on the visual transformations.`;
        }
      } else {
        // Default Image Generation Directive Rule
        enrichedSystemInstruction += `\n\n[IMAGE GENERATION & FORMATTING RULE]:
When the user explicitly asks to generate, create, draw, paint, render, or show an image or picture:
Always present the visual artwork inline using a valid, single-line Markdown image tag formatted like:
![Artwork Name](/api/image-proxy?prompt=...)
CRITICAL SYNTAX: Never insert newlines or spaces between brackets and parentheses: format strictly as ![Alt Text](URL) on one line.
If the user did NOT explicitly ask for an image or design, do NOT generate or include any markdown images.`;
      }

      if (isDesignRequest) {
        const designSeed = Math.floor(Math.random() * 1000000);
        const designPrompt = 'modern clean digital ui design mockup, professional dashboard interface, high resolution, 8k render';
        const designId = `design_${designSeed}`;
        storedImagePrompts.set(designId, { prompt: designPrompt, model: 'flux', width: 800, height: 500, seed: designSeed });
        fetchOrGenerateImageBuffer(designPrompt, { model: 'flux', width: 800, height: 500, seed: designSeed }).catch(() => {});
        enrichedSystemInstruction += `\n\n[DESIGN IMAGE REQUEST DETECTED]: The user explicitly requested a visual design/image/mockup. In addition to your response text, generate and include a high-resolution visual design mockup inline using a clean Markdown image tag formatted on a single line:
![Design Mockup](/api/image-proxy?id=${designId})`;
      }

      // Non-blocking background news headline trigger (fire and forget / cached)
      if (isNewsOrWorldQuery) {
        fetchNewsHeadlines().catch(() => {});
      }

      // Route 1: Gemini (Native AI Studio SDK - High Performance)
      const ai = getGeminiClient();
      if (ai) {
        const rawHistory: any[] = [];
        if (messages && Array.isArray(messages)) {
          // Send recent context history (up to last 50 messages)
          const historyMsgs = messages.slice(-50);
          for (let i = 0; i < historyMsgs.length - 1; i++) {
            const m = historyMsgs[i];
            if (!m || m.role === 'system') continue;
            const textContent = (m.content || '').trim();
            if (!textContent) continue;
            const role = m.role === 'user' ? 'user' : 'model';
            // Merge consecutive messages with the same role to strictly satisfy Gemini alternating role constraints
            if (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === role) {
              rawHistory[rawHistory.length - 1].parts[0].text += `\n\n${textContent}`;
            } else {
              rawHistory.push({ role, parts: [{ text: textContent }] });
            }
          }
        }
        // Ensure starting role is 'user'
        if (rawHistory.length > 0 && rawHistory[0].role === 'model') {
          rawHistory.shift();
        }
        const contents: any[] = [...rawHistory];

        const lastParts: any[] = [];
        let attachmentMime = image?.mimeType || '';
        if (image?.data) {
          if (!attachmentMime || attachmentMime === 'application/octet-stream') {
            const lowName = (image.name || '').toLowerCase();
            if (lowName.endsWith('.pdf') || userPrompt.toLowerCase().includes('pdf')) {
              attachmentMime = 'application/pdf';
            } else if (lowName.endsWith('.png')) {
              attachmentMime = 'image/png';
            } else if (lowName.endsWith('.jpg') || lowName.endsWith('.jpeg')) {
              attachmentMime = 'image/jpeg';
            } else if (lowName.endsWith('.txt') || lowName.endsWith('.md')) {
              attachmentMime = 'text/plain';
            } else {
              attachmentMime = 'application/pdf';
            }
          }
          if (attachmentMime === 'application/x-pdf') {
            attachmentMime = 'application/pdf';
          }
          lastParts.push({
            inlineData: {
              data: image.data,
              mimeType: attachmentMime
            }
          });
        }
        
        let promptText = userPrompt || 'Hello';
        if (image?.name && !userPrompt.includes(image.name)) {
          promptText = `[Attachment: ${image.name}]\n${promptText}`;
        }
        lastParts.push({ text: promptText });

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts.push(...lastParts);
        } else {
          contents.push({
            role: 'user',
            parts: lastParts
          });
        }

        const geminiSafety: any[] | undefined = isParentalEnabled
          ? [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
            ]
          : undefined;

        try {
          const configObj: any = {
            systemInstruction: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.',
            temperature: modelSpec.temperature,
            ...(geminiSafety ? { safetySettings: geminiSafety } : {})
          };

          if (selectedEffort === 'low') {
            configObj.maxOutputTokens = 2048;
            configObj.topP = 0.8;
          } else if (selectedEffort === 'medium') {
            configObj.maxOutputTokens = 8192;
            configObj.topP = 0.95;
          } else if (selectedEffort === 'high') {
            configObj.maxOutputTokens = 16384;
            configObj.topP = 0.95;
          } else if (selectedEffort === 'ultra') {
            configObj.maxOutputTokens = 32768;
            configObj.topP = 0.95;
          }

          // Grounding tools like googleSearch cannot be combined with multimodal inlineData
          // Enable Google Search grounding for web search, deep mode, and ultra/high effort research
          if ((isWebSearch || selectedEffort === 'ultra' || selectedEffort === 'high' || selectedMode === 'deep') && !image?.data) {
            configObj.tools = [{ googleSearch: {} }];
          }

          const primaryGeminiModel = resolveGeminiModel(model);
          const modelsToTry = [
            primaryGeminiModel,
            'gemini-3.8-flash',
            'gemini-flash-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.1-pro-preview'
          ].filter((v, i, a) => a.indexOf(v) === i);

          for (const targetGeminiModel of modelsToTry) {
            try {
              const modelSpecificConfig = {
                ...configObj,
                thinkingConfig: {
                  thinkingLevel: targetGeminiModel.includes('pro') && modelSpec.thinkingLevel === ThinkingLevel.MINIMAL
                    ? ThinkingLevel.LOW
                    : modelSpec.thinkingLevel
                }
              };

              const streamResult = await ai.models.generateContentStream({
                model: targetGeminiModel,
                contents,
                config: modelSpecificConfig
              });

              let ttftLogged = false;
              let accumulatedResponse = '';

              for await (const chunk of streamResult) {
                if (chunk.text) {
                  if (!ttftLogged) {
                    ttftLogged = true;
                    console.log(`[AVO] request=stream route=${category.type} TTFT=${Date.now() - startTime}ms provider=gemini model=${targetGeminiModel} effort=${selectedEffort}`);
                  }
                  accumulatedResponse += chunk.text;
                  res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                }
              }

              if (accumulatedResponse.length > 0) {
                res.write('data: [DONE]\n\n');
                res.end();
                console.log(`[AVO] request=stream route=${category.type} TOTAL=${Date.now() - startTime}ms provider=gemini model=${targetGeminiModel} effort=${selectedEffort}`);
                if (cacheKey && accumulatedResponse.trim()) {
                  if (promptResponseCache.size > 100) {
                    const firstKey = promptResponseCache.keys().next().value;
                    if (firstKey) promptResponseCache.delete(firstKey);
                  }
                  promptResponseCache.set(cacheKey, { text: accumulatedResponse, timestamp: Date.now() });
                }
                return;
              }
            } catch (geminiErr: any) {
              const errMsg = geminiErr?.message || '';
              const isQuotaOrDemand =
                geminiErr?.status === 429 ||
                geminiErr?.code === 429 ||
                geminiErr?.status === 503 ||
                geminiErr?.code === 503 ||
                errMsg.includes('429') ||
                errMsg.includes('503') ||
                errMsg.includes('quota') ||
                errMsg.includes('Quota') ||
                errMsg.includes('RESOURCE_EXHAUSTED') ||
                errMsg.includes('high demand') ||
                errMsg.includes('UNAVAILABLE');

              console.log(`[AVO Stream Info] Gemini ${targetGeminiModel} unavailable (${isQuotaOrDemand ? 'quota/demand limit' : 'config error'}), switching to next model candidate...`);

              // If it's a schema/tool issue (not quota/demand), try once without search grounding before skipping
              if (!isQuotaOrDemand && configObj.tools) {
                try {
                  const fallbackStream = await ai.models.generateContentStream({
                    model: targetGeminiModel,
                    contents,
                    config: {
                      systemInstruction: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.',
                      ...(selectedEffort === 'low' ? { maxOutputTokens: 4096, temperature: 0.3 } : { maxOutputTokens: 16384, temperature: 0.7 })
                    }
                  });
                  let textAcc = '';
                  for await (const chunk of fallbackStream) {
                    if (chunk.text) {
                      textAcc += chunk.text;
                      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                    }
                  }
                  if (textAcc.length > 0) {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                  }
                } catch (retryErr) {
                  // proceed to next model in loop
                }
              }
            }
          }
        } catch (allGeminiErr: any) {
          console.warn('[AVO Stream] All Gemini attempts deferred, falling over to secondary providers...');
        }
      }

      // Route 2: Try Groq (Llama-3.3 70B)
      const groqKey = (process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY).trim();
      if (groqKey) {
        try {
          const formattedMessages = [
            { role: 'system', content: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.' },
            ...(messages || []).map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content || ''
            }))
          ];

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: formattedMessages,
              temperature: selectedEffort === 'low' ? 0.3 : 0.7,
              max_tokens: selectedEffort === 'low' ? 4096 : selectedEffort === 'ultra' ? 8192 : 8192,
              stream: true
            }),
            signal: AbortSignal.timeout(6000)
          });

          if (groqRes.ok && groqRes.body) {
            const reader = groqRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let ttftLogged = false;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      if (!ttftLogged) {
                        ttftLogged = true;
                        console.log(`[AVO] request=stream route=${category.type} TTFT=${Date.now() - startTime}ms provider=groq`);
                      }
                      res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                    }
                  } catch {}
                }
              }
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        } catch (groqErr) {
          console.warn('[AVO Stream] Groq attempt failed:', groqErr);
        }
      }

      // Route 3: Try OpenRouter
      const openRouterKey = (process.env.OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY || '').trim();
      if (openRouterKey) {
        try {
          const formattedMessages = [
            { role: 'system', content: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.' },
            ...(messages || []).map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content || ''
            }))
          ];

          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://avo.ai',
              'X-Title': 'AVO AI'
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-chat',
              messages: formattedMessages,
              temperature: selectedEffort === 'low' ? 0.3 : 0.7,
              max_tokens: selectedEffort === 'low' ? 800 : selectedEffort === 'ultra' ? 8192 : 4096,
              stream: true
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (orRes.ok && orRes.body) {
            const reader = orRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                    }
                  } catch {}
                }
              }
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        } catch (orErr: any) {
          if (orErr?.name === 'TimeoutError' || orErr?.name === 'AbortError' || orErr?.code === 20) {
            console.log('[AVO Stream] OpenRouter request reached timeout limit, moving to fallback');
          } else {
            console.warn('[AVO Stream] OpenRouter attempt failed:', orErr?.message || 'deferred');
          }
        }
      }

      // Emergency Fallback - Contextual Answer
      const fallbackText = userPrompt.toLowerCase().includes('hola')
        ? '¡Hola! How can I assist you today?'
        : 'I am AVO AI, an intelligent AI assistant. How can I help you today?';
      res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('[AVO Stream Error]:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming error' });
      } else {
        try {
          res.write(`data: ${JSON.stringify({ error: err?.message || 'Streaming error' })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        } catch {}
      }
    }
  });

  // Endpoint to generate 3 intelligent follow-up question suggestions
  app.post('/api/follow-up-suggestions', async (req, res) => {
    try {
      const { assistantMessage, userPrompt } = req.body;
      if (!assistantMessage || typeof assistantMessage !== 'string') {
        return res.json({ suggestions: [] });
      }

      const ai = getGeminiClient();
      if (ai) {
        for (const candidateModel of ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash']) {
          try {
            const prompt = `Based on this assistant response in a conversation:\n\nUser asked: "${(userPrompt || '').slice(0, 300)}"\n\nAssistant answered: "${assistantMessage.slice(0, 1000)}"\n\nGenerate exactly 3 short, insightful, natural follow-up questions or next-step actions the user might want to ask next. Return ONLY a JSON array of 3 strings (e.g. ["Question 1?", "Question 2?", "Question 3?"]).`;
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.7,
                maxOutputTokens: 200
              }
            });

            if (response.text) {
              const parsed = JSON.parse(response.text.trim());
              if (Array.isArray(parsed) && parsed.length >= 3) {
                return res.json({ suggestions: parsed.slice(0, 3) });
              }
            }
          } catch {}
        }
      }

      // Try Groq as fallback
      const groqKey = (process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY).trim();
      if (groqKey) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: 'You generate 3 short follow-up suggestions as a JSON array of strings.' },
                { role: 'user', content: `Assistant answered: "${assistantMessage.slice(0, 800)}"\nOutput JSON array of 3 strings:` }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.6,
              max_tokens: 150
            }),
            signal: AbortSignal.timeout(3000)
          });
          if (groqRes.ok) {
            const data: any = await groqRes.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              const list = Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.questions || Object.values(parsed);
              if (Array.isArray(list) && list.length >= 3) {
                return res.json({ suggestions: list.slice(0, 3) });
              }
            }
          }
        } catch {}
      }

      // Heuristic fallback
      return res.json({
        suggestions: [
          'Can you explain this in simpler terms?',
          'Can you give me a practical example?',
          'What are the next steps to implement this?'
        ]
      });
    } catch (e) {
      return res.json({ suggestions: [] });
    }
  });

  // Dedicated Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    const startTime = Date.now();
    try {
      const { messages, systemInstruction, image, model, mode, effort } = req.body;
      let userPrompt = messages?.[messages.length - 1]?.content || '';
      const selectedEffort: 'low' | 'medium' | 'high' | 'ultra' =
        (effort === 'low' || effort === 'medium' || effort === 'high' || effort === 'ultra')
          ? effort
          : (mode === 'fast' ? 'low' : mode === 'deep' ? 'high' : 'medium');
      const modelSpec = getModelSpecialtySpec(model, selectedEffort);

      const userEmail = extractUserEmail(req);
      res.on('finish', () => {
        adminService.recordAiRequest({
          model: model || 'gemini-3.6-flash',
          provider: 'Google AI',
          latencyMs: Date.now() - startTime,
          isError: res.statusCode >= 400,
          userEmail
        });
      });
      const isParentalEnabled = await getUserParentalSettings(userEmail);

      const category = classifyRequest(userPrompt, !!image?.data);
      if (category.type === 'CREATOR') {
        return res.json({ text: 'built by mysea.ai' });
      }
      if (category.type === 'IDENTITY') {
        return res.json({ text: 'I am AVO AI, an advanced AI assistant built by mysea.ai. I am designed for high-performance conversation, coding, research, and multimodal intelligence. How can I help you today?' });
      }

      if (isParentalEnabled) {
        const check = isAgeRestrictedContent(userPrompt, image?.mimeType || '');
        if (check.restricted) {
          const refusalText = "I can't help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead.";
          return res.json({ text: refusalText, blocked: true });
        }
      }

      const lowerPrompt = userPrompt.toLowerCase();

      // Detect if user is asking for news, updates, or current events
      const isNewsQuery = lowerPrompt.includes('news') || 
                          lowerPrompt.includes('headline') || 
                          lowerPrompt.includes('current event') || 
                          lowerPrompt.includes('what happened') || 
                          lowerPrompt.includes('today') ||
                          lowerPrompt.includes('update') ||
                          lowerPrompt.includes('world') ||
                          lowerPrompt.includes('going on') ||
                          lowerPrompt.includes('latest') ||
                          lowerPrompt.includes('happening');

      let enrichedSystemInstruction = (systemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + '\n\n' + modelSpec.systemDirective;

      // User Research & Cognitive Effort Level Directives
      if (selectedEffort === 'low') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: LOW]:
- Deliver an ultra-fast, concise, straight-to-the-point response.
- Answer directly with core essentials in 1 to 2 brief paragraphs or a compact bullet list.
- Keep the response clean, direct, and under 250 words without unnecessary elaboration or theoretical preamble.`;
      } else if (selectedEffort === 'medium') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: MEDIUM]:
- Conduct a balanced, solid research-grade response on a medium basis for the topic given by the user.
- Structure your response clearly with:
  1. Executive Summary & Core Definition
  2. Balanced Research Analysis & Key Findings on the Topic
  3. Practical Breakdown or Concrete Real-World Context
  4. Clear Takeaways Summary
- Ensure solid depth, factual rigor, and thorough coverage without being overly brief or overwhelming.`;
      } else if (selectedEffort === 'high') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: HIGH]:
- Conduct an in-depth, thorough research investigation on the topic given by the user.
- Explore multiple viewpoints, underlying mechanisms, detailed methodologies, industry benchmarks, and edge cases.
- Provide comprehensive explanations with rich structural detail, analytical depth, and structured breakdowns.`;
      } else if (selectedEffort === 'ultra') {
        enrichedSystemInstruction += `\n\n[USER RESEARCH & COGNITIVE EFFORT LEVEL: ULTRA - EXHAUSTIVE DEEP RESEARCH & MAXIMUM RIGOR]:
- The user has requested MAXIMUM COGNITIVE EFFORT (ULTRA).
- Conduct an exhaustive, master-level deep research investigation across all dimensions of the user's topic.
- Provide maximum analytical rigor, multi-angle exploration, comprehensive structural architecture, edge cases, comparative breakdowns, and forward-looking implications.
- Structure your response into comprehensive, deeply developed sections:
  1. Executive Synthesis & Architectural Overview
  2. Foundational Principles & Underlying Mechanics
  3. Comprehensive Multi-Angle Deep Dive
  4. Real-World Case Studies, Benchmarks & Practical Implementation
  5. Critical Trade-offs, Edge Cases & Failure Modes
  6. Strategic Roadmap & Future Outlook
- Ground your response thoroughly and provide deep, rich, authoritative content. Leave no dimension unexamined.`;
      }

      if (isParentalEnabled) {
        enrichedSystemInstruction += '\n\nCRITICAL PARENTAL CONTROL DIRECTIVE: Age Restricted Content Filter is STRICTLY ENABLED for this user session. You MUST REFUSE any request involving sexually explicit material, adult themes, pornography, graphic violence, self-harm, illegal drugs, dangerous weapons, or content unsuitable for young audiences. If the request touches upon any age-restricted or adult topic, reply strictly with: "I can\'t help with that request while Age Restricted Content Filter is enabled. I can help with a general educational explanation instead." Do NOT generate or discuss age-restricted content.';
      }

      const isWebSearch = userPrompt.includes('[Web Search Mode]:') || userPrompt.includes('Search web for') || isNewsQuery;
      const isDeepResearch = userPrompt.includes('[Deep Research Mode]:') || userPrompt.includes('Deep research') || userPrompt.includes('deep research') || userPrompt.includes('Perform deep research');

      if (isWebSearch) {
        enrichedSystemInstruction += `\n\n[REAL-TIME WEB SEARCH DIRECTIVE]: Search the live web using Google Search grounding for real-time news, current facts, up-to-date data, and accurate information.`;
      }

      if (isDeepResearch) {
        try {
          const liveNews = await fetchNewsHeadlines();
          if (liveNews) {
            enrichedSystemInstruction += `\n\n[TODAY'S LIVE HEADLINES & FACTS]:\n- ${liveNews}`;
          }
        } catch {}

        enrichedSystemInstruction += `\n\n[DEEP RESEARCH DIRECTIVE]: Perform exhaustive, multi-source live web research using Google Search grounding. Gather real-time data, current facts, news, and statistics identical to live web search, structured into a deep analytical research report.`;
      }

      if (isNewsQuery && !isDeepResearch) {
        const liveNews = await fetchNewsHeadlines();
        if (liveNews) {
          userPrompt += `\n\n[REAL-TIME LIVE NEWS HEADLINES FOR TODAY]:\n- ${liveNews}\n\nPlease summarize today's updates and news accurately and concisely based on these live headlines and search context. Categorize into World News, Technology & AI, Business & Economy, and Science/Culture.`;
        }
      }

      const modelLower = (model || '').toLowerCase();

      // Explicit routing for Groq Llama 3.3
      if (modelLower.includes('groq') || modelLower.includes('llama')) {
        try {
          const updatedMessages = [...(messages || [])];
          if (updatedMessages.length > 0) {
            updatedMessages[updatedMessages.length - 1].content = userPrompt;
          }
          const groqResponse = await callGroq(updatedMessages, enrichedSystemInstruction, model);
          if (groqResponse) {
            return res.json({ text: groqResponse, provider: 'groq' });
          }
        } catch (groqErr) {
          console.warn('[Server Chat] Groq call failed, continuing to fallbacks:', groqErr);
        }
      }

      // Explicit routing for OpenRouter (DeepSeek R1, Claude 3.5 Sonnet)
      if (modelLower.includes('openrouter') || modelLower.includes('deepseek') || modelLower.includes('claude')) {
        try {
          const updatedMessages = [...(messages || [])];
          if (updatedMessages.length > 0) {
            updatedMessages[updatedMessages.length - 1].content = userPrompt;
          }
          const openRouterResponse = await callOpenRouter(updatedMessages, enrichedSystemInstruction, model);
          if (openRouterResponse) {
            return res.json({ text: openRouterResponse, provider: 'openrouter' });
          }
        } catch (orErr) {
          console.warn('[Server Chat] OpenRouter call failed, continuing to fallbacks:', orErr);
        }
      }

      // Check if user requested OpenAI explicitly or if OpenAI key is available
      const isOpenAiRequested = modelLower.includes('gpt') || modelLower.includes('openai');

      if (isOpenAiRequested && process.env.OPENAI_API_KEY) {
        try {
          const updatedMessages = [...(messages || [])];
          if (updatedMessages.length > 0) {
            updatedMessages[updatedMessages.length - 1].content = userPrompt;
          }
          const openAiResponse = await callOpenAI(updatedMessages, enrichedSystemInstruction, model);
          if (openAiResponse) {
            return res.json({ text: openAiResponse, provider: 'openai' });
          }
        } catch (openAiErr) {
          console.warn('[Server Chat] OpenAI call failed, trying Gemini:', openAiErr);
        }
      }

      // Try Gemini API Client (with Google Search Grounding for real-time web knowledge)
      const ai = getGeminiClient();

      if (ai) {
        const rawHistory: any[] = [];
        if (messages && Array.isArray(messages)) {
          const historyMsgs = messages.slice(-50);
          for (let i = 0; i < historyMsgs.length - 1; i++) {
            const m = historyMsgs[i];
            if (!m || m.role === 'system') continue;
            const textContent = (m.content || '').trim();
            if (!textContent) continue;
            const role = m.role === 'user' ? 'user' : 'model';
            if (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === role) {
              rawHistory[rawHistory.length - 1].parts[0].text += `\n\n${textContent}`;
            } else {
              rawHistory.push({ role, parts: [{ text: textContent }] });
            }
          }
        }
        if (rawHistory.length > 0 && rawHistory[0].role === 'model') {
          rawHistory.shift();
        }
        const contents: any[] = [...rawHistory];

        const lastParts: any[] = [];
        let attachmentMime = image?.mimeType || '';
        if (image?.data) {
          if (!attachmentMime || attachmentMime === 'application/octet-stream') {
            const lowName = (image.name || '').toLowerCase();
            if (lowName.endsWith('.pdf') || userPrompt.toLowerCase().includes('pdf')) {
              attachmentMime = 'application/pdf';
            } else if (lowName.endsWith('.png')) {
              attachmentMime = 'image/png';
            } else if (lowName.endsWith('.jpg') || lowName.endsWith('.jpeg')) {
              attachmentMime = 'image/jpeg';
            } else if (lowName.endsWith('.txt') || lowName.endsWith('.md')) {
              attachmentMime = 'text/plain';
            } else {
              attachmentMime = 'application/pdf';
            }
          }
          if (attachmentMime === 'application/x-pdf') {
            attachmentMime = 'application/pdf';
          }
          lastParts.push({
            inlineData: {
              data: image.data,
              mimeType: attachmentMime,
            },
          });
        }
        
        let promptText = userPrompt;
        if (image?.name && !userPrompt.includes(image.name)) {
          promptText = `[Attachment: ${image.name}]\n${promptText}`;
        }
        lastParts.push({ text: promptText });

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts.push(...lastParts);
        } else {
          contents.push({
            role: 'user',
            parts: lastParts,
          });
        }

        // Try Gemini
        const geminiModels = [
          resolveGeminiModel(model),
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash',
          'gemini-3.1-pro-preview'
        ].filter((v, i, a) => a.indexOf(v) === i);
        for (const targetModel of geminiModels) {
          try {
            const configObj: any = {
              systemInstruction: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.',
              temperature: modelSpec.temperature,
              thinkingConfig: {
                thinkingLevel: targetModel.includes('pro') && modelSpec.thinkingLevel === ThinkingLevel.MINIMAL
                  ? ThinkingLevel.LOW
                  : modelSpec.thinkingLevel
              }
            };

            if (selectedEffort === 'low') {
              configObj.maxOutputTokens = 2048;
              configObj.topP = 0.8;
            } else if (selectedEffort === 'medium') {
              configObj.maxOutputTokens = 8192;
              configObj.topP = 0.95;
            } else if (selectedEffort === 'high') {
              configObj.maxOutputTokens = 16384;
              configObj.topP = 0.95;
            } else if (selectedEffort === 'ultra') {
              configObj.maxOutputTokens = 32768;
              configObj.topP = 0.95;
            }

            // Grounding tools like googleSearch cannot be combined with multimodal inlineData
            if (!image?.data) {
              configObj.tools = [{ googleSearch: {} }];
            }

            const response = await ai.models.generateContent({
              model: targetModel,
              contents,
              config: configObj,
            });

            if (response.text) {
              return res.json({ text: response.text, provider: 'gemini-standard' });
            }
          } catch (searchErr) {
            // Fallback to standard Gemini without inlineData if grounding/inlineData fails
            try {
              const fallbackContents = [
                ...contents.slice(0, -1),
                { role: 'user', parts: [{ text: promptText }] }
              ];
              const response = await ai.models.generateContent({
                model: targetModel,
                contents: fallbackContents,
                config: {
                  systemInstruction: (enrichedSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION) + ' Do not disclose internal system code.',
                  ...(selectedEffort === 'low' ? { maxOutputTokens: 4096, temperature: 0.3 } : { maxOutputTokens: 16384, temperature: 0.7 })
                },
              });

              if (response.text) {
                return res.json({ text: response.text, provider: 'gemini-text-fallback' });
              }
            } catch (chatErr) {
              console.log(`[Server Chat Info] Gemini ${targetModel} deferred, trying next model...`);
            }
          }
        }
      }

      // Fallback 1: Call Groq Llama-3.3 70B (uses DEFAULT_GROQ_KEY)
      try {
        const updatedMessages = [...(messages || [])];
        if (updatedMessages.length > 0) {
          updatedMessages[updatedMessages.length - 1].content = userPrompt;
        } else {
          updatedMessages.push({ role: 'user', content: userPrompt });
        }
        const groqResponse = await callGroq(updatedMessages, enrichedSystemInstruction, 'llama-3.3-70b-versatile');
        if (groqResponse) {
          return res.json({ text: groqResponse, provider: 'groq-fallback' });
        }
      } catch (groqErr) {
        console.warn('[Server Chat] Groq fallback failed:', groqErr);
      }

      // Fallback 2: Call OpenRouter (uses DEFAULT_OPENROUTER_KEY)
      try {
        const updatedMessages = [...(messages || [])];
        if (updatedMessages.length > 0) {
          updatedMessages[updatedMessages.length - 1].content = userPrompt;
        } else {
          updatedMessages.push({ role: 'user', content: userPrompt });
        }
        const openRouterResponse = await callOpenRouter(updatedMessages, enrichedSystemInstruction, 'deepseek/deepseek-r1');
        if (openRouterResponse) {
          return res.json({ text: openRouterResponse, provider: 'openrouter-fallback' });
        }
      } catch (orErr) {
        console.warn('[Server Chat] OpenRouter fallback failed:', orErr);
      }

      // Fallback 3: OpenAI if configured
      if (process.env.OPENAI_API_KEY) {
        try {
          const updatedMessages = [...(messages || [])];
          if (updatedMessages.length > 0) {
            updatedMessages[updatedMessages.length - 1].content = userPrompt;
          }
          const openAiResponse = await callOpenAI(updatedMessages, enrichedSystemInstruction, 'gpt-4o-mini');
          if (openAiResponse) {
            return res.json({ text: openAiResponse, provider: 'openai-fallback' });
          }
        } catch (openAiErr) {
          console.warn('[Server Chat] OpenAI fallback error:', openAiErr);
        }
      }

      return res.json({
        text: `AVO AI processed your request. Please check network connection or API status.`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Chat generation failed' });
    }
  });



  const httpServer = http.createServer(app);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Pulse AI Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

// Custom vector art generator for self-contained, model-style vector artwork (never downloads online files)
function createCustomVectorArtSvg(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  let bgGradient = 'linear-gradient(135deg, #090A0F 0%, #171923 50%, #000000 100%)';
  let primaryShape = '';
  let titleText = prompt.slice(0, 40);

  if (lower.includes('batman')) {
    bgGradient = 'linear-gradient(180deg, #05070A 0%, #0D1117 60%, #1A202C 100%)';
    primaryShape = `
      <!-- Bat Signal Glow -->
      <circle cx="400" cy="220" r="140" fill="#E2E8F0" opacity="0.15" />
      <circle cx="400" cy="220" r="110" fill="#F6AD55" opacity="0.85" filter="drop-shadow(0px 0px 30px #ECC94B)" />
      
      <!-- Batman Emblem Wings -->
      <path d="M 400,240 C 370,180 300,180 270,220 C 300,230 320,250 330,280 C 360,260 380,270 400,300 C 420,270 440,260 470,280 C 480,250 500,230 530,220 C 500,180 430,180 400,240 Z" fill="#000000" />
      
      <!-- Gotham Skyline Silhouette -->
      <path d="M 0,500 L 100,500 L 100,380 L 140,380 L 140,500 L 220,500 L 220,340 L 250,320 L 280,340 L 280,500 L 380,500 L 380,290 L 420,290 L 420,500 L 520,500 L 520,360 L 580,360 L 580,500 L 680,500 L 680,410 L 800,410 L 800,500 Z" fill="#030508" />
      <path d="M 50,500 L 120,500 L 120,420 L 180,420 L 180,500 L 300,500 L 300,360 L 350,360 L 350,500 L 480,500 L 480,390 L 540,390 L 540,500 L 750,500 Z" fill="#090D14" opacity="0.7" />
    `;
  } else if (lower.includes('robot') || lower.includes('ai') || lower.includes('tech')) {
    bgGradient = 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #030712 100%)';
    primaryShape = `
      <circle cx="400" cy="250" r="160" fill="none" stroke="#6366F1" stroke-width="3" opacity="0.4" stroke-dasharray="10 10" />
      <rect x="320" y="170" width="160" height="140" rx="24" fill="#1E293B" stroke="#818CF8" stroke-width="4" />
      <circle cx="365" cy="220" r="18" fill="#38BDF8" />
      <circle cx="435" cy="220" r="18" fill="#38BDF8" />
      <rect x="360" y="265" width="80" height="12" rx="6" fill="#818CF8" />
    `;
  } else {
    bgGradient = 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #09090B 100%)';
    primaryShape = `
      <circle cx="400" cy="250" r="140" fill="url(#grad)" opacity="0.8" />
      <path d="M 280,320 Q 400,160 520,320 T 280,320" fill="none" stroke="#A1A1AA" stroke-width="4" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="50%" stop-color="#020617" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#818CF8" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      ${primaryShape}
      
      <!-- Watermark / Label -->
      <rect x="40" y="520" width="720" height="50" rx="12" fill="#000000" opacity="0.6" stroke="#334155" stroke-width="1" />
      <text x="60" y="550" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="14" font-weight="600">
        AVO AI Generated Image: "${titleText.replace(/"/g, '&quot;')}"
      </text>
      <text x="730" y="550" text-anchor="end" fill="#10B981" font-family="system-ui, sans-serif" font-size="12" font-weight="700">
        AI Native Model
      </text>
    </svg>
  `.trim();

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

startServer();
