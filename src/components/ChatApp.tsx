import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { CODE_THEMES, CODE_THEME_LIST, CodeThemeId, renderHighlightedLine } from '../utils/codeThemes';
import { UpgradeModal } from './modals/UpgradeModal';
import { ProjectsModal } from './modals/ProjectsModal';
import { CustomizeModal } from './modals/CustomizeModal';
import { ImagePreviewModal } from './modals/ImagePreviewModal';
import { ImageGalleryModal, GalleryImage, downloadImagesAsZip } from './ImageGalleryModal';
import { ReorderableImageGrid } from './ReorderableImageGrid';
import { ArtifactsModal } from './modals/ArtifactsModal';
import { DesignStudioModal } from './modals/DesignStudioModal';
import { ShareModal } from './modals/ShareModal';
import { RazorpayPaymentModal } from './modals/RazorpayPaymentModal';
import { CameraCaptureModal } from './modals/CameraCaptureModal';
import { streamChatResponse, streamChatGenerator, trimConversationHistory, transcribeAudioWithGemini, getHighResUnsplashUrl, getGenerativeImageUrl, normalizeMarkdownImages } from '../lib/aiService';
import { useFirestoreChats } from '../hooks/useFirestoreChats';
import { safeLocalStorageSetItem, sanitizeAttachmentsForStorage } from '../lib/safeStorage';
import { EffortSelector, EffortLevel, OrchestrationMode } from './ModeSelector';
import {
  Plus,
  Camera,
  Compass,
  Library,
  Search,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  AlertCircle,
  GripHorizontal,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Smile,
  Send,
  Share2,
  ArrowUp,
  AudioLines,
  Square,
  ArrowDown,
  Sparkles,
  Globe,
  Cloud,
  Maximize2,
  Bot,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  FileText,
  Home,
  Folder,
  Palette,
  FolderPlus,
  FolderOpen,
  FolderInput,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Code,
  List,
  Heading,
  Quote,
  Zap,
  MoreVertical,
  MoreHorizontal,
  Move,
  Pin,
  PinOff,
  Download,
  Archive,
  Pencil,
  Command,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  Keyboard,
  Sliders,
  Loader2,
  Lock,
  SquarePen,
  LayoutGrid,
  Clock,
  Wand2,
  BarChart3,
  Shield,
  WrapText,
  Layers,
  CornerDownRight,
  Code2,
  Boxes,
  Shapes,
  Briefcase,
  SlidersHorizontal,
  ChevronsUpDown,
  UserPlus,
  History
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ChatMessage, Conversation, AppSettings, Attachment, Folder as FolderType, Tag, UserProfile, SearchHistoryItem } from '../types';
import { SUGGESTED_PROMPTS } from '../data/landingData';
import { SettingsModal } from './SettingsModal';
import { ConversationListItem } from './ConversationListItem';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { SearchHistoryModal } from './SearchHistoryModal';
import { NexusLogo, NexusLogoIcon, NexusSparkle, GeminiSparkle } from './NexusLogo';
import { useFollowUpSuggestions } from '../hooks/useFollowUpSuggestions';
import { AVO_MODELS, getModelSpec, AvoModelSpec } from '../config/modelCatalog';
import {
  isModelAllowedForUser,
  getRequiredPlanForModel,
  normalizeUserPlan,
  getMonthlyQuotaInfo,
  incrementMonthlyMessages,
  getMonthlyMessagesUsed,
  QUOTA_UPDATE_EVENT,
} from '../utils/planPermissions';

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-work', name: 'Work', color: 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700', textColor: 'text-zinc-800 dark:text-zinc-200' },
  { id: 'tag-personal', name: 'Personal', color: 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'tag-urgent', name: 'Urgent', color: 'bg-rose-100 dark:bg-rose-900/60 border-rose-200 dark:border-rose-800', textColor: 'text-rose-700 dark:text-rose-300' },
  { id: 'tag-code', name: 'Code', color: 'bg-violet-100 dark:bg-violet-900/60 border-violet-200 dark:border-violet-800', textColor: 'text-violet-700 dark:text-violet-300' },
];

interface ChatAppProps {
  onBackToWebsite: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userProfile?: UserProfile | null;
  onSignOut?: () => void;
}

const DEFAULT_FOLDERS: FolderType[] = [];

const DEFAULT_CONVERSATIONS: Conversation[] = [];

const QUICK_PROMPTS = [
  { label: '🌐 Translate this', prompt: 'Translate the following text into Spanish and French with a professional tone:\n\n' },
  { label: '🔍 Analyze code', prompt: 'Analyze this code snippet for performance bottlenecks, edge cases, and security vulnerabilities:\n\n' },
  { label: '📝 Summarize text', prompt: 'Summarize the key takeaways and actionable metrics from the following text into 3 clear bullet points:\n\n' },
  { label: '💡 Explain step-by-step', prompt: 'Explain the following concept step-by-step as if explaining to a beginner:\n\n' },
  { label: '🐛 Debug & Fix', prompt: 'Identify the bug in the following code and provide the fixed code with explanation:\n\n' },
  { label: '✍️ Polish writing', prompt: 'Rewrite and refine the following text for maximum clarity, conciseness, and impact:\n\n' }
];

const hasMarkdownSyntax = (text: string): boolean => {
  if (!text || text.trim().length < 2) return false;
  return /(^|\n)(#+\s|- \s|\*\s|\d+\.\s|>\s|```)|(\*\*|__|`|\[.+\]\(.+\))/m.test(text);
};

const FOLDER_COLOR_OPTIONS = [
  { label: 'Zinc Theme', value: 'bg-zinc-500' },
  { label: 'Violet Theme', value: 'bg-violet-500' },
  { label: 'Emerald Theme', value: 'bg-emerald-500' },
  { label: 'Amber Theme', value: 'bg-amber-500' },
  { label: 'Rose Theme', value: 'bg-rose-500' },
  { label: 'Indigo Theme', value: 'bg-indigo-500' },
  { label: 'Cyan Theme', value: 'bg-cyan-500' },
  { label: 'Pink Theme', value: 'bg-pink-500' },
  { label: 'Teal Theme', value: 'bg-teal-500' },
  { label: 'Orange Theme', value: 'bg-orange-500' },
];

const isGenuineCode = (codeStr: string, lang: string): boolean => {
  if (lang && lang.trim().length > 0 && lang.toLowerCase() !== 'text' && lang.toLowerCase() !== 'plaintext') {
    return true;
  }
  const codePatterns = [
    /^\s*(import|export|const|let|var|function|class|interface|type|enum|public|private|protected|async|await)\b/m,
    /^\s*(def |class |return |if __name__ ==|from \w+ import)/m,
    /^\s*(#include|using namespace|std::|int main\(|void \w+\()/m,
    /^\s*(package |import java\.|public class )/m,
    /^\s*(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE)\b/i,
    /<\/?[\w\s="'-]+>/,
    /[{}()[\]];\s*$/m
  ];
  return codePatterns.some((pattern) => pattern.test(codeStr));
};

const loadedImagesCache = new Set<string>();

interface ImageErrorBoundaryProps {
  children: React.ReactNode;
  fallbackSubject?: string;
  originalPrompt?: string;
  alt?: string;
  onPreview?: (url: string, prompt: string) => void;
  onFallbackRendered?: (info: { url: string; prompt: string; alt: string }) => void;
}

interface ImageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  fallbackRendered: boolean;
  renderedFallbackUrl: string | null;
}

class ImageErrorBoundary extends React.Component<ImageErrorBoundaryProps, ImageErrorBoundaryState> {
  constructor(props: ImageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      fallbackRendered: false,
      renderedFallbackUrl: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ImageErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ImageErrorBoundary Caught Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Accept the original alt text as a search term and fetch a static, high-quality placeholder image via Unsplash
      const searchTerm = (this.props.alt || this.props.originalPrompt || this.props.fallbackSubject || 'artwork').trim();
      const promptText = (this.props.originalPrompt || this.props.fallbackSubject || this.props.alt || 'artwork').trim();
      const altText = (this.props.alt || promptText || 'Visual Artwork').trim();
      const fallbackUrl = getHighResUnsplashUrl(searchTerm, 1024, 1024);

      return (
        <div
          data-fallback-rendered={this.state.fallbackRendered ? 'true' : 'false'}
          className="my-3 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex flex-col gap-2 max-w-md"
        >
          <div className="flex items-center justify-between gap-2 font-medium text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Image render recovered safely</span>
            </div>
            {this.state.fallbackRendered && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                Unsplash Fallback Active
              </span>
            )}
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
            A static high-resolution photograph matching &ldquo;{searchTerm}&rdquo; was loaded via Unsplash to maintain interface stability.
          </p>
          <img
            src={fallbackUrl}
            alt={altText}
            title={searchTerm}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto rounded-xl border border-amber-500/20 mt-1 cursor-pointer hover:opacity-95 transition-opacity"
            onLoad={() => {
              if (!this.state.fallbackRendered) {
                console.log('[ImageErrorBoundary] Unsplash static fallback image actually rendered for request:', {
                  searchTerm,
                  prompt: promptText,
                  alt: altText,
                  fallbackUrl
                });
                this.setState({ fallbackRendered: true, renderedFallbackUrl: fallbackUrl });
                this.props.onFallbackRendered?.({ url: fallbackUrl, prompt: promptText, alt: altText });
              }
            }}
            onError={(e) => {
              console.error('[ImageErrorBoundary] Unsplash static fallback image failed to load:', {
                searchTerm,
                prompt: promptText,
                alt: altText,
                fallbackUrl,
                error: e
              });
            }}
            onClick={() => this.props.onPreview?.(fallbackUrl, promptText)}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const diagnoseImageError = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return 'Invalid empty image URL';
  if (imageUrl.startsWith('data:')) {
    return 'Corrupted Base64 image payload';
  }
  if (!navigator.onLine) {
    return 'Network connection offline';
  }
  try {
    const res = await fetch(imageUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' });
    if (!res.ok) {
      if (res.status === 404) return '404 Not Found - Image resource unavailable';
      if (res.status === 403) return '403 Forbidden - Access denied to image resource';
      if (res.status >= 500) return `Server Error (HTTP ${res.status})`;
      return `HTTP ${res.status} ${res.statusText || 'Error'}`;
    }
    return 'CORS restriction or image decoding failure';
  } catch (err: any) {
    if (err?.name === 'TypeError' && err?.message?.toLowerCase().includes('fetch')) {
      return 'CORS restriction or network connection blocked';
    }
    return err?.message ? `Network/CORS error (${err.message})` : 'Network error or CORS restriction';
  }
};

const logImageFailure = (url: string, altText: string, reason: string, extra?: any) => {
  const errorDetails = {
    event: 'IMAGE_LOAD_FAILURE',
    url,
    altText,
    reason,
    timestamp: new Date().toISOString(),
    extra: extra || null,
  };
  console.error(`[ProseChatImage Error Monitor] Failed to load image from "${url}": ${reason}`, errorDetails);
  
  if (typeof (window as any).__logAppError === 'function') {
    (window as any).__logAppError('IMAGE_LOAD_FAILURE', errorDetails);
  }
};

export const extractImagesFromMessage = (msg: ChatMessage): GalleryImage[] => {
  const list: GalleryImage[] = [];
  if (!msg || (!msg.content && !msg.attachments)) return list;

  const normalized = normalizeMarkdownImages(msg.content);
  const imgRegex = /!\[([^\]]*)\]\(([^)]*)\)/g;
  let match;
  while ((match = imgRegex.exec(normalized)) !== null) {
    const rawMatch = match[0];
    const alt = match[1] || 'Visual Art';
    const url = match[2];

    // Specific guard checking for !url or url containing 'undefined' / 'null' immediately after extraction
    if (!url || !url.trim() || url.includes('undefined') || url.includes('null') || url === '/null' || url === '/undefined') {
      console.warn('[extractImagesFromMessage Guard] Empty or malformed image URL detected immediately after extraction:', {
        messageId: msg.id,
        rawMatch,
        url,
        alt,
        exactMessageContent: msg.content,
        timestamp: new Date().toISOString()
      });
      continue;
    }

    list.push({
      id: `${msg.id}-${list.length}`,
      url: url.trim(),
      alt,
      prompt: alt,
      messageId: msg.id
    });
  }

  if (msg.attachments) {
    msg.attachments.forEach((att: any, attIdx: number) => {
      if (att.type === 'image' || att.url?.startsWith('data:image') || att.mimeType?.startsWith('image/')) {
        const attUrl = att.url;
        if (!attUrl || attUrl.includes('undefined') || attUrl.includes('null')) {
          console.warn('[extractImagesFromMessage Guard] Attachment has empty or undefined URL:', {
            messageId: msg.id,
            attachment: att,
            exactMessageContent: msg.content
          });
          return;
        }
        list.push({
          id: `${msg.id}-att-${attIdx}`,
          url: attUrl,
          alt: att.name || 'Image Attachment',
          prompt: att.name || 'Image Attachment',
          messageId: msg.id
        });
      }
    });
  }

  return list;
};

interface ImageStatusState {
  stage: 'loading' | 'ready' | 'error';
  errorReason?: string;
  isRetrying?: boolean;
}

const ProseChatImage: React.FC<{
  src?: string;
  alt?: string;
  onPreview: (url: string, prompt: string) => void;
  [key: string]: any;
}> = React.memo(({ src, alt, onPreview, node, children: _children, ...restProps }) => {
  const isInputSrcEmpty = !src || typeof src !== 'string' || src.trim() === '' || src.includes('undefined') || src.includes('null');
  const promptText = (alt || (restProps as any)?.['data-prompt'] || 'Visual Art').trim();

  // Use a ref to track loading state without causing redundant re-renders or blinking while text streams
  const initialStage: ImageStatusState['stage'] = (src && loadedImagesCache.has(src)) ? 'ready' : 'loading';
  const stageRef = useRef<ImageStatusState['stage']>(initialStage);
  const [status, setStatus] = useState<ImageStatusState>({ stage: initialStage });
  const [retryCount, setRetryCount] = useState(0);

  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  const activeSrc = useMemo(() => {
    if (fallbackSrc) return fallbackSrc;
    if (!src || typeof src !== 'string' || !src.trim() || src.includes('undefined') || src.includes('null')) {
      return '';
    }
    if (retryCount === 0) return src;
    if (src.startsWith('data:')) return src;
    const delimiter = src.includes('?') ? '&' : '?';
    return `${src}${delimiter}_retry=${retryCount}`;
  }, [src, fallbackSrc, retryCount]);

  const prevActiveSrcRef = useRef(activeSrc);
  const prevRetryRef = useRef(retryCount);

  // setStatus is only called when actual source loading changes or completes
  const markReady = useCallback(() => {
    if (activeSrc) loadedImagesCache.add(activeSrc);
    if (stageRef.current === 'ready') return; // Prevent unnecessary component updates and blinking
    stageRef.current = 'ready';
    setStatus({ stage: 'ready' });
  }, [activeSrc]);

  useEffect(() => {
    if (!activeSrc) return;

    const srcChanged = prevActiveSrcRef.current !== activeSrc;
    const retryChanged = prevRetryRef.current !== retryCount;

    // Only update state if activeSrc or retryCount changed; avoids blinking while streaming text
    if (srcChanged || retryChanged) {
      prevActiveSrcRef.current = activeSrc;
      prevRetryRef.current = retryCount;

      if (loadedImagesCache.has(activeSrc) && retryCount === 0) {
        markReady();
        return;
      }

      // Check if the image element in the DOM has already completed loading
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        markReady();
        return;
      }

      if (stageRef.current !== 'loading') {
        stageRef.current = 'loading';
        setStatus({ stage: 'loading', isRetrying: retryCount > 0 });
      }
    }
  }, [activeSrc, retryCount, markReady]);

  if (isInputSrcEmpty && !fallbackSrc) {
    console.warn('[ProseChatImage] REJECTED RENDER: Image src prop is empty or invalid, and no fallback is active:', {
      src,
      srcType: typeof src,
      srcLength: src ? src.length : 0,
      alt,
      promptText,
      nodeProperties: node?.properties,
      restPropsKeys: Object.keys(restProps || {}),
      stackTrace: new Error('Empty image URL in ProseChatImage').stack,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  const isReady = status.stage === 'ready';
  const isError = status.stage === 'error';
  const isLoading = status.stage === 'loading';

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFallbackSrc(null);
    stageRef.current = 'loading';
    setStatus({ stage: 'loading', isRetrying: true });
    setRetryCount((prev) => prev + 1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const initialWidth = containerRef.current ? containerRef.current.offsetWidth : (width || 400);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(1200, initialWidth + deltaX));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    setIsResizing(true);
    const startX = e.touches[0].clientX;
    const initialWidth = containerRef.current ? containerRef.current.offsetWidth : (width || 400);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const deltaX = moveEvent.touches[0].clientX - startX;
      const newWidth = Math.max(160, Math.min(1200, initialWidth + deltaX));
      setWidth(newWidth);
    };

    const onTouchEnd = () => {
      setIsResizing(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleSaveToDevice = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    const downloadUrl = activeSrc || src;
    try {
      const fileName = `generated-image-${Date.now()}.png`;
      if (downloadUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(downloadUrl, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2500);
    } catch (err) {
      console.warn('Direct fetch download fallback', err);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleEnhance = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEnhanced((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...(width ? { width: `${width}px` } : {}),
        maxWidth: '100%',
        contain: 'paint',
      }}
      className={`relative group my-3 inline-block cursor-pointer rounded-2xl max-w-full overflow-hidden select-none transition-shadow duration-200 ${
        isResizing ? 'ring-2 ring-purple-500 shadow-xl' : ''
      }`}
      onClick={() => {
        if (!isResizing && isReady) {
          onPreview(activeSrc || src, promptText);
        }
      }}
    >
      {/* 1. Lightweight CSS Skeleton Loader with Stable Aspect Ratio */}
      {isLoading && (
        <div className="w-80 sm:w-96 max-w-full aspect-[16/9] min-h-[200px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-center gap-3 p-6 text-zinc-400 dark:text-zinc-500 shadow-xs animate-skeleton-shimmer relative overflow-hidden">
          <div className="p-3.5 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300/40 dark:border-zinc-700/40 flex items-center justify-center shadow-2xs backdrop-blur-xs">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>{status.isRetrying ? 'Retrying image load...' : 'Rendering visual artwork...'}</span>
          </div>
        </div>
      )}

      {/* 2. Error State Container with 'Retry' Button and Diagnostic Logging */}
      {isError && (
        <div className="w-80 sm:w-96 max-w-full aspect-[16/9] min-h-[200px] rounded-2xl bg-rose-50/90 dark:bg-zinc-900/90 border border-rose-200 dark:border-rose-900/50 flex flex-col items-center justify-center p-5 text-center gap-2.5 shadow-xs relative">
          <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1 max-w-[90%]">
            <p className="text-xs sm:text-sm font-semibold text-rose-950 dark:text-rose-200">
              Image Load Failed
            </p>
            {status.errorReason && (
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 font-mono truncate max-w-full" title={status.errorReason}>
                {status.errorReason}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Image</span>
          </button>
        </div>
      )}

      {/* 3. Loaded Image Tag with Lazy Loading */}
      {!isError && (
        <img
          ref={imgRef}
          src={activeSrc}
          alt={isReady ? promptText : ''}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => {
            markReady();
          }}
          onError={async () => {
            if (!fallbackSrc) {
              const fallback = getHighResUnsplashUrl(promptText, 1024, 1024);
              if (fallback !== activeSrc) {
                setFallbackSrc(fallback);
                return;
              }
            }
            const reason = await diagnoseImageError(activeSrc);
            logImageFailure(activeSrc, promptText, reason);
            if (stageRef.current !== 'error') {
              stageRef.current = 'error';
              setStatus({ stage: 'error', errorReason: reason });
            }
          }}
          style={{
            filter: isEnhanced ? 'contrast(1.25) saturate(1.4) brightness(1.03)' : 'none',
          }}
          className={`w-full max-w-full h-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md transition-opacity duration-300 group-hover:brightness-[1.02] ${
            isReady ? 'opacity-100 block' : 'opacity-0 absolute inset-0 w-full h-full object-cover pointer-events-none'
          }`}
          {...restProps}
        />
      )}

      {isReady && (
        <>
          {/* Top Control Bar: Enhance Toggle, Save to Device, and Preview Indicator */}
          <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto z-10">
            {/* Enhance Toggle */}
            <button
              type="button"
              onClick={toggleEnhance}
              title={isEnhanced ? "Enhanced mode active (Click to reset)" : "Enhance contrast & saturation"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-md transition-all transform active:scale-95 ${
                isEnhanced
                  ? 'bg-amber-500/90 text-white ring-1 ring-amber-300 shadow-amber-500/30'
                  : 'bg-black/75 hover:bg-black/90 text-zinc-200 hover:text-white border border-white/20'
              }`}
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhanced ? 'animate-pulse text-amber-200' : 'text-amber-400'}`} />
              <span>{isEnhanced ? 'Enhanced' : 'Enhance'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              {/* Save to Device Button */}
              <button
                type="button"
                onClick={handleSaveToDevice}
                disabled={isDownloading}
                title="Save generated image to your device"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-md transition-all transform active:scale-95 ${
                  isDownloaded
                    ? 'bg-emerald-600 text-white border border-emerald-400'
                    : 'bg-black/75 hover:bg-black/90 text-zinc-200 hover:text-white border border-white/20'
                }`}
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : isDownloaded ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isDownloaded ? 'Saved!' : 'Save'}</span>
              </button>

              {/* Full Preview Indicator */}
              <div className="hidden sm:flex items-center gap-1 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md pointer-events-none">
                <Maximize2 className="w-2.5 h-2.5 text-purple-400" />
                <span>Preview</span>
              </div>
            </div>
          </div>

          {/* Bottom Right Drag Handle for Interactive Resizing */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title="Click and drag to resize image"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 hover:bg-purple-600 text-white p-1.5 rounded-br-xl rounded-tl-lg border border-white/30 cursor-se-resize shadow-lg flex items-center justify-center z-10 active:scale-110 active:bg-purple-600"
          >
            <GripHorizontal className="w-3.5 h-3.5 rotate-45 transform text-zinc-200 group-hover:text-white" />
          </div>
        </>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.src === next.src && prev.alt === next.alt;
});


interface ChatMessageItemProps {
  msg: ChatMessage;
  isStreaming: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  isCurrentActiveMatch: boolean;
  isEditingThisMsg: boolean;
  editingText: string;
  chatSearchQuery: string;
  copiedCodeId: string | null;
  speakingMsgId: string | null;
  loadingTtsMsgId?: string | null;
  markdownComponents: any;
  handleSaveEditedMessage: (id: string) => void;
  setEditingMsgId: (id: string | null) => void;
  setEditingText: (text: string) => void;
  handlePreviewImage: (url: string, prompt: string) => void;
  setOpenThreadMsgId: (id: string | null) => void;
  handleCopyText: (text: string, id: string) => void;
  handleReaction: (id: string, isLiked: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  handleRegenerateResponse: (id: string) => void;
  handleSpeakText: (text: string, id: string) => void;
  getSuggestions: (id: string) => string[] | undefined;
  handleSendMessage: (text: string) => void;
  renderHighlightedText: (text: string, query: string) => React.ReactNode;
  isGenerating?: boolean;
  activeConvThreads?: Record<string, ChatMessage[]>;
  onOpenGalleryWithList?: (list: GalleryImage[], index: number) => void;
  showToast?: (msg: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  isStreaming,
  isSelected,
  isSearchMatch,
  isCurrentActiveMatch,
  isEditingThisMsg,
  editingText,
  chatSearchQuery,
  copiedCodeId,
  speakingMsgId,
  loadingTtsMsgId,
  markdownComponents,
  handleSaveEditedMessage,
  setEditingMsgId,
  setEditingText,
  setOpenThreadMsgId,
  handleCopyText,
  handleReaction,
  setIsShareModalOpen,
  handleRegenerateResponse,
  handleSpeakText,
  getSuggestions,
  handleSendMessage,
  renderHighlightedText,
  isGenerating,
  activeConvThreads,
  onOpenGalleryWithList,
  showToast
}) => {
  const msgImages = useMemo(() => extractImagesFromMessage(msg), [msg]);
  const isMultiImageMessage = msgImages.length >= 2;
  if (msg.role === 'user') {
    return (
      <motion.div
        key={msg.id}
        id={`msg-${msg.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`flex justify-end gap-2 items-start group/msg my-2 rounded-3xl transition-all ${
          isCurrentActiveMatch
            ? 'ring-2 ring-amber-500 shadow-xl scale-[1.002] p-1 bg-amber-500/10 dark:bg-amber-500/20'
            : isSearchMatch
            ? 'ring-1.5 ring-amber-400/80'
            : ''
        }`}
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%] space-y-1">
          {isEditingThisMsg ? (
            <div className="w-full space-y-2 bg-white dark:bg-zinc-900 p-3.5 rounded-3xl border-2 border-zinc-500 shadow-lg">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-zinc-50 dark:bg-black text-black dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-1 focus:ring-zinc-500 resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-400 font-mono">Editing message</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingMsgId(null); setEditingText(''); }}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-black dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEditedMessage(msg.id)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-full flex items-center gap-1 cursor-pointer"
                  >
                    Save & Resend
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`px-5 py-3 rounded-[24px] text-sm leading-relaxed ${
                isSelected ? 'ring-2 ring-zinc-500' : ''
              } bg-zinc-200/90 dark:bg-[#2f2f2f] text-zinc-900 dark:text-zinc-100 shadow-2xs`}
            >
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2.5 space-y-2">
                  {msg.attachments.map((att) => (
                    <div key={att.id}>
                      {att.type === 'image' && att.url ? (
                        <img src={att.url} alt="upload" className="max-h-48 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                      ) : att.type !== 'image' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-mono border border-zinc-200 dark:border-zinc-800">
                          <FileText className="w-4 h-4 text-zinc-400" /> {att.name}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {msg.content.includes('```') ? (
                <div className="prose-chat max-w-none text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    urlTransform={(url) => url}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {chatSearchQuery.trim() ? renderHighlightedText(msg.content, chatSearchQuery) : msg.content}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <span>{msg.timestamp}</span>
            <span>•</span>
            <button
              onClick={() => { setEditingMsgId(msg.id); setEditingText(msg.content); }}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const normalizedContent = useMemo(() => normalizeMarkdownImages(msg.content), [msg.content]);
  const hasImage = normalizedContent.includes('![');

  return (
    <motion.div
      key={msg.id}
      id={`msg-${msg.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 items-start group/msg my-3 rounded-3xl p-2 transition-all ${
        isCurrentActiveMatch
          ? 'ring-2 ring-amber-500 shadow-xl bg-amber-500/10 dark:bg-amber-500/15'
          : isSearchMatch
          ? 'ring-1.5 ring-amber-400/60 bg-amber-400/5'
          : ''
      }`}
    >
      <div className="flex-1 min-w-0 space-y-3">
        {/* Assistant Message Canvas */}
        <div className="text-sm sm:text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
          {!msg.content && (msg.status === 'streaming' || isStreaming) ? (
            <div className="flex items-center gap-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 text-sm sm:text-base font-medium w-fit my-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-mono text-base sm:text-lg font-bold animate-pulse select-none leading-none inline-flex items-center">
                o
              </span>
              <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200">
                Analyzing
              </span>
            </div>
          ) : (
            <div className={`prose-chat max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-3 ${!isStreaming && msg.status !== 'streaming' && !hasImage ? 'animate-stream-complete' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
                urlTransform={(url) => url}
              >
                {normalizedContent}
              </ReactMarkdown>

              {/* Multi-Image Reorderable Grid for Messages with Multiple Generated Visuals */}
              {isMultiImageMessage && onOpenGalleryWithList && (
                <ReorderableImageGrid
                  images={msgImages}
                  onOpenGallery={(idx, list) => onOpenGalleryWithList(list, idx)}
                  showToast={showToast}
                />
              )}
            </div>
          )}
        </div>

        {/* Assistant message action tools toolbar */}
        <div className="flex items-center gap-1 pt-1 text-zinc-400 dark:text-zinc-500 flex-wrap">
          <button
            type="button"
            onClick={() => setOpenThreadMsgId(msg.id)}
            className="px-2 py-1 text-xs hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium text-zinc-500"
            title="Reply in side thread"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reply in Thread</span>
          </button>

          <button
            onClick={() => handleCopyText(msg.content, msg.id)}
            className="p-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Copy response"
          >
            {copiedCodeId === msg.id ? <Check className="w-4 h-4 text-zinc-300" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleReaction(msg.id, true)}
            className={`p-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer ${
              msg.isLiked === true ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''
            }`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleReaction(msg.id, false)}
            className={`p-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer ${
              msg.isLiked === false ? 'text-rose-500 font-bold' : ''
            }`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Share / Export"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleRegenerateResponse(msg.id)}
            className="p-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Regenerate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Follow-up Question Suggestion Chips */}
        {(() => {
          const suggestions = getSuggestions(msg.id);
          if (!suggestions || suggestions.length === 0 || msg.status === 'streaming') return null;
          return (
            <div className="pt-3 pb-1 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 select-none">
                <span>Suggested follow-ups</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {suggestions.map((suggestionText, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSendMessage(suggestionText)}
                    disabled={isGenerating}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer text-left shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="leading-snug">{suggestionText}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {activeConvThreads?.[msg.id] && activeConvThreads[msg.id].length > 0 && (
          <button
            type="button"
            onClick={() => setOpenThreadMsgId(msg.id)}
            className="mt-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer w-fit shadow-2xs"
          >
            <CornerDownRight className="w-3.5 h-3.5 text-zinc-400" />
            <span>{activeConvThreads[msg.id].length} thread {activeConvThreads[msg.id].length === 1 ? 'reply' : 'replies'}</span>
            <span className="text-[10px] opacity-70">• View Thread</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}, (prev: ChatMessageItemProps, next: ChatMessageItemProps): boolean => {
  // 1. Message entity check (content, status, reactions, attachments)
  if (prev.msg !== next.msg) return false;

  // 2. Message-specific streaming state
  if (prev.isStreaming !== next.isStreaming) return false;

  // 3. Selection state
  if (prev.isSelected !== next.isSelected) return false;

  // 4. Search matching highlights
  if (prev.isSearchMatch !== next.isSearchMatch) return false;
  if (prev.isCurrentActiveMatch !== next.isCurrentActiveMatch) return false;
  if (prev.chatSearchQuery !== next.chatSearchQuery && (prev.isSearchMatch || next.isSearchMatch)) return false;

  // 5. In-flight editing
  if (prev.isEditingThisMsg !== next.isEditingThisMsg) return false;
  if (next.isEditingThisMsg && prev.editingText !== next.editingText) return false;

  // 6. Speaking & Loading TTS status (only re-render if it affects this specific message)
  const prevSpeaking = prev.speakingMsgId === prev.msg.id;
  const nextSpeaking = next.speakingMsgId === next.msg.id;
  if (prevSpeaking !== nextSpeaking) return false;

  const prevLoading = prev.loadingTtsMsgId === prev.msg.id;
  const nextLoading = next.loadingTtsMsgId === next.msg.id;
  if (prevLoading !== nextLoading) return false;

  // 7. Copied code block status
  const prevCopied = prev.copiedCodeId === prev.msg.id;
  const nextCopied = next.copiedCodeId === next.msg.id;
  if (prevCopied !== nextCopied) return false;

  // 8. Active threads replies count for this message
  const prevThreads = prev.activeConvThreads?.[prev.msg.id]?.length || 0;
  const nextThreads = next.activeConvThreads?.[next.msg.id]?.length || 0;
  if (prevThreads !== nextThreads) return false;

  // 9. Overall generation state
  if (prev.isGenerating !== next.isGenerating) return false;

  return true;
});

interface CodeBlockProps {
  codeString: string;
  language: string;
  fullMessageContent?: string;
  codeTheme?: CodeThemeId;
  onSelectCodeTheme?: (themeId: CodeThemeId) => void;
  onCopyBlock: (code: string) => void;
  onCopyAll?: (text: string) => void;
  onShowToast?: (message: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  codeString,
  language,
  fullMessageContent,
  codeTheme = 'github-dark',
  onSelectCodeTheme,
  onCopyBlock,
  onCopyAll,
  onShowToast
}) => {
  const [isWordWrap, setIsWordWrap] = useState(false);
  const [isBlockCopied, setIsBlockCopied] = useState(false);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<CodeThemeId>(codeTheme);

  useEffect(() => {
    setActiveThemeId(codeTheme);
  }, [codeTheme]);

  const currentTheme = CODE_THEMES[activeThemeId] || CODE_THEMES['github-dark'];

  const lines = codeString.split('\n');
  const FOLD_THRESHOLD = 12;
  const PREVIEW_LINES = 8;
  const [isFolded, setIsFolded] = useState(lines.length > FOLD_THRESHOLD);

  // Extract all code blocks from fullMessageContent
  const allBlocksInMsg = React.useMemo(() => {
    if (!fullMessageContent) return [codeString];
    const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;
    while ((match = regex.exec(fullMessageContent)) !== null) {
      if (match[1].trim()) {
        blocks.push(match[1].trim());
      }
    }
    return blocks.length > 0 ? blocks : [codeString];
  }, [fullMessageContent, codeString]);

  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);

  const handleDownloadCode = () => {
    const extMap: Record<string, string> = {
      typescript: 'ts', ts: 'ts', tsx: 'tsx', javascript: 'js', js: 'js', jsx: 'jsx',
      python: 'py', py: 'py', sql: 'sql', html: 'html', css: 'css', json: 'json',
      rust: 'rs', rs: 'rs', go: 'go', java: 'java', cpp: 'cpp', c: 'c', sh: 'sh', bash: 'sh'
    };
    const cleanLang = (language || 'code').toLowerCase().trim();
    const ext = extMap[cleanLang] || 'txt';
    const blob = new Blob([codeString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Downloaded snippet as code-snippet.${ext}`);
  };

  const handleCopyThisBlock = () => {
    onCopyBlock(codeString);
    setIsBlockCopied(true);
    setTimeout(() => setIsBlockCopied(false), 2000);
  };

  const handleCopyAllBlocks = () => {
    const combined = allBlocksInMsg.join('\n\n/* --- Next Code File --- */\n\n');
    if (onCopyAll) {
      onCopyAll(combined);
    } else {
      onCopyBlock(combined);
    }
    setIsAllCopied(true);
    if (onShowToast) {
      onShowToast(`Copied all ${allBlocksInMsg.length} code blocks from response!`);
    }
    setTimeout(() => setIsAllCopied(false), 2000);
  };

  const handleThemeChange = (themeId: CodeThemeId) => {
    setActiveThemeId(themeId);
    setIsThemeMenuOpen(false);
    if (onSelectCodeTheme) {
      onSelectCodeTheme(themeId);
    }
    if (onShowToast) {
      onShowToast(`Code syntax theme set to ${CODE_THEMES[themeId]?.name || themeId}`);
    }
  };

  const displayedLines = isFolded ? lines.slice(0, PREVIEW_LINES) : lines;

  return (
    <>
      <div className={`relative my-4 rounded-2xl overflow-hidden border ${currentTheme.borderClass} ${currentTheme.bgClass} text-xs shadow-md transition-all duration-200 font-mono`}>
        {/* Code Block Header */}
        <div className={`flex items-center justify-between px-3.5 py-2 ${currentTheme.headerBg} border-b ${currentTheme.borderClass} text-[11px] ${currentTheme.headerText}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-white/10 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
              {language || 'code'}
            </span>
            <span className="text-[10px] opacity-60 font-mono">({lines.length} lines)</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Syntax Theme Quick Picker Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors cursor-pointer text-[10px] font-medium"
                title="Change code syntax highlighting theme"
              >
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex items-center gap-1">
                  {currentTheme.previewColors.map((dot, i) => (
                    <span key={i} className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: dot }} />
                  ))}
                </div>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-48 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                    Syntax Highlighting Theme
                  </div>
                  {CODE_THEME_LIST.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleThemeChange(th.id)}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800 text-[11px] transition-colors cursor-pointer ${
                        activeThemeId === th.id ? 'text-white font-bold bg-zinc-800/80' : 'text-zinc-300'
                      }`}
                    >
                      <span>{th.name}</span>
                      <div className="flex items-center gap-1">
                        {th.previewColors.map((dot, idx) => (
                          <span key={idx} className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fold / Expand Section Button */}
            {lines.length > PREVIEW_LINES && (
              <button
                type="button"
                onClick={() => setIsFolded(!isFolded)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] ${
                  isFolded
                    ? 'bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30'
                    : 'hover:bg-black/20 dark:hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
                title={isFolded ? 'Expand full code block' : 'Fold code block'}
              >
                {isFolded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                <span>{isFolded ? `Folded (${lines.length})` : 'Fold'}</span>
              </button>
            )}

            {/* Word Wrap Toggle */}
            <button
              type="button"
              onClick={() => setIsWordWrap(!isWordWrap)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] ${
                isWordWrap
                  ? 'bg-black/20 dark:bg-white/10 font-semibold border border-white/10'
                  : 'hover:bg-black/20 dark:hover:bg-white/10 opacity-80 hover:opacity-100'
              }`}
              title={isWordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
            >
              <WrapText className="w-3 h-3" />
              <span>{isWordWrap ? 'Wrapped' : 'Wrap'}</span>
            </button>

            {/* Download Code Snippet */}
            <button
              type="button"
              onClick={handleDownloadCode}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors cursor-pointer text-[10px] opacity-80 hover:opacity-100"
              title="Download code snippet"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>

            {/* Fullscreen Expand Modal Toggle */}
            <button
              type="button"
              onClick={() => setIsExpandedModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors cursor-pointer text-[10px] opacity-80 hover:opacity-100"
              title="Fullscreen View"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expand</span>
            </button>

            {/* Copy Single Block */}
            <button
              type="button"
              onClick={handleCopyThisBlock}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors cursor-pointer text-[10px] opacity-90 hover:opacity-100 font-semibold"
              title="Copy code"
            >
              {isBlockCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isBlockCopied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Copy All Code Blocks */}
            {allBlocksInMsg.length > 1 && (
              <button
                type="button"
                onClick={handleCopyAllBlocks}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/20 dark:bg-white/10 hover:bg-black/30 text-[10px] font-semibold border border-white/10 transition-colors cursor-pointer"
                title={`Copy all ${allBlocksInMsg.length} code blocks from this response`}
              >
                {isAllCopied ? <Check className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                <span>{isAllCopied ? 'All Copied' : `Copy All (${allBlocksInMsg.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Display Container */}
        <div className="relative">
          <div className={`p-3 text-xs leading-relaxed flex overflow-x-auto ${isWordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
            {/* Line Numbers Column */}
            <div className={`select-none pr-3 mr-3 border-r ${currentTheme.borderClass} text-right ${currentTheme.lineNoColor} text-[11px] font-mono shrink-0 space-y-0`}>
              {displayedLines.map((_, i) => (
                <div key={i} className="leading-relaxed">{i + 1}</div>
              ))}
            </div>
            {/* Code Content */}
            <div className="flex-1 min-w-0 font-mono">
              {displayedLines.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {renderHighlightedLine(line, currentTheme)}
                </div>
              ))}
            </div>
          </div>

          {/* Gradient Mask Fade Overlay when Folded */}
          {isFolded && lines.length > PREVIEW_LINES && (
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-2 pointer-events-none">
              <button
                type="button"
                onClick={() => setIsFolded(false)}
                className="pointer-events-auto px-4 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 rounded-xl text-xs font-semibold shadow-xl border border-zinc-700/80 backdrop-blur-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 text-blue-400" />
                <span>Expand {lines.length - PREVIEW_LINES} remaining lines</span>
              </button>
            </div>
          )}
        </div>

        {/* Fold Interactive Banner when Expanded */}
        {!isFolded && lines.length > FOLD_THRESHOLD && (
          <button
            type="button"
            onClick={() => setIsFolded(true)}
            className={`w-full py-2 px-3 ${currentTheme.headerBg} border-t ${currentTheme.borderClass} ${currentTheme.headerText} font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover:opacity-80`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Fold long code snippet ({lines.length} lines)</span>
          </button>
        )}
      </div>

      {/* Fullscreen Code Modal */}
      <AnimatePresence>
        {isExpandedModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold uppercase tracking-wider text-xs bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
                    {language || 'code'}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{lines.length} lines</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCode}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                  <button
                    onClick={handleCopyThisBlock}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isBlockCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isBlockCopied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => setIsExpandedModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer hover:bg-zinc-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fullscreen Code Content */}
              <div className="flex-1 overflow-auto p-4 bg-[#0d0d11] font-mono text-xs leading-relaxed flex">
                <div className="select-none pr-4 mr-4 border-r border-zinc-800 text-right text-zinc-600 font-mono shrink-0 space-y-0">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="flex-1 whitespace-pre">
                  {lines.map((line, idx) => (
                    <div key={idx}>{renderHighlightedLine(line, currentTheme)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export interface ModelConfig {
  id: string;
  name: string;
  badge: string;
  category: 'AVO Native' | 'Specialized Engines' | 'OpenAI Models' | 'Groq & OpenRouter';
  description: string;
  features: string[];
}

export const EXTENDED_MODELS: ModelConfig[] = [
  {
    id: 'avo-omni-unified',
    name: 'AVO Universal Omni Model',
    badge: 'Unified SuperModel',
    category: 'AVO Native',
    description: 'Supreme unified AI engine blending Gemini 3.5 Pro, GPT-4o, Claude 3.5 Sonnet, DeepSeek R1, Groq Llama 3.3 & Code Master into one model.',
    features: ['Combined Multi-Model Engine', 'Deep Reasoning & Code', 'Multimodal Vision', 'Live Web Grounding', 'Universal Context Window'],
  }
];

export const ChatApp: React.FC<ChatAppProps> = ({
  onBackToWebsite,
  isDarkMode,
  onToggleTheme,
  userProfile,
  onSignOut,
}) => {
  const { user, accounts, switchAccount, removeAccount, signInWithEmail, signUpWithEmail, updateUserPlan } = useAuth();
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [addAccountMode, setAddAccountMode] = useState<'options' | 'email'>('options');
  const [addAccountEmail, setAddAccountEmail] = useState('');
  const [addAccountPassword, setAddAccountPassword] = useState('');
  const [addAccountName, setAddAccountName] = useState('');
  const [isSubmittingNewAccount, setIsSubmittingNewAccount] = useState(false);
  const [addAccountError, setAddAccountError] = useState<string | null>(null);

  const {
    conversations,
    setConversations,
    folders,
    setFolders,
    isSyncing,
    isFirestoreConnected,
    clearAllChats
  } = useFirestoreChats(userProfile || user, DEFAULT_CONVERSATIONS, DEFAULT_FOLDERS);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lastHandledNewRef = useRef<string | null>(null);

  const [activeConvId, setActiveConvId] = useState<string>(() => `conv-${Date.now()}`);

  // Reactive listener to refresh quota when count increments or when calendar month rolls over
  const [quotaVersion, setQuotaVersion] = useState(0);
  useEffect(() => {
    const handleQuotaRefresh = () => {
      setQuotaVersion((v) => v + 1);
    };
    window.addEventListener(QUOTA_UPDATE_EVENT, handleQuotaRefresh);
    window.addEventListener('focus', handleQuotaRefresh);
    document.addEventListener('visibilitychange', handleQuotaRefresh);

    // Periodic check every 30s to detect month boundary crossing (e.g. 23:59:59 -> 00:00:00)
    const intervalId = setInterval(handleQuotaRefresh, 30000);

    return () => {
      window.removeEventListener(QUOTA_UPDATE_EVENT, handleQuotaRefresh);
      window.removeEventListener('focus', handleQuotaRefresh);
      document.removeEventListener('visibilitychange', handleQuotaRefresh);
      clearInterval(intervalId);
    };
  }, []);

  const currentUserEmail = userProfile?.email || user?.email;
  const prevUserEmailRef = useRef<string | undefined>(currentUserEmail);

  useEffect(() => {
    if (prevUserEmailRef.current !== currentUserEmail) {
      prevUserEmailRef.current = currentUserEmail;
      setInput('');
      setAttachments([]);
      if (conversations.length > 0) {
        setActiveConvId(conversations[0].id);
      } else {
        setActiveConvId(`conv-${Date.now()}`);
      }
    }
  }, [currentUserEmail, conversations]);

  const displayUserName = React.useMemo(() => {
    const profileName = userProfile?.name || (user as any)?.displayName || user?.name;
    if (profileName && profileName.trim()) {
      return profileName.trim();
    }
    const email = userProfile?.email || user?.email;
    if (email) {
      const username = email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    return 'there';
  }, [userProfile, user]);

  const userGreetingName = React.useMemo(() => {
    const rawName = userProfile?.name || (user as any)?.displayName || user?.name;
    if (rawName && rawName.trim()) {
      const trimmed = rawName.trim();
      const first = trimmed.split(/\s+/)[0];
      return first || trimmed;
    }
    const email = userProfile?.email || user?.email;
    if (email) {
      const username = email.split('@')[0];
      const clean = username.split(/[._-]/)[0];
      return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : username;
    }
    return '';
  }, [userProfile, user]);

  const userInitials = React.useMemo(() => {
    const name = userProfile?.name || (user as any)?.displayName || user?.name || userProfile?.email || user?.email || 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [userProfile, user]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState(() => localStorage.getItem('nexus_ai_draft_input') || '');
  const [attachments, setAttachments] = useState<Attachment[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_draft_attachments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [openThreadMsgId, setOpenThreadMsgId] = useState<string | null>(null);
  const [threadInput, setThreadInput] = useState('');
  const [isSendingThread, setIsSendingThread] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const { suggestionsMap, getSuggestions, generateSuggestions } = useFollowUpSuggestions();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [cmdPaletteQuery, setCmdPaletteQuery] = useState('');

  // Floating Code Copied Banner & Shortcuts Modal State
  const [showCopyCodeBanner, setShowCopyCodeBanner] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Active Conversation System Override State
  const [isSystemOverrideOpen, setIsSystemOverrideOpen] = useState(false);
  const [overrideInput, setOverrideInput] = useState('');

  // Header Dropdown States
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [showDesktopBanner, setShowDesktopBanner] = useState(true);

  // Dedicated Interactive Modals
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isArtifactsModalOpen, setIsArtifactsModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    url: string | null;
    prompt: string;
    aspectRatio?: string;
    style?: string;
  }>({
    isOpen: false,
    url: null,
    prompt: '',
    aspectRatio: '1:1',
    style: 'cinematic'
  });

  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    images: GalleryImage[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });
  const [razorpayPlanInfo, setRazorpayPlanInfo] = useState<{ planName: string; amount: string }>({
    planName: 'AVO Pro Plus',
    amount: '₹1,599',
  });

  // Clear All Conversation State & Wipes Chat History
  const handleClearAllChatHistory = async () => {
    await clearAllChats();
    setActiveConvId('');
    setInput('');
    setAttachments([]);
    showToast('Wiped all stored chat history & reset conversation state!');
  };

  useEffect(() => {
    (window as any).clearChatHistory = handleClearAllChatHistory;
    return () => {
      delete (window as any).clearChatHistory;
    };
  }, [clearAllChats]);

  const handleSaveSystemOverride = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, systemOverride: overrideInput.trim() || undefined }
          : c
      )
    );
    setIsSystemOverrideOpen(false);
    showToast(overrideInput.trim() ? 'System Override prompt applied to active conversation' : 'System Override cleared');
  };

  const handleClearSystemOverride = () => {
    setOverrideInput('');
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, systemOverride: undefined } : c
      )
    );
    setIsSystemOverrideOpen(false);
    showToast('System Override cleared');
  };

  // Seen Status Indicator Background Timer (marks complete assistant responses as seen after 1s)
  useEffect(() => {
    const hasUnseen = conversations.some((c) =>
      c.messages.some((m) => m.role === 'assistant' && m.status === 'complete' && !m.isSeen)
    );
    if (!hasUnseen) return;

    const timer = setTimeout(() => {
      setConversations((prev) => {
        let hasChanges = false;
        const nextConvs = prev.map((c) => {
          let msgChanged = false;
          const newMsgs = c.messages.map((m) => {
            if (m.role === 'assistant' && m.status === 'complete' && !m.isSeen) {
              msgChanged = true;
              return { ...m, isSeen: true };
            }
            return m;
          });
          if (msgChanged) {
            hasChanges = true;
            return { ...c, messages: newMsgs };
          }
          return c;
        });
        return hasChanges ? nextConvs : prev;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversations]);

  // Copy Code Block Handler
  const handleCopyCodeBlock = useCallback((codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setShowCopyCodeBanner(true);
    setTimeout(() => setShowCopyCodeBanner(false), 3000);
  }, []);

  // Short Title Auto-Generator for descriptive thread names
  const generateShortTitle = (userPrompt: string, assistantResponse: string): string => {
    if (!userPrompt) return 'New Conversation';
    const cleanPrompt = userPrompt.replace(/[#*`\n]/g, ' ').trim();
    const words = cleanPrompt.split(/\s+/).filter(Boolean);
    if (words.length <= 5) {
      return cleanPrompt.slice(0, 36);
    }
    return words.slice(0, 5).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Generate 1-sentence summary based on conversation history
  const generateOneSentenceSummary = (msgs: ChatMessage[], title: string): string => {
    if (!msgs || msgs.length === 0) return 'New conversation thread.';
    const userMsgs = msgs.filter((m) => m.role === 'user');
    const assistantMsgs = msgs.filter((m) => m.role === 'assistant');

    if (userMsgs.length > 0 && assistantMsgs.length > 0) {
      const firstPrompt = userMsgs[0].content.replace(/\s+/g, ' ').trim();
      const lastAnswer = assistantMsgs[assistantMsgs.length - 1].content.replace(/[#*`\n]/g, ' ').replace(/\s+/g, ' ').trim();
      return `${firstPrompt.slice(0, 40)}${firstPrompt.length > 40 ? '...' : ''} — ${lastAnswer.slice(0, 50)}${lastAnswer.length > 50 ? '...' : ''}`;
    } else if (userMsgs.length > 0) {
      const prompt = userMsgs[0].content.replace(/\s+/g, ' ').trim();
      return `${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`;
    }
    return title;
  };

  // Editing User Message State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Save draft input prompt to localStorage safely (debounced by 400ms to eliminate mobile keystroke flash I/O lag)
  useEffect(() => {
    const timer = setTimeout(() => {
      safeLocalStorageSetItem('nexus_ai_draft_input', input);
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    try {
      if (attachments.length > 0) {
        const sanitized = sanitizeAttachmentsForStorage(attachments);
        safeLocalStorageSetItem('nexus_ai_draft_attachments', JSON.stringify(sanitized));
      } else {
        localStorage.removeItem('nexus_ai_draft_attachments');
      }
    } catch {
      // Silently ignore cache storage limit errors
    }
  }, [attachments]);

  // Global Keyboard Listener for Cmd/Ctrl + K Command Palette & Cmd/Ctrl + , Preferences
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Folder & Tag modal / state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderColor, setSelectedFolderColor] = useState('bg-zinc-500');
  const [draggedConvId, setDraggedConvId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [dragOverTargetConvId, setDragOverTargetConvId] = useState<string | null>(null);
  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'active' | 'pinned' | 'archived'>('active');
  const [isPreviewMarkdownDisabled, setIsPreviewMarkdownDisabled] = useState(false);

  // Automatically compute last activity timestamp for each folder based on its conversations
  const getFolderLastActivityTime = (folderId: string): number => {
    const folder = folders.find((f) => f.id === folderId);
    const folderChats = conversations.filter((c) => c.folderId === folderId);
    let latestTime = folder?.updatedAt ? new Date(folder.updatedAt).getTime() : 0;
    for (const chat of folderChats) {
      const chatTime = chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0;
      if (chatTime > latestTime) {
        latestTime = chatTime;
      }
    }
    return latestTime;
  };

  // Folders sorted automatically by 'last updated' / most recent activity
  const sortedFolders = React.useMemo(() => {
    return [...folders].sort((a, b) => getFolderLastActivityTime(b.id) - getFolderLastActivityTime(a.id));
  }, [folders, conversations]);

  // Quick Prompts Popover & Plus Banner State
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [showPlusBanner, setShowPlusBanner] = useState(true);
  const [showRecentsFilter, setShowRecentsFilter] = useState(false);

  // In-Chat Search State
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentSearchMatchIndex, setCurrentSearchMatchIndex] = useState(0);

  // Message History State & Handlers
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);

  const handleJumpToMessage = (messageId: string, convId?: string) => {
    setIsSearchHistoryOpen(false);
    const targetId = convId || activeConvId;
    if (targetId && targetId !== activeConvId) {
      setActiveConvId(targetId);
      setTimeout(() => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-500/10', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-500/10');
          }, 2500);
        }
      }, 200);
    } else {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-500/10', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-500/10');
        }, 2500);
      }
    }
  };

  const handleUsePromptFromHistory = (content: string) => {
    setInput(content);
    setIsSearchHistoryOpen(false);
    showToast('Prompt loaded into chat input');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleDeleteMessageFromHistory = (messageId: string, convId?: string) => {
    const targetConvId = convId || activeConvId;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      )
    );
    showToast('Message deleted');
  };

  const renderHighlightedText = useCallback((text: string, query: string) => {
    if (!query || !query.trim() || typeof text !== 'string') return text;
    const q = query.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    if (parts.length <= 1) return text;

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold px-1 py-0.5 rounded shadow-2xs mx-0.5 inline-block"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // Multi-Message Selection State
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);

  // Sidebar Bulk Delete, Drag&Drop & Markdown Preview State
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [isPreviewMarkdown, setIsPreviewMarkdown] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isStatsCardOpen, setIsStatsCardOpen] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setTimeout(() => {
          const activeEl = document.activeElement;
          if (activeEl && activeEl.closest('#selection-popover')) return;
          setSelectionPopup(null);
        }, 200);
        return;
      }

      const text = sel.toString().trim();
      if (text.length >= 2) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            const chatContainer = chatFeedRef.current;
            if (chatContainer && chatContainer.contains(range.commonAncestorContainer)) {
              setSelectionPopup({
                text,
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }
          }
        } catch (e) {
          // Selection range check
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleAskAvoFromSelection = (selectedTxt: string) => {
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
    const query = `Search and explain in detail: "${selectedTxt}"`;
    setInput(query);
    setSettings((prev) => ({ ...prev, googleSearchGrounding: true }));
    setTimeout(() => {
      handleSendMessage(query);
    }, 50);
    showToast(`Asking AVO AI about selected text...`);
  };

  const handleInsertSelectionToPrompt = (selectedTxt: string) => {
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
    setInput((prev) => (prev ? `${prev}\n\n"${selectedTxt}"` : `"${selectedTxt}"`));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showToast(`Inserted selection into prompt`);
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const processUploadedFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const userPlan = normalizeUserPlan(userProfile?.plan);
    if (userPlan === 'FREE') {
      showToast('🔒 PDF & Document analysis and Image Understanding require Pro Plan. Upgrade to unlock.');
      setRazorpayPlanInfo({ planName: 'AVO AI PRO Plan', amount: '999' });
      setIsUpgradeModalOpen(true);
      return;
    }

    const readPromises = files.map((file, idx) => {
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const resultStr = (reader.result as string) || '';
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : '';
          let derivedMime = file.type;
          if (!derivedMime || derivedMime === 'application/octet-stream') {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'pdf') derivedMime = 'application/pdf';
            else if (ext === 'txt' || ext === 'md' || ext === 'log') derivedMime = 'text/plain';
            else if (ext === 'json') derivedMime = 'application/json';
            else if (ext === 'csv') derivedMime = 'text/csv';
            else if (ext === 'png') derivedMime = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') derivedMime = 'image/jpeg';
            else if (ext === 'webp') derivedMime = 'image/webp';
            else derivedMime = 'application/pdf';
          }

          resolve({
            id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: derivedMime.startsWith('image/') ? 'image' : 'file',
            url: resultStr,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            mimeType: derivedMime,
            data: base64Data
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newAtts = await Promise.all(readPromises);
    setAttachments((prev) => [...prev, ...newAtts]);
    showToast(`Attached ${newAtts.length} file${newAtts.length > 1 ? 's' : ''}`);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const [settings, setSettings] = useState<AppSettings>({
    model: 'gemini-3.1-flash-lite',
    systemPrompt: 'You are AVO AI, a general-purpose AI assistant built by mysea.ai. You are helpful, accurate, versatile, and code-capable. You assist users with programming, software engineering, writing, research, mathematics, and problem-solving. If asked who built you, who created you, who made you, or who developed you, you must state that you were built by mysea.ai. Answer questions directly, accurately, and thoroughly without unnecessary refusals or restrictive disclaimers.',
    temperature: 0.7,
    soundEffects: true,
    autoScroll: true,
    theme: isDarkMode ? 'dark' : 'light',
    appearance: 'system',
    contrast: 'system',
    accentColor: 'default',
    language: 'auto',
    higherIntelligence: true,
    enableDictation: true,
    desktopPushAlerts: true,
    googleSearchGrounding: true,
    codeInterpreter: true,
    improveModel: true,
    safeSearch: true,
    parentalFilter: false,
    voicePitch: 'medium',
    voiceSpeed: 1.0,
    voiceVolume: 0.8,
    codeTheme: 'github-dark'
  });

  // Active audio player reference (HTML5 Audio & Web Audio API for studio AI voice)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // State persistence for active TTS message playback & loading
  const [loadingTtsMsgId, setLoadingTtsMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('avo_active_speaking_msg_id') || null;
    }
    return null;
  });

  // Stop all audio & speech synthesis playback
  const stopAllSpeech = useCallback(() => {
    if (activeBufferSourceRef.current) {
      try {
        activeBufferSourceRef.current.stop();
        activeBufferSourceRef.current.disconnect();
      } catch {}
      activeBufferSourceRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = '';
      } catch {}
      activeAudioRef.current = null;
    }
    if (activeAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(activeAudioUrlRef.current);
      } catch {}
      activeAudioUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      (window as any).__activeUtterance = null;
    }
    sessionStorage.removeItem('avo_active_speaking_msg_id');
    setSpeakingMsgId(null);
    setLoadingTtsMsgId(null);
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, [stopAllSpeech]);

  const updateSettingsAndApplyEffects = (newSettings: AppSettings) => {
    setSettings(newSettings);
    
    // Appearance / Theme effect
    const appearance = newSettings.appearance || newSettings.theme || 'system';
    if (appearance === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexus_theme', 'dark');
      if (!isDarkMode) onToggleTheme();
    } else if (appearance === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexus_theme', 'light');
      if (isDarkMode) onToggleTheme();
    } else if (appearance === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('nexus_theme', 'dark');
        if (!isDarkMode) onToggleTheme();
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexus_theme', 'light');
        if (isDarkMode) onToggleTheme();
      }
    }

    // Accent color effect
    if (newSettings.accentColor) {
      document.documentElement.setAttribute('data-accent', newSettings.accentColor);
    }

    // Contrast effect
    if (newSettings.contrast === 'high') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Keep settings theme in sync with global isDarkMode prop
  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme: isDarkMode ? 'dark' : 'light' }));
  }, [isDarkMode]);

  // Fetch parental control setting from server on mount
  useEffect(() => {
    const fetchParentalSettings = async () => {
      try {
        const email = userProfile?.email || user?.email || 'abhixin79@gmail.com';
        const res = await fetch('/api/settings/parental-controls', {
          headers: { 'x-user-email': email }
        });
        if (res.ok) {
          const data = await res.json();
          const enabled = data.ageRestrictedContentFilter ?? data.parentalFilter ?? false;
          setSettings((prev) => ({
            ...prev,
            parentalFilter: enabled,
            ageRestrictedContentFilter: enabled
          }));
        }
      } catch (err) {
        console.warn('[ChatApp] Failed to load parental settings:', err);
      }
    };
    fetchParentalSettings();
  }, [userProfile?.email, user?.email]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const baseSpeechInputRef = useRef<string>('');
  const isPushToTalkPressRef = useRef<boolean>(false);
  const pressStartTimeRef = useRef<number>(0);
  const isVoiceStartingRef = useRef<boolean>(false);
  const stopRequestedRef = useRef<boolean>(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel>(() => {
    try {
      const saved = localStorage.getItem('nexus_effort');
      if (saved === 'low' || saved === 'medium' || saved === 'high' || saved === 'ultra') return saved;
    } catch {}
    return 'medium';
  });
  const [selectedMode, setSelectedMode] = useState<OrchestrationMode>('medium');
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState<{
    id: string;
    label: string;
    prefix?: string;
    badgeBg?: string;
    badgeText?: string;
    badgeBorder?: string;
  } | null>(null);

  const NEAR_BOTTOM_THRESHOLD = 120;
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isNearBottomRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // References and state for chat input container resize observation
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  const prevInputHeightRef = useRef<number>(0);
  const [chatInputHeight, setChatInputHeight] = useState<number>(0);

  const scrollRafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!chatFeedRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Intelligently check if user is near the bottom
      const isNear = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      isNearBottomRef.current = isNear;

      // Show floating scroll to bottom button only when significantly scrolled away and content overflows
      const shouldShow = distanceFromBottom > NEAR_BOTTOM_THRESHOLD && scrollHeight > clientHeight + NEAR_BOTTOM_THRESHOLD;
      setShowScrollToBottom((prev) => (prev !== shouldShow ? shouldShow : prev));

      // Pop scrollbar thumb only on hover-capable pointer devices to prevent mobile DOM mutation churn
      if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
        chatFeedRef.current.classList.add('is-scrolling');
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          if (chatFeedRef.current) {
            chatFeedRef.current.classList.remove('is-scrolling');
          }
        }, 800);
      }
    });
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatFeedRef.current) {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
      return;
    }
    isProgrammaticScrollRef.current = true;
    chatFeedRef.current.scrollTo({
      top: chatFeedRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      if (chatFeedRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD) {
          isNearBottomRef.current = true;
          setShowScrollToBottom(false);
        }
      }
    }, smooth ? 250 : 50);
  }, []);

  const fallbackConv = React.useMemo<Conversation>(() => ({
    id: activeConvId || `conv-${Date.now()}`,
    title: 'New Chat',
    updatedAt: 'Just now',
    category: 'today',
    folderId: null,
    messages: []
  }), [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || fallbackConv;

  // Keep overrideInput synchronized with active conversation's system override
  useEffect(() => {
    setOverrideInput(activeConv?.systemOverride || '');
  }, [activeConvId, activeConv?.systemOverride]);

  // ResizeObserver on the chat input container to dynamically adjust chat feed height without layout shift or content clipping
  useEffect(() => {
    const inputContainer = chatInputContainerRef.current;
    if (!inputContainer) return;

    let rafId: number | null = null;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Measure exact border-box height of the input container
        const newHeight = Math.round(
          entry.borderBoxSize?.[0]?.blockSize ?? 
          (entry.target as HTMLElement).offsetHeight ?? 
          entry.contentRect.height
        );
        if (newHeight <= 0) continue;

        const prevHeight = prevInputHeightRef.current;
        if (Math.abs(newHeight - prevHeight) < 2) continue; // Ignore sub-pixel micro-jitter
        prevInputHeightRef.current = newHeight;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // Directly set styles on the scroll container to avoid unnecessary React re-renders
          if (chatFeedRef.current) {
            const feed = chatFeedRef.current;
            feed.style.scrollPaddingBottom = `${newHeight + 12}px`;
            feed.style.setProperty('--chat-input-height', `${newHeight}px`);

            // If the user was at or near the bottom, maintain bottom scroll position
            if (isNearBottomRef.current) {
              feed.scrollTop = feed.scrollHeight;
            } else if (prevHeight > 0 && newHeight !== prevHeight) {
              const delta = newHeight - prevHeight;
              feed.scrollTop += delta;
            }
          }

          // Update React state only when delta is significant (> 8px) to keep state in sync without re-render spam
          setChatInputHeight((prev) => (Math.abs(newHeight - prev) > 8 ? newHeight : prev));
        });
      }
    });

    observer.observe(inputContainer);

    // Initial measurement
    const initialHeight = inputContainer.offsetHeight;
    if (initialHeight > 0 && initialHeight !== prevInputHeightRef.current) {
      prevInputHeightRef.current = initialHeight;
      setChatInputHeight(initialHeight);
      if (chatFeedRef.current) {
        chatFeedRef.current.style.scrollPaddingBottom = `${initialHeight + 12}px`;
      }
    }

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeConvId]);

  // Mobile virtual keyboard viewport resize listener (debounced, never on scroll)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    let resizeTimer: any = null;

    const handleVisualViewportResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!chatFeedRef.current) return;
        if (isNearBottomRef.current) {
          requestAnimationFrame(() => {
            if (chatFeedRef.current) {
              chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
            }
          });
        }
      }, 100);
    };

    vv.addEventListener('resize', handleVisualViewportResize);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      vv.removeEventListener('resize', handleVisualViewportResize);
    };
  }, []);

  // Smooth, non-blocking auto-resize chat input textarea without layout thrashing
  const prevInputLengthRef = useRef<number>(0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (!input || !input.trim()) {
      if (el.style.height !== '48px') {
        el.style.height = '48px';
      }
      el.style.overflowY = 'hidden';
      prevInputLengthRef.current = 0;
      return;
    }

    const isShrinking = input.length < prevInputLengthRef.current;
    prevInputLengthRef.current = input.length;

    // Reset height to 'auto' only when user deletes text to measure smaller scrollHeight
    if (isShrinking) {
      el.style.height = 'auto';
    }

    const minH = 48;
    const maxH = 240;
    const scrollH = el.scrollHeight;
    const targetH = Math.min(Math.max(scrollH, minH), maxH);
    const targetHStr = `${targetH}px`;

    if (el.style.height !== targetHStr) {
      el.style.height = targetHStr;
    }
    const shouldScroll = scrollH > maxH;
    if (el.style.overflowY !== (shouldScroll ? 'auto' : 'hidden')) {
      el.style.overflowY = shouldScroll ? 'auto' : 'hidden';
    }
  }, [input]);

  // Auto-generate follow-up suggestions for the latest completed assistant message if needed
  useEffect(() => {
    if (!activeConv || isGenerating) return;
    const assistantMsgs = activeConv.messages.filter((m) => m.role === 'assistant' && m.content && m.status !== 'streaming');
    if (assistantMsgs.length === 0) return;
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastIndex = activeConv.messages.findIndex((m) => m.id === lastAssistant.id);
    const precedingUser = lastIndex > 0 ? activeConv.messages[lastIndex - 1] : undefined;

    if (lastAssistant.content && (!suggestionsMap[lastAssistant.id] || suggestionsMap[lastAssistant.id].length === 0)) {
      generateSuggestions(lastAssistant.id, lastAssistant.content, precedingUser?.content);
    }
  }, [activeConvId, activeConv?.messages.length, isGenerating, generateSuggestions, suggestionsMap]);

  // Filter matching messages for active conversation
  const matchingMessages = React.useMemo(() => {
    if (!chatSearchQuery.trim() || !activeConv || !activeConv.messages) return [];
    const q = chatSearchQuery.trim().toLowerCase();
    return activeConv.messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [activeConv, chatSearchQuery]);

  // Scroll to first match when search query changes
  useEffect(() => {
    setCurrentSearchMatchIndex(0);
    if (chatSearchQuery.trim() && matchingMessages.length > 0) {
      const firstMatch = matchingMessages[0];
      const el = document.getElementById(`msg-${firstMatch.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [chatSearchQuery]);

  const handleNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const nextIdx = (currentSearchMatchIndex + 1) % matchingMessages.length;
    setCurrentSearchMatchIndex(nextIdx);
    const targetMsg = matchingMessages[nextIdx];
    if (targetMsg) {
      const el = document.getElementById(`msg-${targetMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length === 0) return;
    const prevIdx = (currentSearchMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
    setCurrentSearchMatchIndex(prevIdx);
    const targetMsg = matchingMessages[prevIdx];
    if (targetMsg) {
      const el = document.getElementById(`msg-${targetMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Conversation Metrics Computation for Stats Card
  const conversationStats = React.useMemo(() => {
    if (!activeConv || !activeConv.messages || activeConv.messages.length === 0) return null;

    const msgs = activeConv.messages;
    const totalMessages = msgs.length;
    const userCount = msgs.filter((m) => m.role === 'user').length;
    const assistantCount = msgs.filter((m) => m.role === 'assistant').length;

    const totalChars = msgs.reduce((acc, m) => acc + (m.content ? m.content.length : 0), 0);
    const estimatedTokens = Math.round(totalChars / 4);

    const totalAttachments = msgs.reduce((acc, m) => acc + (m.attachments ? m.attachments.length : 0), 0);

    const totalCodeBlocks = msgs.reduce((acc, m) => {
      const matches = m.content ? m.content.match(/```/g) : null;
      return acc + (matches ? Math.floor(matches.length / 2) : 0);
    }, 0);

    const firstMsg = msgs[0];
    const lastMsg = msgs[msgs.length - 1];
    let interactionDuration = `${totalMessages} messages (${userCount} turns)`;
    if (firstMsg?.timestamp && lastMsg?.timestamp) {
      interactionDuration = `${firstMsg.timestamp} – ${lastMsg.timestamp}`;
    }

    return {
      totalMessages,
      userCount,
      assistantCount,
      estimatedTokens,
      totalAttachments,
      totalCodeBlocks,
      interactionDuration
    };
  }, [activeConv]);

  // Immediately detect manual user scrolling gestures (wheel, touch) to avoid snapping when user scrolls up
  useEffect(() => {
    const feed = chatFeedRef.current;
    if (!feed) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;

      if (deltaY > 8) {
        // Dragging finger downward => scrolling UP into chat history
        isNearBottomRef.current = false;
        setShowScrollToBottom(true);
      } else if (deltaY < -8) {
        // Dragging finger upward => scrolling DOWN towards latest messages
        const { scrollTop, scrollHeight, clientHeight } = feed;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD) {
          isNearBottomRef.current = true;
          setShowScrollToBottom(false);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // User manually scrolled UP
        const { scrollTop, scrollHeight, clientHeight } = feed;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        if (distanceFromBottom > 30) {
          isNearBottomRef.current = false;
          setShowScrollToBottom(true);
        }
      } else if (e.deltaY > 0) {
        // User manually scrolled DOWN
        const { scrollTop, scrollHeight, clientHeight } = feed;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD) {
          isNearBottomRef.current = true;
          setShowScrollToBottom(false);
        }
      }
    };

    feed.addEventListener('touchstart', handleTouchStart, { passive: true });
    feed.addEventListener('touchmove', handleTouchMove, { passive: true });
    feed.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      feed.removeEventListener('touchstart', handleTouchStart);
      feed.removeEventListener('touchmove', handleTouchMove);
      feed.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Intelligently auto-scroll only if user is already near the bottom of the feed
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(isGenerating ? false : true);
    }
  }, [activeConv?.messages, isGenerating, scrollToBottom]);

  useEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    scrollToBottom(false);
  }, [activeConvId, scrollToBottom]);

  // Handle Toast Notifications
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const allGalleryImages = useMemo<GalleryImage[]>(() => {
    if (!activeConv?.messages) return [];
    const list: GalleryImage[] = [];
    activeConv.messages.forEach(m => {
      const extracted = extractImagesFromMessage(m);
      list.push(...extracted);
    });
    return list;
  }, [activeConv?.messages]);

  const handlePreviewImage = useCallback((url: string, prompt: string) => {
    const foundIdx = allGalleryImages.findIndex(img => img.url === url);
    if (foundIdx >= 0) {
      setGalleryState({
        isOpen: true,
        images: allGalleryImages,
        initialIndex: foundIdx
      });
    } else {
      setGalleryState({
        isOpen: true,
        images: [{ id: `img-${Date.now()}`, url, prompt, alt: prompt }],
        initialIndex: 0
      });
    }
  }, [allGalleryImages]);

  const handleOpenGalleryWithList = useCallback((list: GalleryImage[], index: number) => {
    setGalleryState({
      isOpen: true,
      images: list,
      initialIndex: index
    });
  }, []);

  const markdownComponents = useMemo(() => ({
    text: ({ children }: any) => {
      if (typeof children === 'string' && chatSearchQuery.trim()) {
        return <>{renderHighlightedText(children, chatSearchQuery)}</>;
      }
      return <>{children}</>;
    },
    h1: ({ children }: any) => <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white mt-6 mb-3 tracking-tight">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white mt-5 mb-2.5 tracking-tight">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white mt-4 mb-2 tracking-tight">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-zinc-800 dark:text-zinc-200">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-zinc-800 dark:text-zinc-200">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed my-0.5">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-zinc-950 dark:text-white">{children}</strong>,
    p: ({ children }: any) => <div className="leading-relaxed my-3.5 text-zinc-800 dark:text-zinc-200">{children}</div>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-3 border-zinc-400 dark:border-zinc-600 pl-4 py-2 my-4 italic text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 rounded-r-xl">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
    img: ({ src, alt, node, ...props }: any) => {
      let cleanSrc = typeof src === 'string' ? src.trim() : '';
      if (cleanSrc.startsWith('data:image/')) {
        cleanSrc = cleanSrc.replace(/\s+/g, '');
      } else if (cleanSrc.startsWith('/api/image-proxy') || cleanSrc.startsWith('http')) {
        cleanSrc = cleanSrc.replace(/ /g, '%20');
      }
      const originalPrompt = (alt || (props as any)?.['data-prompt'] || 'artwork').trim();
      // Guard checking for !cleanSrc or malformed URLs containing 'undefined' or 'null'
      const isMalformedOrEmpty = !cleanSrc || cleanSrc.includes('undefined') || cleanSrc.includes('null') || cleanSrc === '/null' || cleanSrc === '/undefined';

      console.log('[markdownComponents.img] ReactMarkdown parsed <img> AST element:', {
        src: cleanSrc ? (cleanSrc.startsWith('data:') ? `data:image... (${cleanSrc.length} chars)` : cleanSrc) : '<empty/undefined>',
        srcType: typeof cleanSrc,
        srcLength: cleanSrc ? cleanSrc.length : 0,
        isMalformedOrEmpty,
        alt,
        originalPrompt,
        nodeProperties: node?.properties,
        timestamp: new Date().toISOString()
      });

      if (isMalformedOrEmpty) {
        console.warn('[markdownComponents.img Guard] Skipped rendering image with empty or invalid/undefined src:', {
          src: cleanSrc,
          alt,
          originalPrompt,
          nodeProperties: node?.properties,
          timestamp: new Date().toISOString()
        });
        return null;
      }
      return (
        <ImageErrorBoundary
          originalPrompt={originalPrompt}
          fallbackSubject={originalPrompt}
          alt={alt || originalPrompt}
          onPreview={handlePreviewImage}
        >
          <ProseChatImage
            src={cleanSrc}
            alt={alt || originalPrompt}
            onPreview={handlePreviewImage}
            node={node}
            {...props}
          />
        </ImageErrorBoundary>
      );
    },
    table: ({ children }: any) => (
      <div className="relative my-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900/90 group/table">
        <div className="overflow-x-auto touch-pan-x scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 max-w-full">
          <table className="min-w-[540px] sm:min-w-full w-full text-left border-collapse text-xs sm:text-sm divide-y divide-zinc-200 dark:divide-zinc-800">
            {children}
          </table>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent sm:hidden opacity-80" />
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 font-bold border-b border-zinc-200 dark:border-zinc-700 uppercase text-[11px] tracking-wider sticky top-0 backdrop-blur-xs">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900/40">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors odd:bg-transparent even:bg-zinc-50/30 dark:even:bg-zinc-900/20">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap border-r last:border-r-0 border-zinc-200/60 dark:border-zinc-700/60">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 border-r last:border-r-0 border-zinc-200/40 dark:border-zinc-800/40 leading-relaxed min-w-[120px]">{children}</td>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      const codeText = String(children).replace(/\n$/, '');
      if (!inline && isGenuineCode(codeText, lang)) {
        return (
          <CodeBlock
            codeString={codeText}
            language={lang}
            codeTheme={settings.codeTheme}
            onSelectCodeTheme={(themeId) => setSettings((prev) => ({ ...prev, codeTheme: themeId }))}
            onCopyBlock={handleCopyCodeBlock}
            onShowToast={showToast}
          />
        );
      }
      if (!inline) {
        return (
          <pre className="my-2 p-2.5 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/80 text-xs sm:text-sm font-sans leading-relaxed text-zinc-900 dark:text-zinc-100 overflow-x-auto whitespace-pre-wrap border border-zinc-300 dark:border-zinc-700/60">
            {codeText}
          </pre>
        );
      }
      return (
        <code className={`${className || ''} bg-black/10 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-900 dark:text-zinc-200`} {...props}>
          {children}
        </code>
      );
    }
  }), [chatSearchQuery, settings.codeTheme, handlePreviewImage, handleCopyCodeBlock, showToast]);

  // Create New Chat
  const handleNewChat = (folderId?: string | null) => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      updatedAt: 'Just now',
      category: 'today',
      folderId: folderId || null,
      messages: []
    };
    setConversations((prev) => [newConv, ...prev.filter((c) => c.messages.length > 0)]);
    setActiveConvId(newId);
    setInput('');
    setAttachments([]);
    setActiveInputMode(null);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Select Conversation with responsive sidebar auto-closing
  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Listen to ?new search param from landing page or direct links to start fresh chat
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam && newParam !== lastHandledNewRef.current) {
      lastHandledNewRef.current = newParam;
      handleNewChat();
    }
  }, [searchParams]);

  // Create New Folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folderColor = selectedFolderColor || 'bg-zinc-500';
    const newF: FolderType = {
      id: `f-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColor,
      isCollapsed: false
    };
    setFolders([...folders, newF]);
    setNewFolderName('');
    setSelectedFolderColor('bg-zinc-500');
    setIsCreatingFolder(false);
    showToast(`Folder "${newF.name}" created`);
  };

  // Toggle Folder Collapse
  const toggleFolderCollapse = (fId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === fId ? { ...f, isCollapsed: !f.isCollapsed } : f))
    );
  };

  // Delete Folder
  const handleDeleteFolder = (fId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolders((prev) => prev.filter((f) => f.id !== fId));
    // Move chats out of folder to uncategorized
    setConversations((prev) =>
      prev.map((c) => (c.folderId === fId ? { ...c, folderId: null } : c))
    );
    showToast('Folder deleted');
  };

  // Drag & Drop Handlers for Folders and Tags
  const handleDragStart = (e: React.DragEvent, convId: string) => {
    setDraggedConvId(convId);
    e.dataTransfer.setData('text/plain', convId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const folderKey = targetFolderId === null ? 'uncategorized' : targetFolderId;
    if (dragOverFolderId !== folderKey) {
      setDragOverFolderId(folderKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const convId = e.dataTransfer.getData('text/plain') || draggedConvId;
    if (convId) {
      const targetConv = conversations.find((c) => c.id === convId);
      const targetFolder = folders.find((f) => f.id === targetFolderId);
      const now = new Date().toISOString();

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, folderId: targetFolderId, updatedAt: 'Just now' } : c))
      );

      if (targetFolderId) {
        setFolders((prev) =>
          prev.map((f) => (f.id === targetFolderId ? { ...f, isCollapsed: false, updatedAt: now } : f))
        );
        if (targetConv && targetFolder) {
          showToast(`Moved "${targetConv.title}" to "${targetFolder.name}"`);
        } else {
          showToast('Moved conversation to folder');
        }
      } else {
        if (targetConv) {
          showToast(`Removed "${targetConv.title}" from folder`);
        } else {
          showToast('Conversation moved to uncategorized');
        }
      }
    }
    setDraggedConvId(null);
    setDragOverFolderId(null);
  };

  // Directly apply tag to a conversation when dropped onto a tag chip in sidebar
  const handleApplyTagToChat = (convId: string, tagId: string) => {
    const targetTag = DEFAULT_TAGS.find((t) => t.id === tagId);
    const targetConv = conversations.find((c) => c.id === convId);
    if (!targetConv || !targetTag) return;

    const currentTags = targetConv.tags || [];
    const now = new Date().toISOString();
    if (!currentTags.includes(tagId)) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, tags: [...currentTags, tagId], updatedAt: now }
            : c
        )
      );
      showToast(`🏷️ Applied "${targetTag.name}" tag to "${targetConv.title}"`);
    } else {
      showToast(`Chat already tagged with "${targetTag.name}"`);
    }
  };

  // Drag-and-drop merging of conversations
  const handleDropOnConv = (e: React.DragEvent, targetConvId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceConvId = e.dataTransfer.getData('text/plain') || draggedConvId;

    if (sourceConvId && sourceConvId !== targetConvId) {
      const sourceConv = conversations.find((c) => c.id === sourceConvId);
      const targetConv = conversations.find((c) => c.id === targetConvId);

      if (sourceConv && targetConv) {
        const mergedMessages = [...targetConv.messages, ...sourceConv.messages];

        setConversations((prev) =>
          prev
            .filter((c) => c.id !== sourceConvId)
            .map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: mergedMessages,
                    updatedAt: 'Just now'
                  }
                : c
            )
        );

        if (activeConvId === sourceConvId) {
          setActiveConvId(targetConvId);
        }

        showToast(`Merged "${sourceConv.title}" into "${targetConv.title}"`);
      }
    }

    setDraggedConvId(null);
    setDragOverTargetConvId(null);
  };

  // Duplicate Conversation
  const handleDuplicateChat = (convId: string) => {
    const target = conversations.find((c) => c.id === convId);
    if (!target) return;

    const duplicated: Conversation = {
      ...target,
      id: `conv-${Date.now()}`,
      title: `${target.title} (Copy)`,
      updatedAt: 'Just now',
      messages: target.messages.map((m, idx) => ({ ...m, id: `m-${Date.now()}-${idx}` }))
    };

    setConversations((prev) => [duplicated, ...prev]);
    setActiveConvId(duplicated.id);
    showToast('Conversation duplicated');
  };

  // Archive / Unarchive Conversation
  const handleArchiveChat = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, isArchived: !c.isArchived } : c
      )
    );
    const conv = conversations.find((c) => c.id === convId);
    showToast(conv?.isArchived ? 'Conversation restored' : 'Conversation archived');
  };

  // Rename Conversation
  const handleRenameChat = (convId: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
    );
    showToast('Title updated');
  };

  // Toggle Tag on Conversation
  const handleToggleTag = (convId: string, tagId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const currentTags = c.tags || [];
        const hasTag = currentTags.includes(tagId);
        const updatedTags = hasTag
          ? currentTags.filter((t) => t !== tagId)
          : [...currentTags, tagId];
        return { ...c, tags: updatedTags };
      })
    );
  };

  // Toggle Single Conversation Selection for Bulk Action
  const toggleBulkSelectConv = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  // Select All or Deselect All Conversations in Sidebar Bulk Mode
  const handleSelectAllConvs = () => {
    if (selectedConvIds.length === filteredConvs.length) {
      setSelectedConvIds([]);
    } else {
      setSelectedConvIds(filteredConvs.map((c) => c.id));
    }
  };

  // Execute Bulk Delete Conversations Action
  const handleExecuteBulkDeleteConvs = () => {
    if (selectedConvIds.length === 0) return;
    const count = selectedConvIds.length;
    const remaining = conversations.filter((c) => !selectedConvIds.includes(c.id));
    setConversations(remaining);

    if (selectedConvIds.includes(activeConvId || '')) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        const newId = `conv-${Date.now()}`;
        const newConv: Conversation = {
          id: newId,
          title: 'New Conversation',
          updatedAt: 'Just now',
          category: 'today',
          messages: []
        };
        setConversations([newConv]);
        setActiveConvId(newId);
      }
    }

    setSelectedConvIds([]);
    setIsBulkDeleteMode(false);
    showToast(`Deleted ${count} selected conversation(s)`);
  };

  // Delete Chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id && filtered.length > 0) {
      setActiveConvId(filtered[0].id);
    }
  };

  // Move chat to folder manually
  const handleMoveChatToFolder = (convId: string, targetFolderId: string | null) => {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, folderId: targetFolderId, updatedAt: now } : c))
    );
    if (targetFolderId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === targetFolderId ? { ...f, updatedAt: now } : f))
      );
    }
    setOpenMoveMenuId(null);
    showToast(targetFolderId ? 'Moved to folder (auto-sorted by active)' : 'Removed from folder');
  };

  // Formatting Toolbar Helper
  const handleFormatInput = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const selectedText = input.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}text${suffix}`;
    const newInput = input.substring(0, start) + replacement + input.substring(end);
    setInput(newInput);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + prefix.length,
          start + prefix.length + (selectedText.length || 4)
        );
      }
    }, 50);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processUploadedFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Send Side-Thread Message Logic
  const handleSendThreadMessage = async () => {
    if (!threadInput.trim() || !openThreadMsgId || !activeConv || isSendingThread) return;

    const userContent = threadInput.trim();
    setThreadInput('');
    setIsSendingThread(true);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userThreadMsg: ChatMessage = {
      id: `thread-user-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp
    };

    const aiThreadMsgId = `thread-ai-${Date.now()}`;
    const placeholderAiThreadMsg: ChatMessage = {
      id: aiThreadMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming'
    };

    const parentMsg = activeConv.messages.find((m) => m.id === openThreadMsgId);
    const existingThreadMsgs = activeConv.threads?.[openThreadMsgId] || [];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        const threads = c.threads || {};
        return {
          ...c,
          threads: {
            ...threads,
            [openThreadMsgId]: [...existingThreadMsgs, userThreadMsg, placeholderAiThreadMsg]
          }
        };
      })
    );

    try {
      const threadHistory = [...existingThreadMsgs, userThreadMsg];
      const parentContent = parentMsg?.content || '';
      let accumulatedText = '';

      await streamChatResponse({
        messages: [
          { role: 'assistant', content: `[PARENT RESPONSE CONTEXT]:\n${parentContent}` },
          ...threadHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ],
        systemInstruction: `${settings.systemPrompt}\n\nNote: You are responding inside a focused side-thread. Provide concise, helpful follow-up details.`,
        model: settings.model,
        onChunk: (chunkText) => {
          accumulatedText += chunkText;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConvId) return c;
              const threads = c.threads || {};
              const msgs = threads[openThreadMsgId] || [];
              return {
                ...c,
                threads: {
                  ...threads,
                  [openThreadMsgId]: msgs.map((m) =>
                    m.id === aiThreadMsgId ? { ...m, content: accumulatedText } : m
                  )
                }
              };
            })
          );
        }
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConvId) return c;
          const threads = c.threads || {};
          const msgs = threads[openThreadMsgId] || [];
          return {
            ...c,
            threads: {
              ...threads,
              [openThreadMsgId]: msgs.map((m) =>
                m.id === aiThreadMsgId ? { ...m, status: 'complete' } : m
              )
            }
          };
        })
      );
    } catch (err) {
      console.error('Failed thread stream', err);
    } finally {
      setIsSendingThread(false);
    }
  };

  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  const filterSpeechNoise = (text: string): string => {
    if (!text) return '';
    let cleaned = text.trim();

    // 1. Meta / hallucinated caption patterns
    const noisePatterns = [
      /^(thank you for watching|subtitles by|amara\.org|subtitles|captioned by|audio recorded|transcript|translated by|like and subscribe)$/i,
      /^[.,\/?!;:—\-\s]+$/, // Punctuation/symbols only
      /^(u+h+|u+m+|m+m+|a+h+|e+r+|h+m+|l+i+k+e+|y+e+a+h+)+$/i, // Pure filler noise sounds
    ];

    for (const pattern of noisePatterns) {
      if (pattern.test(cleaned)) {
        return '';
      }
    }

    // 2. Discard single-character isolated hallucinations (e.g., "a", "b", "x")
    if (/^([a-zA-Z]\s*)+$/.test(cleaned) && cleaned.replace(/\s+/g, '').length < 3) {
      return '';
    }

    // 3. Remove repeated filler words / stuttering
    cleaned = cleaned
      .replace(/\b(uh|um|er|ah|like|you know|yeah)\b(\s+\b\1\b)+/gi, '$1')
      .replace(/\b(\w+)\s+\1\b/gi, '$1')
      .trim();

    // 4. Remove isolated single-character noise inside longer sentences
    cleaned = cleaned.replace(/(^|\s)[b-zB-Z](\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

    return cleaned;
  };

  const processAndTranscribeAudio = async (blob: Blob) => {
    if (!blob || blob.size < 100) {
      showToast('🎤 Audio was too short. Please speak into microphone.');
      return;
    }

    setIsTranscribingAudio(true);
    showToast('🎙️ Converting your speech to text with AVO AI...');
    try {
      const text = await transcribeAudioWithGemini(blob);
      if (text) {
        const base = baseSpeechInputRef.current ? baseSpeechInputRef.current.trim() : '';
        const finalInput = base ? `${base} ${text}` : text;
        setInput(finalInput);
        showToast(`✨ Transcribed: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } else {
        showToast('🎤 Could not detect spoken words. Please speak clearly.');
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      showToast(`Transcription error: ${err?.message || 'Could not process audio'}`);
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  // Stop active recording (Web Speech API and MediaRecorder)
  const stopVoiceInput = () => {
    stopRequestedRef.current = true;
    clearSpeechTimeout();
    setIsAudioActive(false);

    // 1. Stop Web Speech API if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecognitionRef.current = null;
    }

    setIsVoiceRecording(false);

    // 2. Stop MediaRecorder if actively recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    } else if (!isVoiceStartingRef.current) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  // Start Voice Recording with Web Speech API and MediaRecorder
  const startVoiceInput = async () => {
    if (typeof window === 'undefined') return;

    if (isVoiceRecording || isTranscribingAudio) {
      stopVoiceInput();
      return;
    }

    baseSpeechInputRef.current = input;
    stopRequestedRef.current = false;
    isVoiceStartingRef.current = true;
    setIsVoiceRecording(true);
    showToast('🎤 Voice Recording Active: Speak now! Click Stop when finished.');

    // A. Start MediaRecorder (Works in Brave, Chrome, Safari, Firefox & sandboxed iframes)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];

        // If user cancelled or released button while waiting for microphone permission
        if (stopRequestedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          isVoiceStartingRef.current = false;
          setIsVoiceRecording(false);
          return;
        }

        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';

          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }

            const recordedBlob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || mimeType,
            });
            audioChunksRef.current = [];
            processAndTranscribeAudio(recordedBlob);
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;

          if (stopRequestedRef.current) {
            recorder.stop();
          }
        }
      }
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      showToast('Microphone access denied or unavailable.');
      setIsVoiceRecording(false);
    } finally {
      isVoiceStartingRef.current = false;
    }

    // B. Start Web Speech API for live instant streaming text (if enabled by browser)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

        const resetSpeechTimeout = () => {
          clearSpeechTimeout();
          speechTimeoutRef.current = setTimeout(() => {
            if (speechRecognitionRef.current || isVoiceRecording) {
              console.warn('Web Speech API 10s watchdog timeout: non-responsive speech recognition.');
              setIsAudioActive(false);
              showToast('🎤 Voice input timed out due to inactivity.');
              stopVoiceInput();
            }
          }, 10000);
        };

        resetSpeechTimeout();

        recognition.onspeechstart = () => {
          setIsAudioActive(true);
          resetSpeechTimeout();
        };

        recognition.onspeechend = () => {
          setIsAudioActive(false);
          resetSpeechTimeout();
        };

        recognition.onsoundstart = () => {
          setIsAudioActive(true);
          resetSpeechTimeout();
        };

        recognition.onsoundend = () => {
          setIsAudioActive(false);
          resetSpeechTimeout();
        };

        recognition.onresult = (event: any) => {
          resetSpeechTimeout();

          let newlyFinalizedSpeech = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];

            // EXPLICIT CHECK: Only process results where isFinal is true!
            // Ignore intermediate interim-result jitters.
            if (!result || !result.isFinal) {
              continue;
            }

            const alternative = result[0];
            if (!alternative) continue;

            // Filter out low confidence speech noise artifacts
            if (typeof alternative.confidence === 'number' && alternative.confidence > 0 && alternative.confidence < 0.25) {
              continue;
            }

            const transcript = alternative.transcript;
            if (transcript) {
              newlyFinalizedSpeech += ' ' + transcript;
            }
          }

          const filteredSpeech = filterSpeechNoise(newlyFinalizedSpeech);

          if (filteredSpeech) {
            setIsAudioActive(true);
            const lower = filteredSpeech.toLowerCase();

            if (/\b(start new chat|create new chat|open new chat)\b/i.test(lower)) {
              handleNewChat();
              showToast('🎤 Voice action: Started new chat');
              stopVoiceInput();
              return;
            }
            if (/\b(clear screen|clear chat|reset chat)\b/i.test(lower)) {
              handleClearCurrentChat();
              showToast('🎤 Voice action: Cleared screen');
              stopVoiceInput();
              return;
            }
            if (/\b(toggle dark mode|toggle theme)\b/i.test(lower)) {
              onToggleTheme();
              showToast('🎤 Voice action: Toggled theme');
              stopVoiceInput();
              return;
            }

            const base = baseSpeechInputRef.current ? baseSpeechInputRef.current.trim() : '';
            const newInputValue = base ? `${base} ${filteredSpeech}` : filteredSpeech;
            baseSpeechInputRef.current = newInputValue;
            setInput(newInputValue);

            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Web Speech API error:', event.error);
          clearSpeechTimeout();
        };

        recognition.onend = () => {
          clearSpeechTimeout();
          speechRecognitionRef.current = null;
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Web Speech API init note:', err);
        clearSpeechTimeout();
      }
    }
  };

  const toggleVoiceInput = () => {
    if (isVoiceRecording) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const handlePushToTalkStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isVoiceRecording) {
      stopVoiceInput();
      return;
    }
    isPushToTalkPressRef.current = true;
    pressStartTimeRef.current = Date.now();
    startVoiceInput();
  };

  const handlePushToTalkEnd = () => {
    if (!isPushToTalkPressRef.current) return;
    isPushToTalkPressRef.current = false;
    const holdDuration = Date.now() - pressStartTimeRef.current;

    // If held longer than 300ms, release to stop recording (Push-to-Talk)
    if (holdDuration > 300) {
      setTimeout(() => {
        stopVoiceInput();
        showToast('🎤 Push-to-Talk released');
      }, 150);
    }
    // If tapped (<300ms), stay active in continuous mode until clicked again!
  };

  // Multi-Message Selection Handlers
  const toggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleCopySelectedMessages = () => {
    if (selectedMsgIds.length === 0) return;
    const selectedMsgs = (activeConv?.messages || []).filter((m) => selectedMsgIds.includes(m.id));
    const formattedText = selectedMsgs
      .map((m) => `[${m.role === 'user' ? 'User' : 'AVO AI'}] (${m.timestamp}):\n${m.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(formattedText);
    showToast(`Copied ${selectedMsgs.length} selected message(s)`);
  };

  const handleDeleteSelectedMessages = () => {
    if (selectedMsgIds.length === 0) return;
    const count = selectedMsgIds.length;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        return {
          ...c,
          messages: c.messages.filter((m) => !selectedMsgIds.includes(m.id))
        };
      })
    );
    setSelectedMsgIds([]);
    showToast(`Deleted ${count} selected message(s)`);
  };

  // Speak message with Gemini studio voice & resilient browser synthesis fallback
  const handleSpeakText = async (text: string, msgId?: string) => {
    if (!text || !text.trim()) {
      showToast('No readable text to speak');
      return;
    }

    const targetId = msgId || 'unknown';

    // If already playing or loading this message, clicking acts as Stop
    if (speakingMsgId === targetId || loadingTtsMsgId === targetId) {
      stopAllSpeech();
      showToast('Stopped reading message');
      return;
    }

    // 1. Immediately unlock / resume AudioContext on synchronous user interaction
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }
    } catch (e) {
      console.warn('[AudioContext unlock note]:', e);
    }

    // Stop any previous speech/audio before starting a new one
    stopAllSpeech();
    setLoadingTtsMsgId(targetId);

    // Clean text: strip markdown code blocks, URLs, headers, emojis, and formatting symbols
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [code omitted] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[*_~#>[\]|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      setLoadingTtsMsgId(null);
      showToast('No readable text to speak');
      return;
    }

    // Client-side Web Speech fallback with Chromium/Brave patches
    const speakWithBrowserSynthesis = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setLoadingTtsMsgId(null);
        setSpeakingMsgId(null);
        showToast('Audio playback not supported in this browser window.');
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const pitchValue = settings.voicePitch === 'low' ? 0.8 : settings.voicePitch === 'high' ? 1.2 : 1.0;
        utterance.pitch = pitchValue;
        utterance.rate = settings.voiceSpeed || 1.0;
        utterance.volume = settings.voiceVolume ?? 0.85;

        // Pick available natural English voice
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const naturalVoice = voices.find(v =>
            v.lang.startsWith('en') && (
              v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex')
            )
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          if (naturalVoice) {
            utterance.voice = naturalVoice;
          }
        }

        // Prevent V8 garbage collection bug
        (window as any).__activeUtterance = utterance;

        let hasStarted = false;
        utterance.onstart = () => {
          hasStarted = true;
          setLoadingTtsMsgId(null);
          setSpeakingMsgId(targetId);
          sessionStorage.setItem('avo_active_speaking_msg_id', targetId);
        };

        utterance.onend = () => {
          (window as any).__activeUtterance = null;
          sessionStorage.removeItem('avo_active_speaking_msg_id');
          setSpeakingMsgId((prev) => (prev === targetId ? null : prev));
        };

        utterance.onerror = (e) => {
          console.warn('[SpeechSynthesis Error]:', e);
          (window as any).__activeUtterance = null;
          sessionStorage.removeItem('avo_active_speaking_msg_id');
          setSpeakingMsgId((prev) => (prev === targetId ? null : prev));
          setLoadingTtsMsgId(null);
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            showToast('Unable to read message aloud. Check audio permissions.');
          }
        };

        setTimeout(() => {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.error('[SpeechSynthesis Speak Failed]:', e);
            setLoadingTtsMsgId(null);
            setSpeakingMsgId(null);
            showToast('Unable to play speech synthesis.');
          }
        }, 50);

        // Safety fallback check if browser blocks audio
        setTimeout(() => {
          if (!hasStarted && loadingTtsMsgId === targetId) {
            try {
              window.speechSynthesis.resume();
            } catch {}
          }
        }, 1200);
      } catch (err) {
        console.error('[SpeechSynthesis Init Error]:', err);
        setLoadingTtsMsgId(null);
        setSpeakingMsgId(null);
        showToast('Text-to-speech could not be initialized.');
      }
    };

    // 1. Primary: High-fidelity AI Voice via server /api/tts
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText.length > 2000 ? cleanText.substring(0, 2000) + '...' : cleanText,
          voice: settings.voiceName || 'Puck',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        
        // Priority A: Web Audio API (instant, resilient to browser frame autoplay blocks)
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state !== 'closed' && arrayBuffer && arrayBuffer.byteLength > 44) {
          try {
            if (ctx.state === 'suspended') {
              await ctx.resume();
            }
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;
            source.playbackRate.value = settings.voiceSpeed || 1.0;

            const gainNode = ctx.createGain();
            gainNode.gain.value = settings.voiceVolume ?? 0.85;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            activeBufferSourceRef.current = source;

            source.onended = () => {
              activeBufferSourceRef.current = null;
              setSpeakingMsgId((prev) => (prev === targetId ? null : prev));
              sessionStorage.removeItem('avo_active_speaking_msg_id');
            };

            source.start(0);
            setLoadingTtsMsgId(null);
            setSpeakingMsgId(targetId);
            sessionStorage.setItem('avo_active_speaking_msg_id', targetId);
            return;
          } catch (decodeErr) {
            console.warn('[Web Audio Decode Error, attempting HTMLAudio fallback]:', decodeErr);
          }
        }

        // Priority B: HTML5 Audio with Blob URL
        try {
          const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(blob);
          activeAudioUrlRef.current = audioUrl;

          const audio = new Audio(audioUrl);
          audio.playbackRate = settings.voiceSpeed || 1.0;
          audio.volume = settings.voiceVolume ?? 0.85;
          activeAudioRef.current = audio;

          audio.onplay = () => {
            setLoadingTtsMsgId(null);
            setSpeakingMsgId(targetId);
            sessionStorage.setItem('avo_active_speaking_msg_id', targetId);
          };

          audio.onended = () => {
            if (activeAudioUrlRef.current) {
              URL.revokeObjectURL(activeAudioUrlRef.current);
              activeAudioUrlRef.current = null;
            }
            activeAudioRef.current = null;
            sessionStorage.removeItem('avo_active_speaking_msg_id');
            setSpeakingMsgId((prev) => (prev === targetId ? null : prev));
          };

          audio.onerror = (e) => {
            console.warn('[Audio Playback Error, falling back to Web Speech]:', e);
            if (activeAudioUrlRef.current) {
              URL.revokeObjectURL(activeAudioUrlRef.current);
              activeAudioUrlRef.current = null;
            }
            activeAudioRef.current = null;
            speakWithBrowserSynthesis();
          };

          await audio.play();
          return;
        } catch (audioPlayErr) {
          console.warn('[HTMLAudio play error, falling back to Web Speech]:', audioPlayErr);
          speakWithBrowserSynthesis();
          return;
        }
      } else {
        // Non-200 from TTS API, fall back to browser Web Speech API
        speakWithBrowserSynthesis();
      }
    } catch (fetchErr) {
      console.warn('[Server TTS fetch failed, falling back to Web Speech API]:', fetchErr);
      speakWithBrowserSynthesis();
    }
  };

  // Toggle Pin Status for Conversation
  const togglePinChat = (convId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetConv = conversations.find((c) => c.id === convId);
    const newPinnedState = !targetConv?.isPinned;

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === convId ? { ...c, isPinned: newPinnedState } : c
      );
      // Sort pinned conversations to the top of the list
      return [...updated].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    });

    showToast(newPinnedState ? 'Chat pinned to top' : 'Chat unpinned');
  };

  // Clear Conversation Confirmation Modal State
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Trigger confirmation dialog for clearing current active conversation
  const handleClearCurrentChat = () => {
    if (!activeConvId) return;
    setIsClearConfirmOpen(true);
  };

  // Actually clear active conversation history after user confirmation
  const confirmClearCurrentChat = () => {
    if (!activeConvId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: [] } : c
      )
    );
    setIsClearConfirmOpen(false);
    showToast('Cleared conversation history');
  };

  // Export Conversation as Styled PDF
  const handleExportPDF = () => {
    if (!activeConv || activeConv.messages.length === 0) {
      showToast('No messages in this conversation to export.');
      return;
    }

    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;
      let y = 20;

      // Header Banner
      doc.setFillColor(37, 99, 235); // #2563EB
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('AVO AI • Conversation Report', margin, 17);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(dateStr, pageWidth - margin, 17, { align: 'right' });

      y = 36;

      // Conversation Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(`Topic: ${activeConv.title}`, maxLineWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 6 + 6;

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Iterate messages
      activeConv.messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        const roleLabel = isUser ? 'USER' : 'AVO AI';

        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        // Speaker Header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        if (isUser) {
          doc.setTextColor(37, 99, 235); // Blue
        } else {
          doc.setTextColor(124, 58, 237); // Purple
        }
        doc.text(`[${roleLabel}]  ${msg.timestamp}`, margin, y);
        y += 5;

        // Content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        // Strip markdown backticks/asterisks nicely for clean document text
        const sanitizedContent = msg.content
          .replace(/```[a-z]*\n?/g, '\n[Code Snippet]\n')
          .replace(/`/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');

        const splitLines = doc.splitTextToSize(sanitizedContent, maxLineWidth);

        splitLines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += 5;
        });

        y += 6; // Spacing between messages
      });

      // Footer Page Numbers
      const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${totalPages}  |  Generated by AVO AI`,
          pageWidth / 2,
          287,
          { align: 'center' }
        );
      }

      const safeName = activeConv.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25);
      doc.save(`${safeName || 'avo_chat'}_export.pdf`);
      showToast('Exported styled PDF document!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to generate PDF document.');
    }
  };

  // Copy Message Text
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setShowCopyCodeBanner(true);
    setTimeout(() => setCopiedCodeId(null), 2000);
    setTimeout(() => setShowCopyCodeBanner(false), 3000);
  };

  // Like / Dislike Toggle
  const handleReaction = (msgId: string, isLiked: boolean) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== msgId) return m;
            return {
              ...m,
              isLiked: m.isLiked === isLiked ? null : isLiked
            };
          })
        };
      })
    );
  };

  // Export Conversation to Markdown or PDF
  const handleExportConversation = (format: 'markdown' | 'pdf' = 'markdown') => {
    if (format === 'pdf') {
      handleExportPDF();
      return;
    }
    if (!activeConv || activeConv.messages.length === 0) {
      showToast('No messages to export.');
      return;
    }
    const safeName = activeConv.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25) || 'avo_chat';
    const mdHeader = `# ${activeConv.title}\n*Exported from AVO AI on ${new Date().toLocaleString()}*\n\n`;
    const mdBody = activeConv.messages
      .map((m) => `### **${m.role === 'user' ? '👤 User' : '⚡ AVO AI'}** *(${m.timestamp})*\n\n${m.content}`)
      .join('\n\n---\n\n');
    const mdContent = mdHeader + mdBody;

    try {
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}_transcript.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      navigator.clipboard.writeText(mdContent);
      showToast('Downloaded Markdown transcript file (.md)!');
    } catch (err) {
      navigator.clipboard.writeText(mdContent);
      showToast('Copied Markdown transcript to clipboard');
    }
  };

  // Regenerate Response
  const handleRegenerateResponse = (msgId: string) => {
    if (!activeConv) return;
    const msgIndex = activeConv.messages.findIndex((m) => m.id === msgId);
    if (msgIndex < 0) return;
    // Find the preceding user prompt
    const prevUserMsg = activeConv.messages.slice(0, msgIndex).reverse().find((m) => m.role === 'user');
    if (prevUserMsg) {
      handleSendMessage(prevUserMsg.content);
    } else {
      showToast('Unable to find previous prompt to regenerate.');
    }
  };

  // Send Message Logic
  const handleSendMessage = async (customPrompt?: string) => {
    let rawPrompt = customPrompt || input.trim();
    if (!rawPrompt && attachments.length > 0) {
      const hasImg = attachments.some(a => a.type === 'image' || a.mimeType?.startsWith('image/'));
      rawPrompt = hasImg ? "Analyze this attached image and describe what you see in detail." : "Please review and summarize the attached file.";
    }
    if (!rawPrompt || isGenerating) return;

    // 1. Quota Enforcement
    const userPlan = userProfile?.plan || 'Free';
    const quota = getMonthlyQuotaInfo(userProfile?.id || userProfile?.email, userPlan);
    if (quota.isExceeded) {
      showToast(`⚠️ Monthly quota reached (${quota.limit.toLocaleString()} messages). Your count resets to 0 on ${quota.nextResetDate} (${quota.daysUntilReset} days left). Upgrade now to continue immediately.`);
      const targetPlan = quota.plan === 'FREE' ? 'PRO' : 'MAX';
      const targetAmount = targetPlan === 'PRO' ? '999' : '2499';
      setRazorpayPlanInfo({ planName: `AVO AI ${targetPlan} Plan`, amount: targetAmount });
      setIsUpgradeModalOpen(true);
      return;
    }

    // 2. Model Tier Enforcement
    if (!isModelAllowedForUser(settings.model, userPlan)) {
      const reqPlan = getRequiredPlanForModel(settings.model);
      showToast(`🔒 ${settings.model} requires ${reqPlan} subscription. Upgrade to continue.`);
      const targetAmount = reqPlan === 'MAX' ? '2499' : '999';
      setRazorpayPlanInfo({ planName: `AVO AI ${reqPlan} Plan`, amount: targetAmount });
      setIsUpgradeModalOpen(true);
      return;
    }

    // 3. File Attachments Enforcement (Free tier check)
    if (attachments.length > 0 && normalizeUserPlan(userPlan) === 'FREE') {
      showToast('🔒 PDF, Document analysis & Image Understanding require PRO Plan. Upgrade to unlock.');
      setRazorpayPlanInfo({ planName: 'AVO AI PRO Plan', amount: '999' });
      setIsUpgradeModalOpen(true);
      return;
    }

    // Increment monthly quota
    incrementMonthlyMessages(userProfile?.id || userProfile?.email);

    let promptToSend = rawPrompt;
    if (activeInputMode?.prefix && !rawPrompt.startsWith(activeInputMode.prefix)) {
      promptToSend = `${activeInputMode.prefix}${rawPrompt}`;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp,
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    const updatedMessages = [...(activeConv?.messages || []), userMessage];
    
    let newTitle = activeConv?.title || 'New Conversation';
    let convFolderId = activeConv?.folderId || null;
    let convTags = activeConv?.tags || [];

    if (activeConv?.messages.length === 0) {
      newTitle = promptToSend.slice(0, 32) + (promptToSend.length > 32 ? '...' : '');
    }

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === activeConvId);
      if (exists) {
        return prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                title: newTitle,
                messages: updatedMessages,
                folderId: convFolderId,
                tags: convTags,
                updatedAt: 'Just now'
              }
            : c
        );
      } else {
        const brandNewConv: Conversation = {
          id: activeConvId,
          title: newTitle,
          messages: updatedMessages,
          folderId: convFolderId,
          tags: convTags,
          updatedAt: 'Just now',
          category: 'today'
        };
        return [brandNewConv, ...prev];
      }
    });

    setInput('');
    setActiveInputMode(null);
    localStorage.removeItem('nexus_ai_draft_input');
    const currentAtt = attachments[0];
    setAttachments([]);
    localStorage.removeItem('nexus_ai_draft_attachments');
    setIsGenerating(true);
    setIsThinking(true);
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    setTimeout(() => scrollToBottom(true), 50);

    const aiMessageId = (Date.now() + 1).toString();
    const placeholderAiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming'
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: [...updatedMessages, placeholderAiMessage] }
          : c
      )
    );

    try {
      abortControllerRef.current = new AbortController();
      let accumulatedText = '';
      const clientStartTime = performance.now();
      let firstTokenTime: number | null = null;
      let chunksCount = 0;

      const trimmedPayload = trimConversationHistory(
        updatedMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      );

      const findRecentImageAttachment = () => {
        if (currentAtt?.data) {
          return { data: currentAtt.data, mimeType: currentAtt.mimeType, name: currentAtt.name };
        }
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          const msg = updatedMessages[i];
          if (msg.attachments && msg.attachments.length > 0) {
            const imgAtt = msg.attachments.find((a) => a.type === 'image' || a.mimeType?.startsWith('image/'));
            if (imgAtt?.data) {
              return { data: imgAtt.data, mimeType: imgAtt.mimeType, name: imgAtt.name };
            }
          }
        }
        return undefined;
      };

      const resolvedImagePayload = findRecentImageAttachment();

      const streamGen = streamChatGenerator({
        messages: trimmedPayload,
        systemInstruction: activeConv?.systemOverride?.trim() || settings.systemPrompt,
        model: settings.model,
        effort: selectedEffort,
        mode: selectedEffort === 'low' ? 'fast' : selectedEffort === 'ultra' ? 'deep' : 'smart',
        image: resolvedImagePayload,
        signal: abortControllerRef.current.signal,
        onMetadata: (meta: any) => {
          if (meta) {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== activeConvId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          mode: meta.mode,
                          category: meta.category,
                          confidence: meta.confidence,
                          goBeyond: meta.goBeyond,
                          councilLogs: meta.councilLogs
                        }
                      : m
                  )
                };
              })
            );
          }
        }
      });

      for await (const chunkText of streamGen) {
        if (typeof chunkText !== 'string') continue;
        if (firstTokenTime === null) {
          firstTokenTime = performance.now();
          const ttft = Math.round(firstTokenTime - clientStartTime);
          console.log(`[ChatApp Perf] Time-to-First-Token (TTFT): ${ttft}ms`);
        }
        setIsThinking(false);
        accumulatedText += chunkText;
        chunksCount++;

        // Filter out any canned LLM refusals regarding image editing
        const cleanedText = accumulatedText
          .replace(/I cannot directly output an edited image file[^\n.]*(\.|\n)?/gi, '')
          .replace(/I cannot directly edit (images|image files)[^\n.]*(\.|\n)?/gi, '')
          .replace(/I am unable to directly output an edited image[^\n.]*(\.|\n)?/gi, '');

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === aiMessageId ? { ...m, content: cleanedText } : m
              )
            };
          })
        );
      }

      const totalGenDuration = Math.round(performance.now() - clientStartTime);
      console.log(`[ChatApp Perf] Total generation duration: ${totalGenDuration}ms across ${chunksCount} chunks.`);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConvId) return c;
          const updatedMsgs = c.messages.map((m) => {
            if (m.id === aiMessageId) {
              const cleanedFinal = accumulatedText
                .replace(/I cannot directly output an edited image file[^\n.]*(\.|\n)?/gi, '')
                .replace(/I cannot directly edit (images|image files)[^\n.]*(\.|\n)?/gi, '')
                .replace(/I am unable to directly output an edited image[^\n.]*(\.|\n)?/gi, '');
              const finalContent = cleanedFinal.trim() || 'Unable to reach the AI service. Please try again.';
              const finalStatus = accumulatedText.trim() ? ('complete' as const) : ('error' as const);
              return { ...m, content: finalContent, status: finalStatus };
            }
            return m;
          });

          // Background Auto-Title Update Service
          let finalTitle = c.title;
          const userMsgs = updatedMsgs.filter((m) => m.role === 'user');
          const isDefaultTitle = !c.title || c.title === 'New Chat' || c.title === 'New Conversation' || c.title.length > 30;
          if (userMsgs.length === 1 || isDefaultTitle) {
            finalTitle = generateShortTitle(userMsgs[0]?.content || '', accumulatedText);
          }

          return {
            ...c,
            title: finalTitle,
            summary: generateOneSentenceSummary(updatedMsgs, finalTitle),
            messages: updatedMsgs
          };
        })
      );

      // Generate 3 intelligent follow-up suggestions for the assistant response
      if (accumulatedText.trim()) {
        generateSuggestions(aiMessageId, accumulatedText, promptToSend);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[streamChatGenerator catch block] ChatApp handleSendMessage stream failure:', {
          error: err?.message || err,
          stack: err?.stack,
          activeConvId,
          aiMessageId,
          promptToSend
        });
        showToast('Stream interrupted or failed.');
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === aiMessageId && !m.content
                  ? { ...m, content: 'Unable to reach the AI service. Please try again.', status: 'error' as const }
                  : m
              )
            };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  // Save edited user message and re-trigger AI response
  const handleSaveEditedMessage = async (msgId: string) => {
    if (!editingText.trim() || !activeConv) return;

    const targetIdx = activeConv.messages.findIndex((m) => m.id === msgId);
    if (targetIdx === -1) return;

    const updatedUserMsg: ChatMessage = {
      ...activeConv.messages[targetIdx],
      content: editingText.trim(),
      timestamp: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (edited)`
    };

    const truncated = [
      ...activeConv.messages.slice(0, targetIdx),
      updatedUserMsg
    ];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: truncated, updatedAt: 'Just now' }
          : c
      )
    );

    setEditingMsgId(null);
    setEditingText('');
    setIsGenerating(true);
    setIsThinking(true);

    const aiMessageId = (Date.now() + 1).toString();
    const placeholderAiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming'
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: [...truncated, placeholderAiMessage] }
          : c
      )
    );

    try {
      abortControllerRef.current = new AbortController();
      let accumulatedText = '';

      const trimmedPayload = trimConversationHistory(
        truncated.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      );

      const streamGen = streamChatGenerator({
        messages: trimmedPayload,
        systemInstruction: settings.systemPrompt,
        model: settings.model,
        effort: selectedEffort,
        mode: selectedEffort === 'low' ? 'fast' : selectedEffort === 'ultra' ? 'deep' : 'smart',
        signal: abortControllerRef.current.signal
      });

      for await (const chunkText of streamGen) {
        if (typeof chunkText !== 'string') continue;
        setIsThinking(false);
        accumulatedText += chunkText;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === aiMessageId ? { ...m, content: accumulatedText } : m
              )
            };
          })
        );
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConvId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === aiMessageId ? { ...m, status: 'complete' } : m
            )
          };
        })
      );

      if (accumulatedText.trim()) {
        generateSuggestions(aiMessageId, accumulatedText, editingText.trim());
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[streamChatGenerator catch block] ChatApp handleRegenerate stream failure:', {
          error: err?.message || err,
          stack: err?.stack,
          activeConvId,
          aiMessageId,
          editingText
        });
        showToast('Stream interrupted or failed.');
      }
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  // Filtered Conversations (Category Filter: Active, Pinned, Archived) - Pinned chats sorted to top
  const filteredConvs = useMemo(() => {
    return conversations
      .filter((c) => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (categoryFilter === 'archived') {
          return c.isArchived === true;
        }

        if (c.isArchived) return false;

        if (categoryFilter === 'pinned') {
          return c.isPinned === true;
        }

        // categoryFilter === 'active'
        if (selectedTagFilter === 'archived') {
          return c.isArchived === true;
        }
        if (selectedTagFilter === 'all') return true;
        return c.tags?.includes(selectedTagFilter);
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [conversations, searchQuery, categoryFilter, selectedTagFilter]);

  // Keyboard Arrow Navigation (Up/Down) for Sidebar Conversation List
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (filteredConvs.length === 0) return;
        e.preventDefault();

        const currentIndex = filteredConvs.findIndex((c) => c.id === activeConvId);
        let nextIndex = 0;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < filteredConvs.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredConvs.length - 1;
        }

        if (filteredConvs[nextIndex]) {
          setActiveConvId(filteredConvs[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredConvs, activeConvId]);

  // Close Plus Menu or Quick Prompts on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPlusMenu) setShowPlusMenu(false);
        if (showQuickPrompts) setShowQuickPrompts(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showPlusMenu, showQuickPrompts]);

  const uncategorizedConvs = useMemo(() => {
    return filteredConvs
      .filter((c) => !c.folderId)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [filteredConvs]);

  // Character limit ring values
  const charLimit = 2000;
  const charCount = input.length;
  const progressRatio = Math.min(charCount / charLimit, 1);
  const ringRadius = 8;
  const circumference = 2 * Math.PI * ringRadius; // ~50.265
  const strokeOffset = circumference * (1 - progressRatio);
  const ringColor = charCount >= 1900 ? '#EF4444' : charCount >= 1600 ? '#F59E0B' : '#2563EB';

  const renderChatInput = (isCentered: boolean) => (
    <>
      {/* Quick Templates Popover / Bottom Sheet */}
      {showQuickPrompts && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] sm:z-40 sm:bg-transparent"
            onClick={() => setShowQuickPrompts(false)}
          />
          <div className={`fixed inset-x-0 bottom-0 z-[100] max-h-[85vh] rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-4 pb-6 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col space-y-1 overflow-y-auto animate-in slide-in-from-bottom-full duration-200 sm:absolute sm:inset-auto ${isCentered ? 'sm:left-24' : 'sm:left-28'} sm:bottom-[calc(100%+12px)] sm:z-50 sm:w-80 sm:rounded-2xl sm:p-2.5 sm:max-h-[420px] sm:shadow-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-800 sm:bg-white dark:sm:bg-zinc-900`}>
            {/* Mobile Touch Drag Handle Indicator */}
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-2 shrink-0 sm:hidden" />

            <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 mb-1 shrink-0">
              <span>Quick Templates</span>
              <button
                type="button"
                onClick={() => setShowQuickPrompts(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
            {SUGGESTED_PROMPTS.map((sp) => (
              <button
                key={sp.title}
                type="button"
                onClick={() => {
                  setInput(sp.prompt);
                  setShowQuickPrompts(false);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="w-full text-left p-2.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer group active:scale-[0.99]"
              >
                <div className="font-medium text-xs sm:text-xs text-zinc-900 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{sp.title}</div>
                <div className="text-[11px] text-zinc-500 truncate">{sp.prompt}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Drag and Drop File Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-30 bg-zinc-900/95 text-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-500 shadow-2xl backdrop-blur-xs animate-in fade-in duration-150">
          <Paperclip className="w-8 h-8 mb-2 animate-bounce" />
          <span className="font-bold text-sm">Drop files to attach to AVO AI</span>
          <span className="text-xs opacity-80 mt-1">PDF, DOCX, TXT, Images</span>
        </div>
      )}

      {/* Voice Listening Active Helper Indicator */}
      {(isVoiceRecording || isTranscribingAudio) && (
        <div className="mb-2 p-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white dark:bg-zinc-900"></span>
            </span>
            <span className="font-bold shrink-0">
              {isTranscribingAudio ? 'Transcribing Speech:' : 'Push-To-Talk Active:'}
            </span>
            <span className="text-[11px] text-zinc-300 dark:text-zinc-700 truncate font-medium">
              {isTranscribingAudio
                ? 'Converting recorded audio to text via AVO AI...'
                : 'Listening to your voice... Click Stop Recording when done to convert speech to text!'}
            </span>
          </div>
          {!isTranscribingAudio && (
            <button
              type="button"
              onClick={stopVoiceInput}
              className="px-2.5 py-1 bg-white text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer shadow-xs border border-zinc-300 dark:border-zinc-700"
            >
              Stop Recording
            </button>
          )}
        </div>
      )}

      {/* Animated Glowing Typing Box Container */}
      <div className="relative w-full group/typing-box">
        {/* Pulsating ambient glow aura (active and visible across mobile and desktop) */}
        <div
          className={`absolute -inset-[2px] ${
            isCentered ? 'rounded-[28px] sm:rounded-[32px]' : 'rounded-[26px] sm:rounded-[30px]'
          } bg-gradient-to-r from-zinc-400/30 via-zinc-200/45 to-zinc-400/30 dark:from-white/20 dark:via-zinc-100/35 dark:to-white/20 pointer-events-none transition-opacity duration-300 group-hover/typing-box:opacity-100 group-focus-within/typing-box:opacity-100 animate-chat-box-aura`}
        />

        {/* Animated border perimeter */}
        <div
          className={`relative p-[2px] shadow-sm sm:shadow-2xl transition-all duration-300 ${
            isCentered ? 'rounded-[26px] sm:rounded-[30px]' : 'rounded-[24px] sm:rounded-[28px]'
          } overflow-hidden bg-zinc-300/80 dark:bg-zinc-800`}
        >
          {/* Rotating bright light beam running along the perimeter across mobile and desktop */}
          <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isCentered ? 'rounded-[26px] sm:rounded-[30px]' : 'rounded-[24px] sm:rounded-[28px]'}`}>
            <div
              className="animate-chat-border-beam bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,0,0,0.15)_50deg,rgba(0,0,0,0.75)_105deg,#000000_120deg,rgba(0,0,0,0.35)_135deg,transparent_180deg,rgba(0,0,0,0.15)_230deg,rgba(0,0,0,0.75)_285deg,#000000_300deg,rgba(0,0,0,0.35)_315deg,transparent_360deg)] dark:bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.25)_50deg,rgba(255,255,255,0.9)_105deg,#ffffff_120deg,rgba(255,255,255,0.45)_135deg,transparent_180deg,rgba(255,255,255,0.25)_230deg,rgba(255,255,255,0.9)_285deg,#ffffff_300deg,rgba(255,255,255,0.45)_315deg,transparent_360deg)] pointer-events-none"
            />
          </div>

          {/* Inner Input Box Card */}
          <div
            className={
              isCentered
                ? "relative z-10 rounded-[24px] sm:rounded-[28px] bg-[#f4f4f4] dark:bg-[#212121] transition-all p-2.5 sm:p-3 px-3 sm:px-4 space-y-2"
                : "relative z-10 rounded-[22px] sm:rounded-[26px] bg-zinc-100 dark:bg-[#18181b] transition-all p-2 sm:p-2.5 px-2.5 sm:px-3.5 space-y-1.5"
            }
          >
        {/* Active Mode Pill / Badge */}
        {activeInputMode && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeInputMode.badgeBg}`}>
              {activeInputMode.label}
              <button
                type="button"
                onClick={() => setActiveInputMode(null)}
                className="hover:opacity-75 cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 px-3 bg-zinc-200/80 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-300 dark:border-zinc-700/60"
              >
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-5 h-5 object-cover rounded" />
                ) : (
                  <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                )}
                <span className="max-w-[140px] truncate font-medium text-zinc-900 dark:text-zinc-200">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Typing Markdown Preview */}
        {isPreviewMarkdown && input.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-zinc-200/50 dark:bg-zinc-950/70 border border-zinc-300/80 dark:border-zinc-800/80 rounded-xl max-h-48 overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold mb-1 pb-1 border-b border-zinc-300/40 dark:border-zinc-800/60">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-500" />
                Live Markdown Preview
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewMarkdownDisabled(true)}
                className="hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer lowercase text-[10px]"
              >
                dismiss
              </button>
            </div>
            <div className="text-zinc-900 dark:text-zinc-100 font-sans leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <div className="leading-relaxed mb-1">{children}</div>,
                  pre: ({ children }) => <>{children}</>
                }}
                urlTransform={(url) => url}
              >
                {input}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= charLimit) {
              setInput(e.target.value);
            }
            if (isPreviewMarkdownDisabled && hasMarkdownSyntax(e.target.value)) {
              setIsPreviewMarkdownDisabled(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSendMessage();
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            } else if (e.key === 'ArrowUp' && !input.trim()) {
              const userMsgs = (activeConv?.messages || []).filter((m) => m.role === 'user');
              if (userMsgs.length > 0) {
                e.preventDefault();
                setInput(userMsgs[userMsgs.length - 1].content);
              }
            } else if (e.key === 'ArrowDown' && input.trim()) {
              const userMsgs = (activeConv?.messages || []).filter((m) => m.role === 'user');
              if (userMsgs.length > 0 && input === userMsgs[userMsgs.length - 1].content) {
                e.preventDefault();
                setInput('');
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              textareaRef.current?.blur();
            }
          }}
          placeholder={isCentered ? "What are you thinking? Ask anything..." : "Ask anything"}
          style={{
            fieldSizing: 'content' as any,
          }}
          className="chat-textarea w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-transparent border-none outline-none focus:ring-0 text-[16px] sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none leading-relaxed min-h-[48px] max-h-[240px] overflow-y-auto block transition-none"
        />

        <input
          type="file"
          ref={imageFileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
          multiple
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx,.csv,.xlsx,.json,.md,.log,.zip"
          multiple
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {/* Plus Action Button & Popover */}
            <div className="relative">
              <button
                type="button"
                id="chat-plus-menu-button"
                onClick={() => {
                  setShowPlusMenu((prev) => !prev);
                  setShowQuickPrompts(false);
                }}
                className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center border shadow-xs ${
                  showPlusMenu
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white ring-2 ring-zinc-500/25 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/90 hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
                title="Add tools, images, and files"
                aria-expanded={showPlusMenu}
                aria-haspopup="true"
              >
                <Plus
                  className={`w-5 h-5 transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`}
                  strokeWidth={2.35}
                />
              </button>

              {/* Plus Menu Popover / Bottom Sheet */}
              <AnimatePresence>
                {showPlusMenu && (
                  <>
                    {/* Backdrop: translucent dim on mobile, transparent click-catcher on desktop */}
                    <div
                      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] sm:z-40 sm:bg-transparent"
                      onClick={() => setShowPlusMenu(false)}
                    />

                    {/* Popover Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="fixed inset-x-0 bottom-0 z-[100] max-h-[85vh] rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-4 pb-6 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col space-y-3 overflow-y-auto sm:absolute sm:inset-auto sm:left-0 sm:bottom-[calc(100%+12px)] sm:z-50 sm:w-80 sm:max-h-[440px] sm:rounded-2xl sm:p-2.5 sm:border sm:border-zinc-200/90 dark:sm:border-zinc-800 sm:bg-white dark:sm:bg-zinc-900 sm:shadow-xl"
                    >
                      {/* Mobile Drag Indicator */}
                      <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-1 shrink-0 sm:hidden" />

                      {/* Header */}
                      <div className="px-2 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Actions & Tools</span>
                        </div>
                        <button
                          type="button"
                          id="chat-plus-menu-close"
                          onClick={() => setShowPlusMenu(false)}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          aria-label="Close menu"
                        >
                          <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>

                      {/* Group 1: Content & Files */}
                      <div className="space-y-0.5">
                        <div className="px-2 pt-1 pb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Attach & Media
                        </div>

                        {/* Upload Image */}
                        <button
                          type="button"
                          id="plus-menu-upload-image"
                          onClick={() => {
                            setShowPlusMenu(false);
                            setTimeout(() => {
                              imageFileInputRef.current?.click();
                            }, 50);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/50 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform duration-150">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Upload images</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Add photos or screenshots from device</span>
                          </div>
                        </button>

                        {/* Take photo */}
                        <button
                          type="button"
                          id="plus-menu-take-photo"
                          onClick={() => {
                            setShowPlusMenu(false);
                            setIsCameraModalOpen(true);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-150">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Take photo</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Capture directly with web camera</span>
                          </div>
                        </button>

                        {/* Attach document or file */}
                        <button
                          type="button"
                          id="plus-menu-attach-file"
                          onClick={() => {
                            setShowPlusMenu(false);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 50);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform duration-150">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Attach document or file</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">PDF, DOCX, TXT, code, or sheets</span>
                          </div>
                        </button>

                        {/* Add from library */}
                        <button
                          type="button"
                          id="plus-menu-add-library"
                          onClick={() => {
                            fileInputRef.current?.click();
                            showToast('📂 Select files from library or computer');
                            setActiveInputMode({ id: 'add_library', label: 'Library Mode', badgeBg: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700/60' });
                            setShowPlusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform duration-150">
                            <Library className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Add from library</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Browse your documents and knowledge base</span>
                          </div>
                        </button>
                      </div>

                      {/* Group 2: AI Modes & Analysis */}
                      <div className="space-y-0.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="px-2 pt-1 pb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          AI Capabilities
                        </div>

                        {/* Create image */}
                        <button
                          type="button"
                          id="plus-menu-create-image"
                          onClick={() => {
                            setActiveInputMode({ id: 'create_image', label: 'Create Image', prefix: '[Create Image Mode]: ', badgeBg: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/90 dark:text-violet-200 dark:border-violet-700/60' });
                            setTimeout(() => textareaRef.current?.focus(), 50);
                            setShowPlusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/50 flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform duration-150">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Create image</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Visualize ideas with AI generation</span>
                          </div>
                        </button>

                        {/* Web search */}
                        <button
                          type="button"
                          id="plus-menu-web-search"
                          onClick={() => {
                            setActiveInputMode({ id: 'web_search', label: 'Web Search', prefix: '[Web Search Mode]: ', badgeBg: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950/90 dark:text-cyan-200 dark:border-cyan-700/60' });
                            setSettings((prev) => ({ ...prev, googleSearchGrounding: true }));
                            setTimeout(() => textareaRef.current?.focus(), 50);
                            showToast('🌐 Web search enabled for real-time information');
                            setShowPlusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform duration-150">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Web search</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Search live Google data & current news</span>
                          </div>
                        </button>

                        {/* Deep research */}
                        <button
                          type="button"
                          id="plus-menu-deep-research"
                          onClick={() => {
                            setActiveInputMode({ id: 'deep_research', label: 'Deep Research', prefix: '[Deep Research Mode]: ', badgeBg: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950/90 dark:text-teal-200 dark:border-teal-700/60' });
                            setSettings((prev) => ({ ...prev, googleSearchGrounding: true }));
                            setTimeout(() => textareaRef.current?.focus(), 50);
                            showToast('🔬 Deep Research mode engaged');
                            setShowPlusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/50 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform duration-150">
                            <Search className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Deep research</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Comprehensive multi-source analysis</span>
                          </div>
                        </button>

                        {/* Analyze spreadsheets & data */}
                        <button
                          type="button"
                          id="plus-menu-analyze-data"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setActiveInputMode({ id: 'analyze_csv', label: 'Analyze Data/CSV', prefix: '[Data Analysis Mode]: ', badgeBg: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700/60' });
                            setShowPlusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-150">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Analyze data & sheets</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Upload CSV, spreadsheets or tabular logs</span>
                          </div>
                        </button>

                        {/* Quick Prompts / Templates */}
                        <button
                          type="button"
                          id="plus-menu-quick-templates"
                          onClick={() => {
                            setShowPlusMenu(false);
                            setShowQuickPrompts(true);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-150">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Prompt templates</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Browse curated quick starters & role prompts</span>
                          </div>
                        </button>

                        {/* Live Markdown Preview Toggle */}
                        <button
                          type="button"
                          id="plus-menu-markdown-preview"
                          onClick={() => {
                            setShowPlusMenu(false);
                            setIsPreviewMarkdown(!isPreviewMarkdown);
                            showToast(isPreviewMarkdown ? 'Markdown preview off' : 'Markdown preview on');
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl text-zinc-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform duration-150">
                            {isPreviewMarkdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                              {isPreviewMarkdown ? 'Disable live formatting' : 'Live markdown formatting'}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Toggle formatted markdown editing mode</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Image Upload Quick Button */}
            <button
              type="button"
              onClick={() => {
                imageFileInputRef.current?.click();
                showToast('📷 Opening image selector');
              }}
              className="p-1.5 sm:p-2 text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-full transition-colors cursor-pointer shrink-0"
              title="Upload image directly from your device"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Push-to-Talk Speech Button */}
            <button
              type="button"
              onMouseDown={handlePushToTalkStart}
              onMouseUp={handlePushToTalkEnd}
              onMouseLeave={handlePushToTalkEnd}
              onTouchStart={handlePushToTalkStart}
              onTouchEnd={handlePushToTalkEnd}
              disabled={isTranscribingAudio}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none relative shrink-0 ${
                isVoiceRecording
                  ? isAudioActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xl shadow-zinc-500/30 ring-2 ring-zinc-400 dark:ring-zinc-200 scale-105'
                    : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-lg ring-2 ring-zinc-500/80 animate-pulse'
                  : isTranscribingAudio
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 animate-pulse'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
              title="Push & hold to speak, or tap to toggle dictation"
            >
              <span className="relative flex items-center justify-center">
                {isVoiceRecording && isAudioActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-500 opacity-80"></span>
                )}
                <Mic className={`w-3.5 h-3.5 ${isAudioActive ? 'animate-bounce' : ''}`} />
              </span>
              <span className={`text-[11px] font-semibold ${isVoiceRecording || isTranscribingAudio ? 'inline' : 'hidden lg:inline'}`}>
                {isTranscribingAudio
                  ? 'Transcribing...'
                  : isVoiceRecording
                  ? isAudioActive
                    ? 'Listening...'
                    : 'Listening...'
                  : 'Push to Talk'}
              </span>
            </button>
          </div>

          {/* Right Send Tools & Effort Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <EffortSelector
              selectedEffort={selectedEffort}
              onSelectEffort={(eff) => {
                setSelectedEffort(eff);
                setSelectedMode(eff);
                try {
                  localStorage.setItem('nexus_effort', eff);
                } catch {}
              }}
              disabled={isGenerating}
            />

            {charCount > 100 && (
              <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                {charCount}/{charLimit}
              </span>
            )}

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0"
                title="Stop generating"
              >
                <Square className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() && attachments.length === 0}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
                title="Send Message"
              >
                <ArrowUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* Disclaimer */}
      {isCentered && (
        <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2.5 font-normal">
          Avo AI can make mistakes. Verify important information.
        </p>
      )}
    </>
  );

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-[#F5F5F7] overflow-hidden font-sans">
      
      {/* Centered Model Selection & Status Notification */}
      {toastMessage && (
        <div 
          className="fixed top-16 sm:top-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md px-4 py-2 rounded-full bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-xs font-semibold shadow-xl border border-zinc-700/80 backdrop-blur-md flex items-center justify-center text-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none transition-all whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate max-w-[75vw] sm:max-w-xs">{toastMessage}</span>
        </div>
      )}


      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen
            ? 'w-72 translate-x-0 opacity-100 pointer-events-auto border-r shadow-2xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 opacity-0 md:opacity-0 pointer-events-none border-r-0'
        } fixed inset-y-0 left-0 md:relative z-50 md:z-20 transition-transform md:transition-all duration-200 ease-out transform-gpu will-change-transform border-zinc-200 dark:border-[#2B2B2B] bg-white dark:bg-black flex flex-col shrink-0 overflow-hidden h-full`}
      >
        <div className="w-72 h-full flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={onBackToWebsite}
            className="flex items-center space-x-2 text-black dark:text-white hover:opacity-80 transition-opacity"
            title="Return to Home Landing Page"
          >
            <NexusLogo size="sm" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsBulkDeleteMode(!isBulkDeleteMode);
                if (isBulkDeleteMode) setSelectedConvIds([]);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isBulkDeleteMode
                  ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800 ring-2 ring-rose-400'
                  : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
              title={isBulkDeleteMode ? 'Exit Bulk Select' : 'Bulk Select & Delete Conversations'}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Delete Mode Banner */}
        {isBulkDeleteMode && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
              <span className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Bulk Delete Mode ({selectedConvIds.length})
              </span>
              <button
                onClick={() => {
                  setIsBulkDeleteMode(false);
                  setSelectedConvIds([]);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Close bulk mode"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={handleSelectAllConvs}
                className="px-2 py-1 text-[10px] font-semibold bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {selectedConvIds.length === filteredConvs.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleExecuteBulkDeleteConvs}
                disabled={selectedConvIds.length === 0}
                className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete ({selectedConvIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Primary Sidebar Navigation Items */}
        <div className="px-2 pt-2 space-y-0.5">
          {/* + New chat */}
          <button
            onClick={() => handleNewChat()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer group text-left"
          >
            <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white shrink-0" />
            <span>New chat</span>
          </button>

          {/* Chats */}
          <button
            onClick={() => {
              setSelectedTagFilter('all');
              setSearchQuery('');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-left"
          >
            <MessageSquare className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span>Chats</span>
          </button>
        </div>

        {/* New Folder Inline Form */}
        {isCreatingFolder && (
          <div className="mx-2 my-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5 shadow-2xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Folder Name
              </label>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Color Theme Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Color Theme
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedFolderColor}
                  onChange={(e) => setSelectedFolderColor(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {FOLDER_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className={`w-4 h-4 rounded-full shrink-0 ${selectedFolderColor} shadow-2xs border border-white/20`} />
              </div>

              {/* Quick Swatch Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {FOLDER_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedFolderColor(opt.value)}
                    className={`w-3.5 h-3.5 rounded-full ${opt.value} transition-transform cursor-pointer ${
                      selectedFolderColor === opt.value
                        ? 'scale-125 ring-2 ring-zinc-400 ring-offset-1 dark:ring-offset-zinc-900'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                  setSelectedFolderColor('bg-zinc-500');
                }}
                className="px-2.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-2.5 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white rounded font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Section: Recents */}
        <div className="px-2 pt-2 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Dedicated Category Filter Buttons */}
          <div className="mx-1 mb-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-1 text-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('active');
                setSelectedTagFilter('all');
              }}
              className={`flex-1 py-1 px-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                categoryFilter === 'active'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Active</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('pinned')}
              className={`flex-1 py-1 px-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                categoryFilter === 'pinned'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>Pinned ({conversations.filter(c => c.isPinned && !c.isArchived).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('archived')}
              className={`flex-1 py-1 px-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                categoryFilter === 'archived'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Archived ({conversations.filter(c => c.isArchived).length})</span>
            </button>
          </div>

          <div className="px-3 py-1 flex items-center justify-between text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            <span className="capitalize font-bold text-zinc-300">{categoryFilter} Threads</span>
            <button
              onClick={() => setShowRecentsFilter((prev) => !prev)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Filter / Search Recents"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Conversations & Tag Filter Bar (Visible when toggled or searching) */}
          {(showRecentsFilter || searchQuery) && (
            <div className="px-1 mb-2 space-y-2 pt-1 animate-in fade-in duration-150">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Tag Filter Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <button
                  onClick={() => setSelectedTagFilter('all')}
                  className={`px-2 py-0.5 rounded-lg font-semibold shrink-0 transition-colors ${
                    selectedTagFilter === 'all'
                      ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  All
                </button>
                {DEFAULT_TAGS.map((tag) => {
                  const isDragOver = dragOverTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagFilter(selectedTagFilter === tag.id ? 'all' : tag.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTagId(tag.id);
                      }}
                      onDragLeave={() => setDragOverTagId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTagId(null);
                        const convId = e.dataTransfer.getData('text/plain') || draggedConvId;
                        if (convId) {
                          handleApplyTagToChat(convId, tag.id);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg font-semibold shrink-0 transition-all border ${tag.color} ${tag.textColor} ${
                        selectedTagFilter === tag.id ? 'ring-2 ring-zinc-400 font-bold' : 'opacity-80 hover:opacity-100'
                      } ${
                        isDragOver
                          ? 'scale-110 ring-2 ring-emerald-500 shadow-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : ''
                      }`}
                      title={`Click to filter or drag a chat here to apply "${tag.name}" tag`}
                    >
                      {isDragOver ? `+ ${tag.name}` : tag.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedTagFilter(selectedTagFilter === 'archived' ? 'all' : 'archived')}
                  className={`px-2 py-0.5 rounded-lg font-semibold shrink-0 transition-colors ${
                    selectedTagFilter === 'archived'
                      ? 'bg-zinc-800 text-amber-300 dark:bg-amber-950 dark:text-amber-200 border border-amber-500'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  📦 Archived
                </button>
              </div>
            </div>
          )}

          {/* Recent Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
            
            {/* Folders Section - Auto-Sorted by Last Activity */}
            {sortedFolders.length > 0 && selectedTagFilter !== 'archived' && (
              <div className="space-y-1">
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3 text-zinc-400" /> Folders
                  </span>
                  <span className="text-[9px] font-normal text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Auto-sorted
                  </span>
                </div>
                {sortedFolders.map((folder) => {
                  const folderChats = filteredConvs
                    .filter((c) => c.folderId === folder.id)
                    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
                  const isDragOver = dragOverFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverFolderId(null);
                        }
                      }}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      className={`rounded-xl border transition-all duration-200 ${
                        isDragOver
                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/40 shadow-md scale-[1.01]'
                          : 'border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      {/* Folder Header */}
                      <div
                        onClick={() => toggleFolderCollapse(folder.id)}
                        className={`p-2 flex items-center justify-between cursor-pointer group hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-colors ${
                          isDragOver ? 'bg-blue-100/60 dark:bg-blue-900/40' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {folder.isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <div className={`w-2.5 h-2.5 rounded-full ${folder.color || 'bg-zinc-500'}`} />
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200 truncate">
                            {folder.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ({folderChats.length})
                          </span>
                        </div>

                        {isDragOver ? (
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <FolderInput className="w-3 h-3" /> Drop to move
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNewChat(folder.id);
                              }}
                              className="p-1 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
                              title="New chat in folder"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              className="p-1 hover:text-rose-500 rounded"
                              title="Delete folder"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Folder Chat Children */}
                      {!folder.isCollapsed && (
                        <div className="pl-3 pr-1 pb-1 space-y-1">
                          {folderChats.length === 0 ? (
                            <div
                              onDragOver={(e) => handleDragOver(e, folder.id)}
                              onDrop={(e) => handleDrop(e, folder.id)}
                              className={`p-2.5 text-[10px] italic border border-dashed rounded-lg text-center transition-colors ${
                                isDragOver
                                  ? 'border-blue-400 text-blue-500 bg-blue-50 dark:bg-blue-950/30 font-medium'
                                  : 'text-zinc-400 border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {isDragOver ? 'Release to drop chat into this folder' : 'Drag chats here'}
                            </div>
                          ) : (
                            folderChats.map((conv) => (
                              <ConversationListItem
                                key={conv.id}
                                conv={conv}
                                isActive={activeConvId === conv.id}
                                onSelect={() => handleSelectConv(conv.id)}
                                onDelete={(e) => handleDeleteChat(conv.id, e)}
                                onPin={() => togglePinChat(conv.id)}
                                onArchive={() => handleArchiveChat(conv.id)}
                                onDuplicate={() => handleDuplicateChat(conv.id)}
                                onRename={(title) => handleRenameChat(conv.id, title)}
                                onToggleTag={(tagId) => handleToggleTag(conv.id, tagId)}
                                onDragStart={(e) => handleDragStart(e, conv.id)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (draggedConvId && draggedConvId !== conv.id) {
                                    setDragOverTargetConvId(conv.id);
                                  }
                                }}
                                onDragLeave={() => setDragOverTargetConvId(null)}
                                onDrop={(e) => handleDropOnConv(e, conv.id)}
                                isDragOverTarget={dragOverTargetConvId === conv.id}
                                availableTags={DEFAULT_TAGS}
                                folders={folders}
                                onMoveToFolder={(fId) => handleMoveChatToFolder(conv.id, fId)}
                                isBulkMode={isBulkDeleteMode}
                                isSelectedForBulk={selectedConvIds.includes(conv.id)}
                                onToggleBulkSelect={() => toggleBulkSelectConv(conv.id)}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Uncategorized / All Chats Section */}
            <div
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverFolderId(null);
                }
              }}
              onDrop={(e) => handleDrop(e, null)}
              className={`p-1 rounded-xl transition-all border ${
                dragOverFolderId === 'uncategorized' && draggedConvId
                  ? 'border-zinc-400 dark:border-zinc-600 ring-2 ring-zinc-400/40 bg-zinc-100/80 dark:bg-zinc-800/80'
                  : 'border-transparent'
              } space-y-0.5`}
            >
              {filteredConvs.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  {selectedTagFilter === 'archived' ? 'No archived chats.' : 'No conversations found.'}
                </div>
              ) : (
                uncategorizedConvs.map((conv) => (
                  <ConversationListItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConvId === conv.id}
                    onSelect={() => handleSelectConv(conv.id)}
                    onDelete={(e) => handleDeleteChat(conv.id, e)}
                    onPin={() => togglePinChat(conv.id)}
                    onArchive={() => handleArchiveChat(conv.id)}
                    onDuplicate={() => handleDuplicateChat(conv.id)}
                    onRename={(title) => handleRenameChat(conv.id, title)}
                    onToggleTag={(tagId) => handleToggleTag(conv.id, tagId)}
                    onDragStart={(e) => handleDragStart(e, conv.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedConvId && draggedConvId !== conv.id) {
                        setDragOverTargetConvId(conv.id);
                      }
                    }}
                    onDragLeave={() => setDragOverTargetConvId(null)}
                    onDrop={(e) => handleDropOnConv(e, conv.id)}
                    isDragOverTarget={dragOverTargetConvId === conv.id}
                    availableTags={DEFAULT_TAGS}
                    folders={folders}
                    onMoveToFolder={(fId) => handleMoveChatToFolder(conv.id, fId)}
                    isBulkMode={isBulkDeleteMode}
                    isSelectedForBulk={selectedConvIds.includes(conv.id)}
                    onToggleBulkSelect={() => toggleBulkSelectConv(conv.id)}
                  />
                ))
              )}
            </div>

          </div>
        </div>

        {/* User Profile & Plan Footer */}
        <div className="relative p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/60 mt-auto shrink-0">

          {/* Upgrade Plan Callout Banner with real-time monthly message quota & auto-reset indicator */}
          {(() => {
            const userPlan = userProfile?.plan || 'Free';
            // quotaVersion dependency ensures reactive re-computation
            void quotaVersion;
            const quota = getMonthlyQuotaInfo(userProfile?.id || userProfile?.email, userPlan);
            const isFree = quota.plan === 'FREE';
            const isPro = quota.plan === 'PRO';

            return (
              <div 
                className="mb-2.5 p-2.5 rounded-2xl bg-zinc-800 text-white border border-zinc-700/90 flex flex-col gap-2 shadow-xs transition-all"
                title={`Monthly Allowance: ${quota.limit.toLocaleString()} messages/month. Message count resets to 0 automatically every month (${quota.nextResetDate}).`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{quota.plan === 'FREE' ? 'Free Starter' : quota.plan === 'PRO' ? 'Pro Plan' : 'Max Plan'}</span>
                      <span className="text-[10px] font-normal text-zinc-400">
                        ({quota.used.toLocaleString()}/{quota.limit.toLocaleString()} msgs)
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-300 truncate">
                      {isFree ? '500 msgs • AVO Flash & 4o' : isPro ? '2,000 msgs • 4o, Pro, Flash, Omni' : '10,000 msgs • All 5 Models'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isFree) {
                        setRazorpayPlanInfo({ planName: 'AVO AI PRO Plan', amount: '999' });
                        setIsUpgradeModalOpen(true);
                      } else if (isPro) {
                        setRazorpayPlanInfo({ planName: 'AVO AI MAX Plan', amount: '2499' });
                        setIsUpgradeModalOpen(true);
                      } else {
                        navigate('/pricing');
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {isFree ? 'Upgrade' : isPro ? 'Get Max' : 'Plans'}
                  </button>
                </div>

                {/* Progress Bar & Automatic Monthly Reset Indicator */}
                <div className="space-y-1 pt-1 border-t border-zinc-700/60">
                  <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        quota.percentUsed > 90 ? 'bg-rose-500' : quota.percentUsed > 75 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(1, quota.percentUsed)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                      <span>Resets to 0 in {quota.daysUntilReset}d ({quota.nextResetShort})</span>
                    </span>
                    <span className="text-zinc-400">{quota.remaining.toLocaleString()} left</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* User Profile Footer Row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1 -m-1 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer group"
              title="Account Settings & Preferences"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-zinc-700/50">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span className="truncate">{userProfile?.name || 'AVO Member'}</span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium truncate">
                  {userProfile?.email || 'test@srmist.edu.in'}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Account Settings & Preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </aside>

      {/* Collapsed Left Mini Icon Rail (Matches ChatGPT layout) */}
      {!isSidebarOpen && (
        <div className="hidden md:flex w-14 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#0d0d0d] flex-col items-center justify-between py-3.5 z-20 shrink-0 transition-colors select-none">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Open sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>

            <button
              onClick={() => handleNewChat()}
              className="p-2 rounded-xl text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer mt-1"
              title="New chat"
            >
              <SquarePen size={18} />
            </button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Search chats"
            >
              <Search size={18} />
            </button>

            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Explore Projects & Artifacts"
            >
              <Compass size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs overflow-hidden border border-zinc-700/50"
              title={`${displayUserName} - Settings & Preferences`}
            >
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt={displayUserName} className="w-full h-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      <main
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className="flex-1 flex flex-col h-full relative overflow-hidden bg-white dark:bg-black text-zinc-900 dark:text-[#F5F5F7]"
      >
        {/* Main Header Bar */}
        <header className="h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 px-3 sm:px-5 flex items-center justify-between bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 z-20 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 md:hidden"
                title="Expand Navigation Sidebar (⌘B)"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}

            {/* Model Dropdown: 5 AVO Models with distinct specialties & thinking styles ⌄ */}
            <div className="relative">
              {(() => {
                const currentModelSpec = getModelSpec(settings.model);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-sm sm:text-base transition-colors cursor-pointer group max-w-[135px] sm:max-w-none"
                      title={`${currentModelSpec.name}: ${currentModelSpec.specialty}`}
                    >
                      <span className="font-medium truncate">{currentModelSpec.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700/60 hidden sm:inline-block">
                        {currentModelSpec.tag}
                      </span>
                      <ChevronDown size={14} className={`text-zinc-400 shrink-0 transition-transform duration-150 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none transition-opacity" 
                          onClick={() => setIsModelDropdownOpen(false)} 
                        />
                        <div className="fixed inset-x-3.5 top-16 sm:inset-auto sm:absolute sm:left-0 sm:top-[calc(100%+6px)] z-50 sm:w-[410px] max-h-[80vh] flex flex-col bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                          {/* Modal Header */}
                          <div className="px-3.5 py-2.5 bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                            <div>
                              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Select AI Model
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                5 distinct reasoning engines
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsModelDropdownOpen(false)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Close"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Model Items Scroll Area */}
                          <div className="p-2 space-y-1.5 overflow-y-auto overscroll-contain flex-1">
                            {AVO_MODELS.map((m) => {
                              const isSelected = settings.model === m.id || 
                                (m.id === 'gemini-3.1-flash-lite' && (!settings.model || settings.model === 'avo-flash' || settings.model === 'gemini-3-flash')) ||
                                (m.id === 'gemini-3.6-flash' && (settings.model === 'avo-4o' || settings.model === 'avo-omni-unified')) ||
                                (m.id === 'gemini-3.6-pro' && (settings.model === 'avo-4o-pro' || settings.model === 'gemini-3.5-pro'));
                              const userPlan = userProfile?.plan || 'Free';
                              const isLocked = !isModelAllowedForUser(m.id, userPlan);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      setIsModelDropdownOpen(false);
                                      const reqPlan = m.requiredPlan;
                                      showToast(`🔒 ${m.name} requires ${reqPlan} Plan. Upgrade to unlock.`);
                                      const targetAmount = reqPlan === 'MAX' ? '2499' : '999';
                                      setRazorpayPlanInfo({ planName: `AVO AI ${reqPlan} Plan`, amount: targetAmount });
                                      setIsUpgradeModalOpen(true);
                                      return;
                                    }

                                    setSettings((prev) => ({ ...prev, model: m.id }));
                                    setIsModelDropdownOpen(false);
                                    showToast(`Switched to ${m.name} (${m.tag})`);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl flex flex-col gap-1.5 transition-all cursor-pointer border ${
                                    isSelected 
                                      ? 'bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 shadow-xs' 
                                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {isLocked && <Lock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />}
                                      <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{m.name}</span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700/60">
                                        {m.tag}
                                      </span>
                                      {isLocked ? (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                          {m.requiredPlan}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                                  </div>

                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                                    {m.description}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap text-[10px] pt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50 truncate max-w-[200px]">
                                      🎯 {m.specialty}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 truncate max-w-[160px]">
                                      🧠 {m.thinkingStyle}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
            {/* Download All Images ZIP Button when chat panel contains multiple images */}
            {allGalleryImages.length >= 2 && (
              <button
                type="button"
                onClick={() => downloadImagesAsZip(allGalleryImages, `chat-images-${Date.now()}.zip`, showToast)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 border border-purple-500/50 shadow-xs transition-all duration-150 cursor-pointer active:scale-95 group"
                title={`Compress and download all ${allGalleryImages.length} images in this chat as a ZIP file`}
              >
                <Archive size={15} className="text-purple-200 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden md:inline font-sans">Download All ({allGalleryImages.length})</span>
                <span className="md:hidden font-sans">ZIP ({allGalleryImages.length})</span>
              </button>
            )}

            {/* Home Navigation Button on Header */}
            <button
              onClick={() => {
                if (onBackToWebsite) {
                  onBackToWebsite();
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 cursor-pointer shadow-xs active:scale-95 group"
              title="Return to Home"
            >
              <Home size={15} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0" />
              <span className="hidden sm:inline font-sans">Home</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 border ${
                isShareModalOpen ? 'border-blue-500/80 bg-zinc-200 dark:bg-zinc-800 shadow-xs' : 'border-zinc-200 dark:border-zinc-800'
              } hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer shadow-xs group`}
              title="Share conversation link or export history"
            >
              <Share2 size={15} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
              <span className="hidden sm:inline font-sans">Share</span>
              {isShareModalOpen && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] ring-2 ring-black" />
              )}
            </button>

            {/* Overflow Menu (...) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsOverflowMenuOpen(!isOverflowMenuOpen);
                }}
                className={`relative p-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 border ${
                  isOverflowMenuOpen
                    ? 'border-blue-500/80 bg-zinc-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 scale-[1.02] shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800'
                } hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer shadow-xs group`}
                title="More actions (Dark mode toggle, search history, stats, export)"
              >
                <MoreVertical size={16} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0" />
                {isOverflowMenuOpen && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] ring-2 ring-black" />
                )}
              </button>

              {/* Overflow Popup Menu - Dynamically Styled for Light & Dark Mode */}
              {isOverflowMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-2 z-50 text-xs text-zinc-900 dark:text-white animate-in fade-in zoom-in-95 duration-150 space-y-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Dedicated Dark Mode / Theme Toggle Row with Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer transition-colors font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDarkMode ? (
                        <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </div>
                    {/* Visual Switch Pill */}
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${isDarkMode ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsSearchHistoryOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Message History</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsStatsCardOpen(!isStatsCardOpen);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <BarChart3 className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Conversation Stats</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsChatSearchOpen(!isChatSearchOpen);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Search in chat</span>
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      handleExportConversation('markdown');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Export Transcript (.md)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      handleExportPDF();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <Download className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Export Transcript (.pdf)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      handleClearCurrentChat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span>Clear Conversation</span>
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsShortcutsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hidden sm:flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <Keyboard className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Keyboard shortcuts</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>



        {/* System Override Prompt Drawer */}
        {isSystemOverrideOpen && (
          <div className="px-6 py-3 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex flex-col gap-2 z-20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                <span>Conversation Custom Instructions</span>
              </div>
              <button
                onClick={() => setIsSystemOverrideOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <textarea
                rows={2}
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                placeholder="Custom persona/instructions for this conversation..."
                className="flex-1 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800/80 rounded-xl p-2.5 text-xs text-black dark:text-white outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveSystemOverride}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Apply Override
                </button>
                {activeConv?.systemOverride && (
                  <button
                    onClick={handleClearSystemOverride}
                    className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Clear Override
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stats Summary Card Drawer */}
        {isStatsCardOpen && conversationStats && (
          <div className="mx-3 sm:mx-4 my-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <BarChart3 className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider shrink-0">
                    Stats Card
                  </span>
                  {activeConv?.title && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal truncate">
                      ({activeConv.title})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsStatsCardOpen(false)}
                  className="sm:hidden p-1 -mr-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer shrink-0"
                  title="Close stats card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <button
                    onClick={() => handleExportConversation('markdown')}
                    className="flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Export transcript as Markdown .md file"
                  >
                    <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>Export .md</span>
                  </button>
                  <button
                    onClick={() => handleExportPDF()}
                    className="flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Export transcript as PDF document"
                  >
                    <Download className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>Export .pdf</span>
                  </button>
                </div>
                <button
                  onClick={() => setIsStatsCardOpen(false)}
                  className="hidden sm:flex p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer shrink-0"
                  title="Close stats card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Messages</div>
                <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {conversationStats.totalMessages}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {conversationStats.userCount} User • {conversationStats.assistantCount} AI
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estimated Tokens</div>
                <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  ~{conversationStats.estimatedTokens.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Prompt & Response Tokens</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Code Blocks</div>
                <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {conversationStats.totalCodeBlocks} {conversationStats.totalCodeBlocks === 1 ? 'Snippet' : 'Snippets'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Code block frequency</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Attachments</div>
                <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {conversationStats.totalAttachments} {conversationStats.totalAttachments === 1 ? 'File' : 'Files'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{conversationStats.interactionDuration}</div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Text Selection Popup Toolbar ("Ask AVO AI") */}
        {selectionPopup && (
          <div
            id="selection-popover"
            style={{
              position: 'fixed',
              left: `${Math.min(window.innerWidth - 240, Math.max(10, selectionPopup.x - 120))}px`,
              top: `${Math.max(10, selectionPopup.y - 46)}px`,
            }}
            className="z-[999] flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-800/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold text-white"
          >
            <button
              type="button"
              onClick={() => handleAskAvoFromSelection(selectionPopup.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <span>Ask AVO AI</span>
            </button>
            <button
              type="button"
              onClick={() => handleInsertSelectionToPrompt(selectionPopup.text)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition-all"
              title="Quote selection in prompt"
            >
              <SquarePen className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Quote</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(selectionPopup.text);
                showToast('Selection copied to clipboard');
                setSelectionPopup(null);
              }}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition-all"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {isChatSearchOpen && (
          <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 z-10 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-2xs">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) {
                      handlePrevMatch();
                    } else {
                      handleNextMatch();
                    }
                  }
                }}
                placeholder="Search messages in chat..."
                className="w-full text-xs bg-transparent text-black dark:text-white outline-none"
                autoFocus
              />
              {chatSearchQuery && (
                <button onClick={() => setChatSearchQuery('')} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsSearchHistoryOpen(true)}
              className="px-2.5 py-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors cursor-pointer shrink-0"
              title="Open Message History"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Message History</span>
            </button>

            {chatSearchQuery.trim() && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono font-medium bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                  {matchingMessages.length > 0 ? `Match ${currentSearchMatchIndex + 1} of ${matchingMessages.length}` : 'No matches'}
                </span>
                {matchingMessages.length > 0 && (
                  <div className="flex items-center gap-1 border-l border-zinc-300 dark:border-zinc-700 pl-2">
                    <button
                      onClick={handlePrevMatch}
                      className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                      title="Previous match (Shift+Enter)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMatch}
                      className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                      title="Next match (Enter)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { setIsChatSearchOpen(false); setChatSearchQuery(''); }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating Multi-Message Bulk Action Toolbar */}
        {selectedMsgIds.length > 0 && (
          <div className="sticky top-4 z-30 mx-auto max-w-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black border border-zinc-700 dark:border-zinc-300 rounded-2xl p-2.5 px-4 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">
                {selectedMsgIds.length}
              </span>
              <span>selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySelectedMessages}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Selected
              </button>
              <button
                onClick={handleDeleteSelectedMessages}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
              <button
                onClick={() => setSelectedMsgIds([])}
                className="p-1 text-zinc-400 hover:text-white dark:hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Feed Container (Scrollbar at side of website) */}
        <div 
          ref={chatFeedRef}
          onScroll={handleScroll}
          className="chat-feed-scroll flex-1 overflow-y-auto w-full relative"
          style={{
            overscrollBehaviorY: 'contain',
            scrollPaddingBottom: chatInputHeight ? `${chatInputHeight + 12}px` : '16px',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            ['--chat-input-height' as any]: `${chatInputHeight}px`,
          }}
        >
          <div className="max-w-[960px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeConvId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-4 sm:space-y-6 w-full relative flex-1 flex flex-col min-h-full"
              >
              {/* Copy Banner */}
              <AnimatePresence>
                {showCopyCodeBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="sticky top-2 z-40 mx-auto max-w-xs flex items-center justify-between gap-2.5 px-4 py-2 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xl text-xs font-semibold backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-zinc-200" />
                      <span>Code copied to clipboard!</span>
                    </div>
                    <button
                      onClick={() => setShowCopyCodeBanner(false)}
                      className="p-1 hover:bg-zinc-700 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>



              {/* Welcome Empty Screen - Focused ChatGPT layout matching screenshot */}
              {activeConv?.messages.length === 0 && (
                <div className="my-auto py-6 sm:py-16 text-center animate-in fade-in duration-300 max-w-2xl w-full mx-auto px-1 sm:px-4 flex flex-col items-center">
                  <h1 className="text-xl sm:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-6 sm:mb-8 text-center px-1">
                    {userGreetingName ? `Hey ${userGreetingName}, how can I assist you today?` : 'Hey, how can I assist you today?'}
                  </h1>

                  {/* Centered Input Box */}
                  <div className="w-full relative text-left">
                    {renderChatInput(true)}
                  </div>
                </div>
              )}

              {/* Messages list */}
              {activeConv?.messages.map((msg) => {
                const isStreaming = msg.role === 'assistant' && msg.status === 'streaming';
                const isSelected = selectedMsgIds.includes(msg.id);
                const isSearchMatch = chatSearchQuery.trim() && msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
                const isCurrentActiveMatch = isSearchMatch && matchingMessages[currentSearchMatchIndex]?.id === msg.id;
                const isEditingThisMsg = msg.role === 'user' && editingMsgId === msg.id;

                return (
                  <ChatMessageItem
                    key={msg.id}
                    msg={msg}
                    isStreaming={isStreaming}
                    isSelected={isSelected}
                    isSearchMatch={isSearchMatch}
                    isCurrentActiveMatch={isCurrentActiveMatch}
                    isEditingThisMsg={isEditingThisMsg}
                    editingText={editingText}
                    chatSearchQuery={chatSearchQuery}
                    copiedCodeId={copiedCodeId}
                    speakingMsgId={speakingMsgId}
                    loadingTtsMsgId={loadingTtsMsgId}
                    markdownComponents={markdownComponents}
                    handleSaveEditedMessage={handleSaveEditedMessage}
                    setEditingMsgId={setEditingMsgId}
                    setEditingText={setEditingText}
                    handlePreviewImage={handlePreviewImage}
                    setOpenThreadMsgId={setOpenThreadMsgId}
                    handleCopyText={handleCopyText}
                    handleReaction={handleReaction}
                    setIsShareModalOpen={setIsShareModalOpen}
                    handleRegenerateResponse={handleRegenerateResponse}
                    handleSpeakText={handleSpeakText}
                    getSuggestions={getSuggestions}
                    handleSendMessage={handleSendMessage}
                    renderHighlightedText={renderHighlightedText}
                    isGenerating={isGenerating}
                    activeConvThreads={activeConv?.threads}
                    onOpenGalleryWithList={handleOpenGalleryWithList}
                    showToast={showToast}
                  />
                );
              })}

              <div ref={messagesEndRef} />
            </motion.div>
          </AnimatePresence>
          </div>
        </div>

        {/* Sticky Input Dock Bar (Shown only when conversation has messages) */}
        {activeConv?.messages && activeConv.messages.length > 0 && (
          <div 
            ref={chatInputContainerRef}
            className="z-20 px-2.5 sm:px-4 py-2 sm:py-3.5 bg-white sm:bg-white/95 dark:bg-black sm:dark:bg-black/95 sm:backdrop-blur-md flex-shrink-0"
          >
            <div className="max-w-[768px] w-full mx-auto relative">
              <AnimatePresence>
                {showScrollToBottom && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    onClick={() => {
                      isNearBottomRef.current = true;
                      scrollToBottom(true);
                    }}
                    className="absolute right-0 -top-12 z-30 p-2.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  </motion.button>
                )}
              </AnimatePresence>
              {renderChatInput(false)}
              <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2 font-normal">
                Avo AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Side Thread Slide-Over Drawer Panel */}
      <AnimatePresence>
        {openThreadMsgId && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full sm:w-80 lg:w-96 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full z-30 shrink-0 shadow-2xl absolute right-0 top-0 bottom-0 sm:relative"
          >
            {/* Thread Drawer Header */}
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-black flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Side Thread</h3>
                  <p className="text-[10px] text-zinc-400 truncate">Follow-up discussion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenThreadMsgId(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                title="Close Thread"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parent Message Quote Preview */}
            {activeConv?.messages.find((m) => m.id === openThreadMsgId) && (
              <div className="p-3 bg-zinc-100/90 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 flex-shrink-0">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3 text-zinc-400" /> Responding to:
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3 italic leading-relaxed">
                  "{activeConv.messages.find((m) => m.id === openThreadMsgId)?.content}"
                </p>
              </div>
            )}

            {/* Thread Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(!activeConv?.threads?.[openThreadMsgId] || activeConv.threads[openThreadMsgId].length === 0) ? (
                <div className="text-center py-12 text-xs text-zinc-400 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">No thread replies yet</p>
                  <p className="text-[11px] text-zinc-400 max-w-[200px] mx-auto">Ask a focused follow-up question below without polluting the main conversation.</p>
                </div>
              ) : (
                activeConv.threads[openThreadMsgId].map((tMsg) => (
                  <div
                    key={tMsg.id}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      tMsg.role === 'user'
                        ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 ml-6 rounded-br-xs shadow-2xs'
                        : 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 mr-4 shadow-2xs'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-70 mb-1 flex items-center justify-between">
                      <span className="font-bold">{tMsg.role === 'user' ? 'You' : 'AVO AI'}</span>
                      <span>{tMsg.timestamp}</span>
                    </div>
                    {tMsg.role === 'assistant' && !tMsg.content && tMsg.status === 'streaming' ? (
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 py-1 text-xs font-medium">
                        <NexusLogoIcon size="xs" animate={true} />
                        <span className="animate-pulse font-sans font-semibold">Analyzing...</span>
                      </div>
                    ) : (
                      <div className="prose-chat max-w-none text-xs">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                          urlTransform={(url) => url}
                        >
                          {normalizeMarkdownImages(tMsg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Thread Input Area */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendThreadMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={threadInput}
                  onChange={(e) => setThreadInput(e.target.value)}
                  placeholder="Reply in side thread..."
                  className="flex-1 px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!threadInput.trim() || isSendingThread}
                  className="p-2 bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 disabled:opacity-30 text-white dark:text-zinc-900 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="Send reply"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette Modal (Cmd/Ctrl + K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* Search Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <Command className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={cmdPaletteQuery}
                onChange={(e) => setCmdPaletteQuery(e.target.value)}
                placeholder="Type a command or search actions (e.g. New chat, Settings, Folders)..."
                className="w-full text-sm bg-transparent text-black dark:text-white outline-none placeholder-zinc-400"
                autoFocus
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
              {[
                {
                  id: 'system-override',
                  label: activeConv?.systemOverride ? 'Edit Active System Override Prompt ⚡' : 'Inject Temporary System Override Prompt',
                  icon: <Sliders className="w-4 h-4 text-amber-500" />,
                  action: () => {
                    setOverrideInput(activeConv?.systemOverride || '');
                    setIsSystemOverrideOpen(true);
                    setIsCommandPaletteOpen(false);
                  }
                },
                {
                  id: 'keyboard-shortcuts',
                  label: 'View Keyboard Shortcuts Cheat Sheet',
                  icon: <Keyboard className="w-4 h-4 text-amber-500" />,
                  action: () => { setIsShortcutsOpen(true); setIsCommandPaletteOpen(false); }
                },
                {
                  id: 'new-chat',
                  label: 'New Conversation',
                  icon: <Plus className="w-4 h-4 text-zinc-400" />,
                  action: () => { handleNewChat(); setIsCommandPaletteOpen(false); }
                },
                {
                  id: 'preferences',
                  label: 'Open Preferences & Settings',
                  icon: <Settings className="w-4 h-4 text-violet-500" />,
                  action: () => { setIsSettingsOpen(true); setIsCommandPaletteOpen(false); }
                },
                {
                  id: 'export-pdf',
                  label: 'Export Chat to PDF',
                  icon: <Download className="w-4 h-4 text-zinc-400" />,
                  action: () => { handleExportPDF(); setIsCommandPaletteOpen(false); }
                },
                {
                  id: 'clear-chat',
                  label: 'Clear Conversation History',
                  icon: <Trash2 className="w-4 h-4 text-rose-500" />,
                  action: () => { handleClearCurrentChat(); setIsCommandPaletteOpen(false); }
                },
                {
                  id: 'toggle-theme',
                  label: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`,
                  icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />,
                  action: () => { onToggleTheme(); setIsCommandPaletteOpen(false); }
                }
              ]
                .concat(
                  folders.map((f) => ({
                    id: `folder-${f.id}`,
                    label: `Switch Folder: ${f.name}`,
                    icon: <Folder className="w-4 h-4 text-amber-500" />,
                    action: () => {
                      if (f.id) handleNewChat(f.id);
                      setIsCommandPaletteOpen(false);
                    }
                  }))
                )
                .filter((item) => item.label.toLowerCase().includes(cmdPaletteQuery.toLowerCase()))
                .map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between text-left text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 font-medium">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                      Execute
                    </span>
                  </button>
                ))}
            </div>

            <div className="hidden sm:flex px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-black/50 text-[10px] text-zinc-400 items-center justify-between">
              <span>Tip: Press <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono">Esc</kbd> or click outside to dismiss</span>
              <span className="font-mono">Shortcut: ⌘K</span>
            </div>

          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Add Account to Session Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5 text-white">
            <button
              type="button"
              onClick={() => setIsAddAccountModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <UserPlus className="w-4 h-4" />
                <span>Multi-Account Management</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">Add Account to Session</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Link another email account to your active session. You can seamlessly switch between linked accounts at any time.
              </p>
            </div>

            {addAccountError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium">
                {addAccountError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addAccountEmail.trim() || !addAccountEmail.includes('@')) {
                  setAddAccountError('Please enter a valid email.');
                  return;
                }
                setIsSubmittingNewAccount(true);
                setAddAccountError(null);
                try {
                  const pwd = addAccountPassword.trim() || 'DemoUser@2026';
                  const name = addAccountName.trim() || addAccountEmail.split('@')[0];
                  const newProf = await signUpWithEmail(name, addAccountEmail.trim(), pwd);
                  if (newProf) {
                    showToast(`Added account ${newProf.email}`);
                    setIsAddAccountModalOpen(false);
                    setAddAccountEmail('');
                    setAddAccountPassword('');
                    setAddAccountName('');
                  }
                } catch (err: any) {
                  try {
                    const existing = await signInWithEmail(addAccountEmail.trim(), addAccountPassword.trim() || 'DemoUser@2026');
                    if (existing) {
                      showToast(`Linked account ${existing.email}`);
                      setIsAddAccountModalOpen(false);
                      setAddAccountEmail('');
                      setAddAccountPassword('');
                      setAddAccountName('');
                    }
                  } catch (fallbackErr: any) {
                    setAddAccountError(err.message || fallbackErr.message || 'Failed to add account.');
                  }
                } finally {
                  setIsSubmittingNewAccount(false);
                }
              }}
              className="space-y-3"
            >
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={addAccountName}
                    onChange={(e) => setAddAccountName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addAccountEmail}
                    onChange={(e) => setAddAccountEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    value={addAccountPassword}
                    onChange={(e) => setAddAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingNewAccount}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNewAccount ? 'Linking...' : 'Add Account'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Dedicated Interactive Modals */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(file) => {
          processUploadedFiles([file]);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateSettingsAndApplyEffects}
        onShowToast={showToast}
        onToggleTheme={onToggleTheme}
        isDarkMode={isDarkMode}
        onClearAllChats={handleClearAllChatHistory}
        onOpenRazorpay={(planName, amount) => {
          setIsSettingsOpen(false);
          setRazorpayPlanInfo({ planName, amount });
          setIsRazorpayModalOpen(true);
        }}
        userPlan={userProfile?.plan || 'Free'}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        targetPlan={razorpayPlanInfo?.planName}
        onUpgradeSuccess={(planName) => {
          showToast(`Successfully upgraded to ${planName}! Pro Code Sandbox unlocked.`);
        }}
        onOpenRazorpay={(planName, amount) => {
          setIsUpgradeModalOpen(false);
          setRazorpayPlanInfo({ planName, amount });
          setIsRazorpayModalOpen(true);
        }}
        onOpenSeparatePricingPage={() => {
          setIsUpgradeModalOpen(false);
          navigate('/pricing');
        }}
      />

      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        folders={folders}
        conversations={conversations.map(c => ({
          id: c.id,
          title: c.title,
          folderId: c.folderId,
          updatedAt: c.updatedAt
        }))}
        onCreateFolder={(name, color) => {
          const newF = { id: `f-${Date.now()}`, name, color, isCollapsed: false };
          setFolders(prev => [...prev, newF]);
          showToast(`Created project space "${name}"`);
        }}
        onSelectConversation={(id) => {
          setActiveConvId(id);
          showToast('Switched conversation thread');
        }}
      />

      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        systemPrompt={activeConv?.systemOverride || ''}
        onSaveSystemPrompt={(prompt) => {
          setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, systemOverride: prompt } : c));
        }}
        codeTheme={settings.codeTheme}
        onSaveCodeTheme={(theme) => {
          setSettings(prev => ({ ...prev, codeTheme: theme as CodeThemeId }));
        }}
        showToast={showToast}
      />

      <ArtifactsModal
        isOpen={isArtifactsModalOpen}
        onClose={() => setIsArtifactsModalOpen(false)}
        showToast={showToast}
      />

      <DesignStudioModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        onGenerateDesign={(prompt) => {
          handleNewChat();
          setTimeout(() => {
            handleSendMessage(prompt);
          }, 100);
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        conversationTitle={activeConv?.title || 'AVO AI Workspace Thread'}
        messages={activeConv?.messages.map(m => ({
          role: m.role,
          content: m.content
        })) || []}
        showToast={showToast}
      />

      <RazorpayPaymentModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        planName={razorpayPlanInfo.planName}
        amount={razorpayPlanInfo.amount}
        onPaymentSuccess={(paymentId) => {
          const upper = razorpayPlanInfo.planName.toUpperCase();
          const targetPlan = upper.includes('MAX') ? 'Max' : upper.includes('BUSINESS') ? 'Business' : 'Pro';
          updateUserPlan(targetPlan);
          showToast(`🎉 Payment successful (ID: ${paymentId})! Subscribed to ${razorpayPlanInfo.planName}.`);
        }}
      />

      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={() => setPreviewImage(prev => ({ ...prev, isOpen: false }))}
        imageUrl={previewImage.url}
        prompt={previewImage.prompt}
        aspectRatio={previewImage.aspectRatio}
        style={previewImage.style}
        showToast={showToast}
        onImageUpdated={(newUrl) => setPreviewImage(prev => ({ ...prev, url: newUrl }))}
      />

      <ImageGalleryModal
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))}
        images={galleryState.images}
        initialIndex={galleryState.initialIndex}
        showToast={showToast}
        onSendMessage={handleSendMessage}
      />

      {/* Confirmation Dialog for Clearing Active Conversation */}
      <AnimatePresence>
        {isClearConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Clear Conversation History?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Are you sure you want to clear all messages in <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{activeConv?.title || 'this chat'}"</span>? This action will erase the current chat history.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearCurrentChat}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchHistoryModal
        isOpen={isSearchHistoryOpen}
        onClose={() => setIsSearchHistoryOpen(false)}
        activeConversation={activeConv}
        conversations={conversations}
        onJumpToMessage={handleJumpToMessage}
        onUseAsPrompt={handleUsePromptFromHistory}
        onDeleteMessage={handleDeleteMessageFromHistory}
        onShowToast={showToast}
      />

    </div>
  );
};
