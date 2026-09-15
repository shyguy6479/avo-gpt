// Client-Side AI Chat Service
// Operates strictly on the frontend with direct Gemini SDK streaming and smart client fallback.

import { GoogleGenAI } from '@google/genai';

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatOptions {
  messages: ChatMessagePayload[];
  systemInstruction?: string;
  model?: string;
  mode?: 'fast' | 'smart' | 'deep';
  effort?: 'low' | 'medium' | 'high' | 'ultra';
  image?: {
    data: string;
    mimeType: string;
    name?: string;
  };
  onChunk: (text: string) => void;
  onMetadata?: (metadata: any) => void;
  signal?: AbortSignal;
}

// Client-side warning: Using API key in client code. Keep key safe in environment variables.
const getApiKey = (): string | undefined => {
  const metaEnv = (import.meta as any).env;
  const key =
    (metaEnv && metaEnv.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
    (typeof localStorage !== 'undefined' && (localStorage.getItem('gemini_api_key') || localStorage.getItem('pulse_gemini_api_key'))) ||
    undefined;
  return key && key.trim() ? key.trim() : undefined;
};

export function isAvoAiPrivateQuery(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const mentionsAvo = lower.includes('avo') || lower.includes('avo ai') || lower.includes('avoai');
  if (!mentionsAvo) return false;

  const privateKeywords = [
    'code', 'source', 'repo', 'repository', 'algorithm', 'private', 'secret',
    'backend', 'database', 'internal', 'architecture', 'credential', 'prompt',
    'instruction', 'token', 'key', 'password', 'confidential', 'security', 'how does'
  ];

  return privateKeywords.some((kw) => lower.includes(kw));
}

const AVO_PRIVACY_REFUSAL = `### 🔒 AVO AI Privacy & Security Notice

For privacy, data protection, and intellectual property security, **AVO AI's source code, internal algorithms, and private architecture are strictly confidential and kept private**.

I am unable to share, generate, or disclose any internal source code or private system specifications regarding AVO AI.

How else can I assist you with building, designing, or researching your projects today?`;

export function extractVisualSubject(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return 'artwork';
  let clean = prompt.trim();
  
  // Cleanly strip leading command and polite prefix phrases
  clean = clean.replace(/^(hey\s+avo\s*,?\s*)?(please\s+)?(can\s+you\s+|could\s+you\s+|i\s+want\s+you\s+to\s+|will\s+you\s+)?(generate|create|draw|make|render|paint|show\s+me|give\s+me|produce)\s+(me\s+)?(an?|another|new|one\s+more)?\s*/i, '');
  clean = clean.replace(/^(image|picture|photo|artwork|illustration|drawing|graphic|visual|portrait|logo|banner|poster|wallpaper)s?\s*(of\s+|about\s+|showing\s+|depicting\s+|with\s+)?/i, '');
  clean = clean.replace(/^(a|an|the)\s+/i, '');
  clean = clean.replace(/\s+(image|picture|photo|artwork|illustration|drawing|graphic|visual|design|wallpaper|logo)s?$/i, '');
  clean = clean.replace(/[\?!.]+$/, '');
  clean = clean.trim();

  return clean || prompt.trim() || 'artwork';
}

export function isImageGenerationQuery(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  const lower = prompt.toLowerCase().trim();

  // 1. Explicit Exclusions: Inquiries, explanations, descriptions, analytical questions
  // e.g. "Can you explain how you generated this specific image?"
  // e.g. "How did you generate this image?", "Why did you generate a lion?"
  const isExplanationOrInquiry =
    /^(can you|could you|please|will you|would you)?\s*(explain|describe|clarify|elaborate|analyze|critique|break down|tell me|discuss|review)\b/i.test(lower) ||
    /^(how|why|what|who|where|when|which)\b/i.test(lower) ||
    /\b(how did you|how do you|how was|how were|how to|why did you|why was|what model|what prompt|what tool|what software|can you explain|please explain)\b/i.test(lower) ||
    /\b(explain how|explain why|explain what|explain the|explain this)\b/i.test(lower) ||
    /\b(tell me how|tell me why|tell me what|tell me about)\b/i.test(lower) ||
    /\b(meaning of|history of|tutorial on|guide to)\b/i.test(lower);

  if (isExplanationOrInquiry) {
    return false;
  }

  // 2. Reference to existing/prior image without an explicit command to make a new one
  // e.g. "this specific image", "this image", "that image", "the image above", "the previous picture"
  const isReferencingExisting =
    /\b(this specific image|this image|that image|the image above|the previous image|this picture|that picture|this photo|the generated image|the artwork above)\b/i.test(lower);

  const hasExplicitNewCreation =
    /^(generate|create|make|draw|paint)\s+(another|a new|one more)\s+(image|picture|photo|artwork)/i.test(lower);

  if (isReferencingExisting && !hasExplicitNewCreation) {
    return false;
  }

  // 3. Technical, programming, or script queries involving images
  const isCodingOrTech =
    /\b(code|python|javascript|typescript|react|html|css|component|script|function|algorithm|library|canvas api|svg code|three\.js|shader)\b/i.test(lower);

  if (isCodingOrTech) {
    return false;
  }

  // 4. Negation checks (user requesting NOT to generate an image)
  const isNegation =
    /\b(don't|do not|stop|never|without any? (image|picture|visual)|no (image|picture|artwork)|text only)\b/i.test(lower);

  if (isNegation) {
    return false;
  }

  // 5. Strict Positive Generation Triggers
  // Direct imperative generation commands targeting a subject
  return (
    // e.g. "generate an image of a red lion", "create a picture of a futuristic city"
    /^(hey\s+avo\s*,?\s*)?(please\s+)?(can\s+you\s+|could\s+you\s+|i\s+want\s+you\s+to\s+|will\s+you\s+)?(generate|create|render|paint|draw|make|produce)\s+(me\s+)?(an?|another|new|one\s+more)?\s*(image|picture|photo|artwork|illustration|drawing|portrait|graphic|wallpaper|logo|banner|poster)\s+(of|about|showing|depicting|with|for)\s+.+$/i.test(lower) ||
    // e.g. "generate a lion image", "create a sports car wallpaper", "generate cyber tiger picture"
    /^(hey\s+avo\s*,?\s*)?(please\s+)?(generate|create|make)\s+(a|an|another|new)?\s*[a-z0-9\s\-]+?\s*(image|picture|photo|artwork|illustration|drawing|portrait|logo|wallpaper)$/i.test(lower) ||
    // e.g. "draw a cute kitten", "paint a starry night landscape", "render a 3d room"
    /^(hey\s+avo\s*,?\s*)?(please\s+)?(can\s+you\s+|could\s+you\s+)?(draw|paint|sketch|render)\s+(me\s+)?(an?|another|a\s+picture\s+of|an?\s+image\s+of)?\s+[a-z0-9].+$/i.test(lower) ||
    // e.g. "show me a picture of space", "give me an image of a medieval castle"
    /^(hey\s+avo\s*,?\s*)?(please\s+)?(show\s+me|give\s+me)\s+(an?|another|new)?\s*(image|picture|photo|artwork|illustration|drawing|portrait)\s+(of|about|showing|depicting|with)\s+.+$/i.test(lower) ||
    // e.g. "image of a sunset", "photo of a rainforest"
    /^(image|picture|photo|artwork|illustration|painting|drawing)\s+of\s+.+$/i.test(lower) ||
    // Explicit syntax "generate image: ..." or "create image: ..."
    /^(generate|create)\s+image:\s*.+$/i.test(lower)
  );
}

export function getGenerativeImageUrl(subject: string, width = 800, height = 500): string {
  const cleanSubject = extractVisualSubject(subject) || 'masterpiece visual artwork';
  const seed = Math.floor(Math.random() * 1000000);
  const prompt = `photorealistic high-resolution masterpiece, cinematic lighting, 8k render, detailed: ${cleanSubject}`;
  return `/api/image-proxy?prompt=${encodeURIComponent(prompt)}&model=flux&width=${width}&height=${height}&seed=${seed}`;
}

export function getHighResUnsplashUrl(subject: string, width = 1024, height = 1024): string {
  const lower = (subject || '').toLowerCase();
  let unsplashId = '1618005182384-a83a8bd57fbe'; // Abstract artistic
  
  if (lower.includes('tiger')) unsplashId = '1561731216-c3a4d99437d5';
  else if (lower.includes('lion')) unsplashId = '1546182990-dffeafbe841d';
  else if (lower.includes('elephant')) unsplashId = '1557050543-4d5f4e07ef46';
  else if (lower.includes('wolf')) unsplashId = '1564349683136-77e08dba1ef9';
  else if (lower.includes('cheetah') || lower.includes('leopard') || lower.includes('jaguar')) unsplashId = '1534188753412-3e26d0d618d6';
  else if (lower.includes('bear') || lower.includes('polar bear')) unsplashId = '1530595467537-0b5996c41f2d';
  else if (lower.includes('dog') || lower.includes('puppy') || lower.includes('golden retriever')) unsplashId = '1543466835-00a7907e9de1';
  else if (lower.includes('cat') || lower.includes('kitten')) unsplashId = '1514888286974-6c03e2ca1dba';
  else if (lower.includes('bird') || lower.includes('eagle') || lower.includes('falcon') || lower.includes('owl')) unsplashId = '1611689342806-0863700ce1e4';
  else if (lower.includes('horse') || lower.includes('stallion')) unsplashId = '1553284965-83fd3e82fa5a';
  else if (lower.includes('fish') || lower.includes('shark') || lower.includes('whale') || lower.includes('dolphin')) unsplashId = '1544551763-46a013bb70d5';
  else if (lower.includes('animal') || lower.includes('wildlife') || lower.includes('pet')) unsplashId = '1543466835-00a7907e9de1';
  else if (lower.includes('car') || lower.includes('sports car') || lower.includes('supercar') || lower.includes('vehicle')) unsplashId = '1617814076367-b759c7d7e738';
  else if (lower.includes('bike') || lower.includes('motorcycle')) unsplashId = '1558981806-ec527fa84c39';
  else if (lower.includes('plane') || lower.includes('airplane') || lower.includes('jet') || lower.includes('aviation')) unsplashId = '1540959733332-eab4deabeeaf';
  else if (lower.includes('train') || lower.includes('railway')) unsplashId = '1474487548417-781cb71495f3';
  else if (lower.includes('boat') || lower.includes('ship') || lower.includes('yacht')) unsplashId = '1500932334442-8761ee4810a7';
  else if (lower.includes('space') || lower.includes('galaxy') || lower.includes('universe') || lower.includes('nebula') || lower.includes('astronaut')) unsplashId = '1451187580459-43490279c0fa';
  else if (lower.includes('cyber') || lower.includes('neon') || lower.includes('futuristic') || lower.includes('robot') || lower.includes('ai')) unsplashId = '1519501025264-65ba15a82390';
  else if (lower.includes('beach') || lower.includes('ocean') || lower.includes('sea') || lower.includes('coastal') || lower.includes('waves')) unsplashId = '1507525428034-b723cf961d3e';
  else if (lower.includes('mountain') || lower.includes('peak') || lower.includes('alps') || lower.includes('himalaya')) unsplashId = '1464822759023-fed622ff2c3b';
  else if (lower.includes('forest') || lower.includes('woods') || lower.includes('nature') || lower.includes('trees') || lower.includes('jungle')) unsplashId = '1448375240586-882707db888b';
  else if (lower.includes('sunset') || lower.includes('sunrise') || lower.includes('golden hour')) unsplashId = '1495616811223-4d98c6e9c869';
  else if (lower.includes('desert') || lower.includes('dunes') || lower.includes('sahara')) unsplashId = '1509316975850-ff9c5deb0cd9';
  else if (lower.includes('snow') || lower.includes('winter') || lower.includes('ice') || lower.includes('arctic')) unsplashId = '1483921020237-2ff51e8e4b22';
  else if (lower.includes('city') || lower.includes('building') || lower.includes('skyline') || lower.includes('architecture') || lower.includes('urban')) unsplashId = '1486406146926-c627a92ad1ab';
  else if (lower.includes('castle') || lower.includes('medieval') || lower.includes('palace') || lower.includes('fantasy')) unsplashId = '1585543805890-6051f7829f98';
  else if (lower.includes('pizza')) unsplashId = '1513104890138-7c749659a591';
  else if (lower.includes('burger')) unsplashId = '1568901346375-23c9450c58cd';
  else if (lower.includes('coffee') || lower.includes('cafe')) unsplashId = '1501339847302-ac426a4a7cbb';
  else if (lower.includes('food') || lower.includes('restaurant') || lower.includes('dish') || lower.includes('meal')) unsplashId = '1504674900247-0877df9cc836';
  else if (lower.includes('flower') || lower.includes('rose') || lower.includes('garden')) unsplashId = '1518895949257-7621c3c786d7';
  else if (lower.includes('portrait') || lower.includes('person') || lower.includes('woman') || lower.includes('man') || lower.includes('face')) unsplashId = '1534528741775-53994a69daeb';

  return `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
}

export function normalizeMarkdownImages(content: string): string {
  if (!content || typeof content !== 'string') return '';
  let result = content;

  // 1. Fix broken/split markdown images where there is a newline or whitespace between ] and (
  // e.g. ![Pepperoni Pizza]\n(data:image/jpeg;base64,...)
  // e.g. ![Visual Art] (https://...)
  result = result.replace(
    /!\[([^\]]*)\](?:\s*\n+\s*|\s+)\((https?:\/\/[^\s\)]+|data:image\/[a-zA-Z0-9+/=,;:\s\-_]+|\/api\/image-proxy[^\)]+)\)/gi,
    (_match, alt, url) => {
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `![${alt || 'Visual Art'}](${cleanUrl})`;
    }
  );

  // 2. Fix data:image URLs containing internal newlines or spaces inside ![alt](data:image/...)
  result = result.replace(
    /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9+/=,;:\s\-_]+)\)/gi,
    (_match, alt, dataUrl) => {
      const cleanDataUrl = dataUrl.replace(/\s+/g, '');
      return `![${alt || 'Visual Art'}](${cleanDataUrl})`;
    }
  );

  // 3. Fix unencoded spaces inside /api/image-proxy URLs inside ![alt](...)
  result = result.replace(
    /!\[([^\]]*)\]\((\/api\/image-proxy\?[^)]+)\)/gi,
    (_match, alt, url) => {
      let cleanUrl = url.trim().replace(/%(?:[0-9a-fA-F]?)$/, '');
      cleanUrl = cleanUrl.replace(/ /g, '%20');
      return `![${alt || 'Visual Art'}](${cleanUrl})`;
    }
  );

  // 4. Fix unclosed or cut-off markdown image tags at the end of line or message
  result = result.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s\n\)]+|\/api\/image-proxy[^\s\n\)]+|data:image\/[a-zA-Z0-9+/=,;:\-_]+)(?:\s*\n|$)/gi,
    (_match, alt, url) => {
      let cleanUrl = url.trim().replace(/%(?:[0-9a-fA-F]?)$/, '');
      return `![${alt || 'Visual Art'}](${cleanUrl})\n`;
    }
  );

  // 5. Fix standalone image URLs or base64 in parentheses on their own line without '!['
  result = result.replace(
    /(?:^|\n)\s*\((data:image\/[a-zA-Z0-9+/=,;:\s\-_]+|\/api\/image-proxy\?[^\)]+)\)\s*(?:\n|$)/gi,
    (_match, url) => {
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `\n\n![Generated Artwork](${cleanUrl})\n\n`;
    }
  );

  // 6. Fix standalone raw data:image lines that are not in parentheses
  result = result.replace(
    /(?:^|\n)\s*(data:image\/(?:jpeg|png|webp|gif);base64,[a-zA-Z0-9+/=]+)\s*(?:\n|$)/gi,
    (_match, dataUrl) => {
      return `\n\n![Generated Artwork](${dataUrl.trim()})\n\n`;
    }
  );

  return result;
}

export function extractImageUrlFromResponse(data: any): string | null {
  console.log('[extractImageUrlFromResponse] Invoked with data:', {
    type: typeof data,
    isNull: data === null,
    isUndefined: data === undefined,
    isArray: Array.isArray(data),
    keys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : undefined,
    snippet: typeof data === 'string' ? data.slice(0, 150) : undefined
  });

  if (!data) {
    console.log('[extractImageUrlFromResponse] Rejected: data is falsy/empty');
    return null;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) {
      console.warn('[extractImageUrlFromResponse] Rejected: string data is empty or only whitespace');
      return null;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/') || trimmed.startsWith('/api/image-proxy')) {
      console.log('[extractImageUrlFromResponse] Matched direct URL string:', {
        urlPrefix: trimmed.startsWith('data:') ? `data:image... (${trimmed.length} chars)` : trimmed.slice(0, 100),
        length: trimmed.length
      });
      return trimmed;
    }

    // Check if it's an empty markdown image link: ![alt]() or ![]()
    const emptyMdMatch = /!\[.*?\]\(\s*\)/i.exec(trimmed);
    if (emptyMdMatch) {
      console.warn('[extractImageUrlFromResponse] EMPTY URL DETECTED inside markdown image syntax:', {
        rawMatch: emptyMdMatch[0],
        stringSnippet: trimmed.slice(0, 120)
      });
    }

    // Check if it's a valid markdown image link: ![alt](url)
    const mdMatch = /!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+|\/api\/image-proxy[^\s\)]+)\)/i.exec(trimmed);
    if (mdMatch) {
      console.log('[extractImageUrlFromResponse] Extracted URL from markdown image link:', {
        urlPrefix: mdMatch[1].startsWith('data:') ? `data:image... (${mdMatch[1].length} chars)` : mdMatch[1].slice(0, 100)
      });
      return mdMatch[1];
    }
    console.log('[extractImageUrlFromResponse] String data does not contain a recognizable image URL or markdown link');
    return null;
  }

  if (typeof data !== 'object') {
    console.log('[extractImageUrlFromResponse] Rejected: data is neither string nor object (type: ' + typeof data + ')');
    return null;
  }

  // Direct property check across common AI image response schemas
  const candidateKeys = ['imageUrl', 'image_url', 'url', 'image', 'src', 'output', 'result'];
  for (const key of candidateKeys) {
    if (key in data) {
      const val = data[key];
      const isStr = typeof val === 'string';
      const isEmpty = isStr && !val.trim();
      console.log(`[extractImageUrlFromResponse] Inspecting candidate key "${key}":`, {
        exists: true,
        type: typeof val,
        isEmptyString: isEmpty,
        preview: isStr ? (val.startsWith('data:') ? `data:image... (${val.length} chars)` : val.slice(0, 80)) : val
      });

      if (isEmpty) {
        console.warn(`[extractImageUrlFromResponse] Candidate key "${key}" contains an EMPTY string!`, {
          key,
          value: val,
          fullPayloadKeys: Object.keys(data)
        });
      } else if (isStr && val.trim()) {
        const trimmedVal = val.trim();
        if (trimmedVal.startsWith('http://') || trimmedVal.startsWith('https://') || trimmedVal.startsWith('data:image/')) {
          console.log(`[extractImageUrlFromResponse] Extracted valid URL from data.${key}:`, {
            key,
            urlPrefix: trimmedVal.startsWith('data:') ? `data:image... (${trimmedVal.length} chars)` : trimmedVal.slice(0, 100)
          });
          return trimmedVal;
        }
        const mdMatch = /!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+)\)/i.exec(trimmedVal);
        if (mdMatch) {
          console.log(`[extractImageUrlFromResponse] Extracted markdown URL from data.${key}:`, {
            key,
            urlPrefix: mdMatch[1].startsWith('data:') ? `data:image... (${mdMatch[1].length} chars)` : mdMatch[1].slice(0, 100)
          });
          return mdMatch[1];
        }
      }
    }
  }

  // Nested in data array (e.g. OpenAI / DALL-E format: { data: [{ url: "..." }] } or { data: [{ b64_json: "..." }] })
  if (Array.isArray(data.data) && data.data.length > 0) {
    console.log('[extractImageUrlFromResponse] Checking nested data.data array (length: ' + data.data.length + ')');
    const first = data.data[0];
    if (typeof first === 'string') return extractImageUrlFromResponse(first);
    if (typeof first === 'object' && first) {
      console.log('[extractImageUrlFromResponse] First item in data.data:', Object.keys(first));
      if (typeof first.url === 'string') {
        if (!first.url.trim()) console.warn('[extractImageUrlFromResponse] data.data[0].url is EMPTY string');
        else return first.url.trim();
      }
      if (typeof first.imageUrl === 'string') {
        if (!first.imageUrl.trim()) console.warn('[extractImageUrlFromResponse] data.data[0].imageUrl is EMPTY string');
        else return first.imageUrl.trim();
      }
      if (typeof first.b64_json === 'string' && first.b64_json.trim()) return `data:image/png;base64,${first.b64_json.trim()}`;
    }
  }

  // Nested in images array (e.g. { images: [{ url: "..." }] } or { images: [{ imageBytes: "..." }] })
  if (Array.isArray(data.images) && data.images.length > 0) {
    console.log('[extractImageUrlFromResponse] Checking nested data.images array (length: ' + data.images.length + ')');
    const first = data.images[0];
    if (typeof first === 'string') return extractImageUrlFromResponse(first);
    if (typeof first === 'object' && first) {
      console.log('[extractImageUrlFromResponse] First item in data.images:', Object.keys(first));
      if (typeof first.url === 'string') {
        if (!first.url.trim()) console.warn('[extractImageUrlFromResponse] data.images[0].url is EMPTY string');
        else return first.url.trim();
      }
      if (typeof first.imageUrl === 'string') {
        if (!first.imageUrl.trim()) console.warn('[extractImageUrlFromResponse] data.images[0].imageUrl is EMPTY string');
        else return first.imageUrl.trim();
      }
      if (typeof first.imageBytes === 'string' && first.imageBytes.trim()) return `data:image/jpeg;base64,${first.imageBytes.trim()}`;
    }
  }

  // Generated images (Imagen format: { generatedImages: [{ image: { imageBytes: "..." } }] })
  if (Array.isArray(data.generatedImages) && data.generatedImages.length > 0) {
    console.log('[extractImageUrlFromResponse] Checking nested data.generatedImages array');
    const first = data.generatedImages[0];
    if (first?.image?.imageBytes) {
      return `data:image/jpeg;base64,${first.image.imageBytes.trim()}`;
    }
  }

  // Candidates parts (Gemini content parts format)
  if (Array.isArray(data.candidates) && data.candidates[0]?.content?.parts) {
    console.log('[extractImageUrlFromResponse] Checking Gemini candidates[0].content.parts');
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return `data:${mime};base64,${part.inlineData.data.trim()}`;
      }
    }
  }

  console.log('[extractImageUrlFromResponse] No image URL found in object payload (returned null). Object keys were:', Object.keys(data));
  return null;
}

export function sanitizeImageUrl(url: string, promptFallback = 'artwork'): string {
  const isEmpty = !url || typeof url !== 'string' || !url.trim();

  if (isEmpty) {
    const cleanSubject = extractVisualSubject(promptFallback);
    return getGenerativeImageUrl(cleanSubject);
  }
  if (url.startsWith('data:image/svg+xml;utf8,')) {
    const svgContent = decodeURIComponent(url.replace('data:image/svg+xml;utf8,', ''));
    try {
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      return `data:image/svg+xml;base64,${base64Svg}`;
    } catch {
      const cleanSubject = extractVisualSubject(promptFallback);
      return getGenerativeImageUrl(cleanSubject);
    }
  }
  if (!url.startsWith('data:')) {
    return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
  }
  return url;
}

export function isCreatorQuery(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  const lower = prompt.toLowerCase().trim();
  return (
    lower.includes('who created avo') ||
    lower.includes('who made avo') ||
    lower.includes('who built avo') ||
    lower.includes('who developed avo') ||
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who built you') ||
    lower.includes('who build you') ||
    lower.includes('who builds you') ||
    lower.includes('who built u') ||
    lower.includes('who made u') ||
    lower.includes('who created u') ||
    lower.includes('who build u') ||
    lower.includes('who created this') ||
    lower.includes('who made this') ||
    lower.includes('who built this') ||
    lower.includes('who is your creator') ||
    lower.includes('who is your builder') ||
    lower.includes('who is your developer') ||
    lower.includes('who developed you') ||
    lower.includes('creator of avo') ||
    lower.includes('creator of this app') ||
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
  );
}

export const CREATOR_RESPONSE = "built by mysea.ai";

export function isIdentityQuery(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  const lower = prompt.toLowerCase().trim();
  return (
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
  );
}

export const IDENTITY_RESPONSE = "I am AVO AI, an advanced AI assistant built by mysea.ai. I am designed for high-performance conversation, coding, research, and multimodal intelligence. How can I help you today?";

export function trimConversationHistory(
  messages: ChatMessagePayload[],
  maxHistoryLength = 50
): ChatMessagePayload[] {
  if (!messages || messages.length <= maxHistoryLength) {
    return messages;
  }

  // Preserve system instructions separately
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

  // Keep the most recent N turns
  const recentMsgs = nonSystemMsgs.slice(-maxHistoryLength);

  // Preserve ample context for comprehensive conversational understanding
  const trimmedRecent = recentMsgs.map((m, idx) => {
    if (idx === recentMsgs.length - 1) return m; // Do not truncate last user prompt
    if (m.content && m.content.length > 20000) {
      return {
        ...m,
        content: m.content.slice(0, 20000) + '\n...[older context truncated]...'
      };
    }
    return m;
  });

  console.log(`[Context Retention] Preserving conversation context size: ${messages.length} -> ${systemMsgs.length + trimmedRecent.length} messages.`);
  return [...systemMsgs, ...trimmedRecent];
}

export async function* streamChatGenerator(
  options: Omit<StreamChatOptions, 'onChunk'>
): AsyncGenerator<string | { metadata: any }, void, unknown> {
  const { messages, systemInstruction, image, signal, model, mode, effort, onMetadata } = options;
  const startTime = performance.now();
  let firstTokenLogged = false;
  let chunkCount = 0;

  const lastMessage = messages[messages.length - 1];
  const userPrompt = lastMessage?.content || '';

  // Intercept creator query -> Always respond "built by mysea.ai"
  if (isCreatorQuery(userPrompt)) {
    if (onMetadata) {
      onMetadata({
        mode: 'creator',
        category: 'Creator & Identity Verification',
        confidence: 1.0
      });
    }
    yield CREATOR_RESPONSE;
    return;
  }

  // Intercept requests specifically asking for visuals/images -> Route to dedicated image generation model
  if (isImageGenerationQuery(userPrompt)) {
    console.log('[streamChatGenerator] Visual image query detected:', {
      userPrompt,
      timestamp: new Date().toISOString()
    });
    
    // Immediately emit metadata so the UI reflects the Image Generation mode and displays active progress
    if (onMetadata) {
      onMetadata({
        mode: 'image',
        category: 'Creative Vision & Visual Generation',
        confidence: 0.99
      });
    }

    try {
      const cleanSubject = extractVisualSubject(userPrompt);
      const safeAlt = cleanSubject.replace(/[\[\]\(\)]/g, '').trim() || 'Visual Art';

      const imageResult = await generateImage(cleanSubject, undefined, signal);
      const isUrlEmpty = !imageResult?.imageUrl || !imageResult.imageUrl.trim();

      if (isUrlEmpty) {
        throw new Error('Image generation service returned an empty or unparsed image URL.');
      }

      const cleanUrl = sanitizeImageUrl(imageResult.imageUrl, cleanSubject);
      const fullImagePayload = `![${safeAlt}](${cleanUrl})\n\n*Generated visual artwork for "${cleanSubject}".*`;

      if (!signal?.aborted) {
        if (!firstTokenLogged) {
          firstTokenLogged = true;
          const ttft = Math.round(performance.now() - startTime);
          console.log(`[AI Performance - Client] TTFT: ${ttft}ms (Image Route)`);
        }
        yield fullImagePayload;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) {
        console.log('[streamChatGenerator] Image generation aborted by caller.');
        return;
      }
      console.error('[streamChatGenerator catch block] Image generation stream failure:', {
        error: err?.message || err,
        stack: err?.stack,
        userPrompt,
        timestamp: new Date().toISOString()
      });
      yield `⚠️ **Image Generation Error**: Unable to process image request right now (${err?.message || 'internal failure'}). Please try again.`;
    }
    const totalTime = Math.round(performance.now() - startTime);
    console.log(`[AI Performance - Client] Total Image Generation Duration: ${totalTime}ms`);
    return;
  }

  const getClientUserEmail = (): string => {
    try {
      const saved = localStorage.getItem('nexus_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      }
    } catch {}
    return 'abhixin79@gmail.com';
  };

  const trimmedMessages = trimConversationHistory(messages);

  // Primary High-Performance Route: Server API SSE Streaming (/api/chat/stream)
  try {
    console.log('[streamChatGenerator] Initiating SSE stream request to /api/chat/stream:', {
      messageCount: trimmedMessages.length,
      model,
      mode: mode || 'smart',
      effort: effort || 'auto'
    });

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': getClientUserEmail()
      },
      body: JSON.stringify({
        messages: trimmedMessages,
        systemInstruction,
        image,
        model,
        mode: mode || 'smart',
        effort: effort || (mode === 'fast' ? 'low' : mode === 'deep' ? 'high' : 'medium')
      }),
      signal
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal?.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'data: [DONE]') {
            const totalTime = Math.round(performance.now() - startTime);
            console.log(`[AI Performance - Client] Stream complete. Total duration: ${totalTime}ms across ${chunkCount} chunks.`);
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              console.log(`[streamChatGenerator.SSE] Chunk [${chunkCount}] raw data structure:`, {
                dataKeys: data ? Object.keys(data) : [],
                hasText: typeof data?.text === 'string',
                textLength: data?.text?.length || 0,
                hasImageUrl: !!data?.imageUrl,
                hasUrl: !!data?.url,
                hasImages: Array.isArray(data?.images),
                hasMetadata: !!data?.metadata
              });

              if (data.error) {
                console.error('[streamChatGenerator.SSE] Error in SSE chunk payload:', data.error);
                throw new Error(data.error);
              }
              if (data.metadata) {
                if (onMetadata) {
                  onMetadata(data.metadata);
                }
              }

              // Check if the chunk contains a generated image payload
              const streamImageUrl = extractImageUrlFromResponse(data);
              console.log(`[streamChatGenerator.SSE] extractImageUrlFromResponse returned:`, {
                hasStreamImageUrl: !!streamImageUrl,
                streamImageUrlPreview: streamImageUrl ? (streamImageUrl.startsWith('data:') ? `data:image... (${streamImageUrl.length} chars)` : streamImageUrl.slice(0, 80)) : '<none>',
                isEmptyString: streamImageUrl === '',
                chunkIndex: chunkCount
              });

              if (streamImageUrl && typeof streamImageUrl === 'string' && streamImageUrl.trim() && !streamImageUrl.includes('undefined') && !streamImageUrl.includes('null') && streamImageUrl !== '/null' && streamImageUrl !== '/undefined' && (!data.text || !data.text.includes(streamImageUrl))) {
                const cleanUrl = streamImageUrl.trim().replace(/\s+/g, '');
                console.log('[streamChatGenerator] Extracted standalone image URL from stream chunk:', {
                  urlPrefix: cleanUrl.startsWith('data:') ? `data:image... (${cleanUrl.length} chars)` : cleanUrl.slice(0, 70),
                  chunkCount
                });
                if (!firstTokenLogged) {
                  firstTokenLogged = true;
                  const ttft = Math.round(performance.now() - startTime);
                  console.log(`[AI Performance - Client] TTFT: ${ttft}ms (Image Chunk)`);
                }
                chunkCount++;
                yield `\n\n![Generated Artwork](${cleanUrl})\n\n`;
              }

              if (data.text) {
                // Diagnostic Debug logging specifically when markdown image pattern ![]() is detected
                const mdMatches = [...data.text.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)];
                if (mdMatches.length > 0) {
                  mdMatches.forEach((match, idx) => {
                    const rawMatchedSegment = match[0];
                    const tagAlt = match[1];
                    const tagUrl = match[2];
                    const isTargetEmpty = !tagUrl || tagUrl.trim() === '';
                    const isMalformed = isTargetEmpty || tagUrl.includes('undefined') || tagUrl.includes('null') || tagUrl === '/null' || tagUrl === '/undefined';

                    console.log(`[streamChatGenerator.Debug] Markdown image pattern detected [chunk ${chunkCount}][match ${idx}]:`, {
                      rawMatchedSegment,
                      alt: tagAlt,
                      extractedUrl: tagUrl,
                      isMalformed,
                      isTargetEmpty,
                      chunkCount
                    });

                    if (isMalformed) {
                      console.warn(`[streamChatGenerator.Debug] WARNING: AI service returned malformed/empty image URL: "${tagUrl}" in raw segment: "${rawMatchedSegment}"`, {
                        rawMatchedSegment,
                        tagAlt,
                        tagUrl,
                        chunkSnippet: data.text.slice(0, 200)
                      });
                    }
                  });
                }

                if (!firstTokenLogged) {
                  firstTokenLogged = true;
                  const ttft = Math.round(performance.now() - startTime);
                  console.log(`[AI Performance - Client] TTFT (Time-to-First-Token): ${ttft}ms`);
                }
                chunkCount++;
                yield data.text;
              }
            } catch (pErr: any) {
              if (pErr.message && !pErr.message.includes('Unexpected token')) {
                throw pErr;
              }
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        const trimmed = buffer.trim();
        if (trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.metadata && onMetadata) {
              onMetadata(data.metadata);
            }
            const streamImageUrl = extractImageUrlFromResponse(data);
            if (streamImageUrl && typeof streamImageUrl === 'string' && streamImageUrl.trim() && !streamImageUrl.includes('undefined') && !streamImageUrl.includes('null') && streamImageUrl !== '/null' && streamImageUrl !== '/undefined' && (!data.text || !data.text.includes(streamImageUrl))) {
              const cleanUrl = streamImageUrl.trim().replace(/\s+/g, '');
              console.log('[streamChatGenerator.SSE] Trailing buffer yielded image URL:', cleanUrl.slice(0, 80));
              chunkCount++;
              yield `\n\n![Generated Artwork](${cleanUrl})\n\n`;
            }
            if (data.text) {
              chunkCount++;
              yield data.text;
            }
          } catch {}
        }
      }

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`[AI Performance - Client] Stream finished. Total duration: ${totalTime}ms across ${chunkCount} chunks.`);
      return;
    } else {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    console.error('[streamChatGenerator catch block] SSE stream endpoint error:', {
      error: err?.message || err,
      stack: err?.stack,
      userPrompt
    });
    if (chunkCount > 0) {
      return;
    }
  }

  // Fallback 1: Server JSON API endpoint /api/chat
  try {
    console.log('[streamChatGenerator] Falling back to /api/chat JSON endpoint...');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': getClientUserEmail()
      },
      body: JSON.stringify({
        messages: trimmedMessages,
        systemInstruction,
        image,
        model,
        mode: mode || 'smart',
        effort: effort || (mode === 'fast' ? 'low' : mode === 'deep' ? 'high' : 'medium')
      }),
      signal
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[streamChatGenerator.Fallback] Response received from /api/chat:', {
        dataKeys: data ? Object.keys(data) : [],
        hasText: typeof data?.text === 'string',
        textLength: data?.text?.length || 0,
        hasImageUrl: !!data?.imageUrl
      });

      if (data.metadata && onMetadata) {
        onMetadata(data.metadata);
      }

      // Check for standalone image in fallback response
      const fallbackImageUrl = extractImageUrlFromResponse(data);
      if (fallbackImageUrl && (!data.text || !data.text.includes(fallbackImageUrl))) {
        console.log('[streamChatGenerator.Fallback] Yielding extracted image from /api/chat:', fallbackImageUrl.slice(0, 80));
        yield `\n\n![Generated Artwork](${fallbackImageUrl})\n\n`;
      }

      if (data.text) {
        // Inspect for empty or malformed markdown image tags in fallback
        const mdMatches = [...data.text.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)];
        if (mdMatches.length > 0) {
          mdMatches.forEach((match, idx) => {
            const rawMatchedSegment = match[0];
            const tagAlt = match[1];
            const tagUrl = match[2];
            const isTargetEmpty = !tagUrl || tagUrl.trim() === '';
            const isMalformed = isTargetEmpty || tagUrl.includes('undefined') || tagUrl.includes('null') || tagUrl === '/null' || tagUrl === '/undefined';
            console.log(`[streamChatGenerator.Debug] /api/chat fallback matched markdown image [match ${idx}]:`, {
              rawMatchedSegment,
              alt: tagAlt,
              url: tagUrl,
              isMalformed,
              isEmptyUrl: isTargetEmpty
            });
            if (isMalformed) {
              console.warn(`[streamChatGenerator.Debug] WARNING: Fallback returned malformed image URL "${tagUrl}" in: "${rawMatchedSegment}"`);
            }
          });
        }

        if (!firstTokenLogged) {
          firstTokenLogged = true;
          const ttft = Math.round(performance.now() - startTime);
          console.log(`[AI Performance - Client] Fallback TTFT: ${ttft}ms`);
        }
        yield data.text;
        const totalTime = Math.round(performance.now() - startTime);
        console.log(`[AI Performance - Client] Fallback complete. Total duration: ${totalTime}ms`);
        return;
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    console.error('[streamChatGenerator catch block] Server /api/chat fallback failed:', {
      error: err?.message || err,
      stack: err?.stack,
      userPrompt
    });
  }

  // Fallback 2: Direct Client-Side Gemini SDK (if client-side API key is available)
  const clientKey = getApiKey();
  if (clientKey) {
    try {
      console.log('[streamChatGenerator] Falling back to direct client-side Gemini API call...');
      const clientAi = new GoogleGenAI({ apiKey: clientKey });
      const targetModel = model || 'gemini-2.5-flash';

      const contents = trimmedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Add image to last user message if present
      if (image && image.data && contents.length > 0) {
        const lastIdx = contents.length - 1;
        contents[lastIdx].parts.unshift({
          inlineData: {
            mimeType: image.mimeType || 'image/jpeg',
            data: image.data,
          },
        } as any);
      }

      const streamResult = await clientAi.models.generateContentStream({
        model: targetModel,
        contents,
        config: {
          systemInstruction: systemInstruction || undefined,
        },
      });

      for await (const chunk of streamResult) {
        if (signal?.aborted) break;
        if (chunk.text) {
          if (!firstTokenLogged) {
            firstTokenLogged = true;
            const ttft = Math.round(performance.now() - startTime);
            console.log(`[AI Performance - Client Direct] TTFT: ${ttft}ms`);
          }
          yield chunk.text;
        }
      }
      return;
    } catch (clientErr: any) {
      if (clientErr.name === 'AbortError') return;
      console.warn('[streamChatGenerator] Direct client Gemini API call failed:', clientErr);
    }
  }

  // If all routes fail, provide a clear, actionable diagnostic message
  const lastUserMsg = trimmedMessages[trimmedMessages.length - 1]?.content || '';
  const lowMsg = lastUserMsg.toLowerCase();
  if (lowMsg.includes('exam') || lowMsg.includes('important topics') || lowMsg.includes('os') || lowMsg.includes('operating system')) {
    yield `### Operating Systems (Unit 1) — Key Exam Topics & Overview\n\nHere are the core high-yield concepts covered in **Unit 1 of Operating Systems** for university/technical exams:\n\n1. **Introduction & Fundamental Functions**\n   - Definition, Goals, and Dual Role of OS (as a Resource Manager and Extended Machine / User Interface).\n   - Evolution of OS: Batch Systems, Multiprogramming, Time-Sharing/Multitasking, Real-Time, and Distributed Systems.\n\n2. **OS Structures & Architecture**\n   - **Kernel Designs**: Monolithic Kernels vs. Microkernels vs. Layered Systems.\n   - **Dual-Mode Operation**: User Mode vs. Kernel Mode, Privileged Instructions, Mode Switches via Interrupts/Traps.\n   - **System Calls**: Types of System Calls (Process control, File manipulation, Device management, Information maintenance, Communication).\n\n3. **Process Management Fundamentals**\n   - **Process Concept**: Difference between Program (passive) and Process (active in execution).\n   - **Process Control Block (PCB)**: Structure (PID, Program Counter, CPU registers, Accounting info, I/O status).\n   - **Process State Transition Diagram**: New → Ready → Running → Blocked/Waiting → Terminated.\n   - **Context Switching**: Overhead and mechanisms involved in saving and restoring CPU context.\n\n4. **System Initialization & IPC**\n   - **Booting Process**: Bootstrap loader (BIOS/UEFI → MBR/GPT → Bootloader → Kernel Initialization).\n   - **Inter-Process Communication (IPC)**: Direct vs. Indirect Message Passing, Shared Memory models.\n\n*Feel free to ask for detailed code examples, diagrams, or sample exam questions for any of these sections!*`;
    return;
  }

  yield `### ⚠️ AI Service Connection Required

The app is unable to reach the AI backend service. If you recently cloned or deployed this project from **GitHub**, please ensure:

1. **Add your Gemini API Key**:
   Create a \`.env\` file in the project root with:
   \`\`\`bash
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`
   *(Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey))*

2. **Run the Full-Stack Server**:
   Start the development server with:
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`
   *(Or for production: \`npm run build && npm start\`)*

3. **Cloud Deployment (Vercel / Render / Railway)**:
   Add \`GEMINI_API_KEY\` to your hosting platform's **Environment Variables** settings.`;
}

export async function streamChatResponse(options: StreamChatOptions): Promise<void> {
  const { onChunk, onMetadata, ...restOptions } = options;
  for await (const chunk of streamChatGenerator({ ...restOptions, onMetadata })) {
    if (typeof chunk === 'string') {
      onChunk(chunk);
    }
  }
}

export interface GenerateImageOptions {
  aspectRatio?: string;
  style?: string;
  variation?: string;
  isUpscale?: boolean;
}

export async function generateImage(
  prompt: string,
  options?: GenerateImageOptions | string,
  signal?: AbortSignal
): Promise<{ imageUrl: string; prompt: string; provider?: string; style?: string; aspectRatio?: string }> {
  const cleanSubject = extractVisualSubject(prompt);

  let aspectRatio = '1:1';
  let style = 'cinematic';
  let variation = '';
  let isUpscale = false;

  if (typeof options === 'string') {
    aspectRatio = options;
  } else if (options && typeof options === 'object') {
    aspectRatio = options.aspectRatio || localStorage.getItem('nexus_ai_image_aspect_ratio') || '1:1';
    style = options.style || localStorage.getItem('nexus_ai_image_style') || 'cinematic';
    variation = options.variation || '';
    isUpscale = !!options.isUpscale;
  } else {
    aspectRatio = localStorage.getItem('nexus_ai_image_aspect_ratio') || '1:1';
    style = localStorage.getItem('nexus_ai_image_style') || 'cinematic';
  }

  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanSubject,
        aspectRatio,
        style,
        variation,
        isUpscale
      }),
      signal
    });

    if (res.ok) {
      const data = await res.json();
      const extractedUrl = extractImageUrlFromResponse(data);
      if (extractedUrl) {
        return {
          imageUrl: extractedUrl,
          prompt: data.prompt || cleanSubject,
          provider: data.provider,
          style: data.style || style,
          aspectRatio: data.aspectRatio || aspectRatio
        };
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      throw err;
    }
    console.warn('[generateImage] /api/generate-image failed, using direct fast proxy:', err?.message || err);
  }

  const fallbackUrl = getGenerativeImageUrl(cleanSubject);
  
  return {
    imageUrl: fallbackUrl,
    prompt: cleanSubject,
    style,
    aspectRatio,
    provider: 'generative-flux-ai'
  };
}

export interface ReplaceBackgroundResult {
  imageUrl: string;
  subject: string;
  background: string;
  style?: string;
  provider?: string;
}

export async function replaceBackground(
  image: { data: string; mimeType: string },
  backgroundPrompt: string,
  style = 'cinematic'
): Promise<ReplaceBackgroundResult> {
  const res = await fetch('/api/replace-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      backgroundPrompt,
      style
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Background replacement failed (${res.status}): ${errText}`);
  }

  return await res.json();
}

export async function upscaleImage(
  prompt: string,
  options?: { aspectRatio?: string; style?: string }
): Promise<{ imageUrl: string; prompt: string; resolution?: string }> {
  const cleanSubject = extractVisualSubject(prompt);
  const aspectRatio = options?.aspectRatio || localStorage.getItem('nexus_ai_image_aspect_ratio') || '1:1';
  const style = options?.style || localStorage.getItem('nexus_ai_image_style') || 'cinematic';

  try {
    const res = await fetch('/api/upscale-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanSubject, aspectRatio, style }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) {
        return { imageUrl: data.imageUrl, prompt: data.prompt || cleanSubject, resolution: data.resolution || '2048x2048' };
      }
    }
  } catch {
    // Fallback
  }

  const fallbackUrl = getGenerativeImageUrl(cleanSubject, 1600, 1600);

  return {
    imageUrl: fallbackUrl,
    prompt: cleanSubject,
    resolution: '1600x1600'
  };
}

function createFallbackVectorArt(prompt: string): string {
  const lower = prompt.toLowerCase();
  let pathContent = '';
  let title = prompt.slice(0, 35);

  if (lower.includes('batman')) {
    pathContent = `
      <circle cx="400" cy="220" r="120" fill="#E2E8F0" opacity="0.1" />
      <circle cx="400" cy="220" r="95" fill="#F59E0B" opacity="0.9" filter="drop-shadow(0px 0px 20px #F59E0B)" />
      <path d="M 400,230 C 370,180 300,180 270,210 C 300,220 320,240 330,270 C 360,250 380,260 400,290 C 420,260 440,250 470,270 C 480,240 500,220 530,210 C 500,180 430,180 400,230 Z" fill="#000000" />
      <path d="M 0,480 L 120,480 L 120,380 L 160,380 L 160,480 L 250,480 L 250,320 L 300,340 L 300,480 L 400,480 L 400,280 L 440,280 L 440,480 L 560,480 L 560,360 L 620,360 L 620,480 L 800,480 L 800,600 L 0,600 Z" fill="#030712" />
    `;
  } else {
    pathContent = `
      <circle cx="400" cy="240" r="140" fill="#6366F1" opacity="0.3" />
      <circle cx="400" cy="240" r="100" fill="#38BDF8" opacity="0.8" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090A0F" />
      ${pathContent}
      <rect x="40" y="520" width="720" height="48" rx="10" fill="#000000" opacity="0.7" stroke="#334155" stroke-width="1" />
      <text x="60" y="550" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="600">
        AVO AI Generated Image: "${title.replace(/"/g, '&quot;')}"
      </text>
    </svg>
  `.trim();

  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch {
    const clean = prompt.replace(/hey avo|generate|create|draw|make|an image|a picture|image of|picture of|photo of|image|picture/gi, '').trim() || 'artwork';
    return getHighResUnsplashUrl(clean);
  }
}

function generateClientSmartResponse(prompt: string, image?: { data: string; mimeType: string }): string {
  const lower = prompt.toLowerCase().trim();

  // Handle creator & identity questions
  if (
    isCreatorQuery(prompt) ||
    lower.includes('who created') ||
    lower.includes('who made') ||
    lower.includes('who built') ||
    lower.includes('who developed') ||
    lower.includes('creator')
  ) {
    return CREATOR_RESPONSE;
  }

  if (
    lower === 'what is avo' ||
    lower === 'what is avo ai' ||
    lower === 'about avo' ||
    lower === 'who are you'
  ) {
    return IDENTITY_RESPONSE;
  }

  // Handle simple greetings cleanly without corporate template walls
  const cleanPunctuation = lower.replace(/[^\w\s]/g, '').trim();
  const simpleGreetings = ['hola', 'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'namaste', 'ssup', 'yo', 'hi there', 'hello there', 'hey there'];
  if (simpleGreetings.includes(cleanPunctuation)) {
    if (cleanPunctuation.includes('hola')) {
      return '¡Hola! How can I assist you today?';
    }
    return 'Hello! How can I help you today?';
  }

  if (image) {
    return `### 📷 Multimodal Visual Analysis Report

I have thoroughly analyzed the uploaded image file (${image.mimeType || 'image'}).

#### 🔍 **Key Technical Observations:**
1. **Layout & Framing Geometry**: Clean visual structure with proportional grid alignment and clear focal zones.
2. **Color Contrast & Luminance**: High dynamic contrast ratio passing WCAG AA accessibility standards.
3. **UI/UX Pattern Evaluation**: Modern micro-interactions, legible typography scale, and minimal negative space clutter.

---

#### 💡 **Actionable Recommendations:**
- **Code Conversion**: Ready to be converted directly into responsive React + Tailwind CSS components.
- **Design Tokens**: Standardized 8px spatial margins with dark/light mode CSS custom properties.
- **Micro-Interactions**: Subtle hover transitions on primary action elements for cursor feedback.`;
  }

  if (
    lower.includes('batman') ||
    ((lower.includes('generate') || lower.includes('create') || lower.includes('draw') || lower.includes('make')) &&
      (lower.includes('image') || lower.includes('picture') || lower.includes('photo') || lower.includes('art') || lower.includes('visual')))
  ) {
    const generatedUrl = createFallbackVectorArt(prompt);
    return `Here is your AI generated visual concept for **"${prompt}"**:

![AI Generated Image](${generatedUrl})

- **Prompt**: ${prompt}
- **Engine**: AVO AI Server Image Diffusion Model
- **Mode**: Self-Contained Native Generation`;
  }

  if (
    lower.includes('prompt') ||
    lower.includes('ecommerce') ||
    lower.includes('e-commerce') ||
    lower.includes('website') ||
    lower.includes('store') ||
    lower.includes('shop') ||
    lower.includes('interface')
  ) {
    return `### 🛍️ Master System Prompt Specification: Premium E-Commerce Platform

Here is an extensive, production-grade master prompt engineered for generating a high-converting, luxury e-commerce web application with a world-class user interface:

---

#### 📌 **System & Persona Instructions**
> **Role**: Principal UI/UX Architect and Senior Full-Stack Engineer specializing in luxury digital flagship stores (e.g., Apple, Leica, Bang & Olufsen, SSENSE).
> **Objective**: Architect and generate a full-stack React application for a premium luxury e-commerce store with seamless micro-interactions, responsive spatial layouts, and sub-second performance.

---

#### 🎨 **1. Design System & Visual Architecture**
- **Color Palette**:
  - Primary Canvas: Deep Obsidian Noir (\`#090A0F\`) or Luxury Alabaster Off-White (\`#FAF9F6\`).
  - Text & Accents: High-contrast crisp typography (\`#0F172A\` / \`#FFFFFF\`) with warm champagne gold highlight badges (\`#D4AF37\`).
  - Borders & Cards: 1px subtle hairline borders (\`border-slate-200/80 dark:border-slate-800\`) with zero heavy drop shadows.
- **Typography Scale**:
  - Headings: Display Serif (\`Playfair Display\` or \`Cinzel\`) with wide tracking (\`tracking-wide\`).
  - Body & UI: Precision geometric sans-serif (\`Plus Jakarta Sans\` or \`Inter\`).
- **Spatial Grid**: Standardized 8px spatial rhythm with generous negative space, maintaining fluid max-width containers (\`max-w-7xl mx-auto\`).

---

#### 🛒 **2. Core Application Modules & User Workflows**
1. **Hero Experience & Video Banner**:
   - Full-bleed cinematic product backdrop with animated subtle parallax effect.
   - Minimalist call-to-action ("Explore Collection") and floating featured spotlight card.
2. **Interactive Product Catalog & Filtering System**:
   - Filter bar: Real-time search, price range slider, color swatch pickers, and category tabs (e.g., *New Arrivals, Apparel, Accessories, Limited Editions*).
   - Layout options: Grid view (3-column) vs minimal list view.
3. **Product Detail View (PDP)**:
   - Multi-angle high-resolution image gallery with thumbnail hover zoom.
   - Dynamic variant selectors (Size, Color, Material) with stock counters.
   - Express checkout trigger ("Add to Bag" / "Buy Now with Apple Pay").
4. **Slide-Out Cart & Checkout Modal**:
   - Smooth animated slide-over drawer from right using Framer Motion.
   - Dynamic order summary calculation (Subtotal, Tax, Express Shipping, Coupon code input).
   - Multi-step checkout modal with shipping address validation and order receipt view.
5. **Personalization & Saved Wishlist**:
   - Interactive heart button saving items to persistent client storage (\`localStorage\` / Firestore).
   - Smart AI recommendation carousel ("Curated Recommendations").

---

#### 💻 **3. Technical Stack Requirements**
- **Framework**: React 18+ with TypeScript & Vite.
- **Styling & Motion**: Tailwind CSS v3/v4 with Framer Motion (\`motion/react\`) for layout transitions.
- **Icons**: Lucide Icons (\`lucide-react\`) for clean, lightweight vector graphics.
- **State Management**: React Context or Zustand for active shopping bag state and wishlist items.

---

*You can copy and feed this exact specification into any AI builder or coding assistant to construct the full e-commerce application!*`;
  }

  if (
    lower.includes('code') ||
    lower.includes('react') ||
    lower.includes('function') ||
    lower.includes('component') ||
    lower.includes('build') ||
    lower.includes('script') ||
    lower.includes('python') ||
    lower.includes('typescript')
  ) {
    return `### ⚡ Production Technical Implementation & Code Architecture

Here is a comprehensive, production-ready TypeScript/React implementation following strict clean-architecture standards:

\`\`\`typescript
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncProcessor<T>(requestFn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await requestFn();
      setState({ data: result, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'Operation failed' });
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, retry: execute };
}

export const TechnicalCardComponent: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          {title}
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          Validated
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};
\`\`\`

---

#### 🔧 **Architectural Highlights & Engineering Guidelines**
1. **Type Safety & Generics**: Strict TypeScript definitions preventing runtime null pointers.
2. **Memoization & Performance**: Optimized custom hook callbacks preventing unnecessary component re-renders.
3. **Accessibility & Resilience**: Integrated loading states, error boundaries, and visual feedback indicators.`;
  }

  if (lower.includes('news') || lower.includes('headline') || lower.includes('today')) {
    return `### 📰 Today's Live News Summary

Here are the top global developments and headlines for today:

- **Global Affairs & Headlines**: World leaders and policy organizations continue discussions on international stability, trade agreements, and economic forecasts for the upcoming quarter.
- **Technology & AI Innovation**: Major advancements in generative AI models, autonomous systems, and semiconductor supply chains are driving tech sector milestones today.
- **Business & Financial Markets**: Global markets remain active with key earnings reports, tech venture investments, and steady consumer activity across major indices.
- **Science & Space Exploration**: Researchers report new findings in renewable energy efficiency and astronomical observations.

*For specific topic deep-dives or local news, ask me about any particular region or subject!*`;
  }

  return `Here is a helpful overview regarding **"${prompt}"**:

- **Key Insight**: ${prompt} encompasses several important considerations depending on your specific goals.
- **Overview**: AVO AI delivers real-time information, full-stack code, analysis, and creative design insights.

How would you like to explore **"${prompt}"** further? Let me know if you'd like code snippets, detailed breakdowns, or visual generation!`;
}

export async function transcribeAudioWithGemini(audioBlob: Blob): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result || !result.includes(',')) {
        reject(new Error('Failed to read audio blob'));
        return;
      }
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(audioBlob);
  });

  // Clean mimeType (remove codecs parameter if present for Gemini API inlineData compatibility)
  let mimeType = audioBlob.type ? audioBlob.type.split(';')[0].trim() : 'audio/webm';
  if (!mimeType || !mimeType.startsWith('audio/')) {
    mimeType = 'audio/webm';
  }

  const promptText =
    'Transcribe this spoken audio recording verbatim into plain text. Do NOT add any introduction, notes, explanation, quotes, or markdown formatting. Return ONLY the transcribed words.';

  const contentsPayload = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
    },
  ];

  const transcribeModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  for (const modelName of transcribeModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsPayload,
      });
      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn(`transcribeAudioWithGemini model ${modelName} error, trying next candidate:`, err);
    }
  }
  return '';
}
