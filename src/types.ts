export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'web_search' | 'deep_research' | 'chat_search' | 'general_query';
  timestamp: string;
  formattedTime?: string;
  conversationId?: string;
  conversationTitle?: string;
  isPinned?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'pdf';
  url: string;
  size?: string;
  mimeType?: string;
  data?: string; // base64 string
}

export interface CouncilLog {
  model: string;
  provider: string;
  status: 'analyzed' | 'compared' | 'verified';
  summary?: string;
}

export interface ConfidenceData {
  score: number; // 0 - 100
  level: 'High' | 'Moderate' | 'Low';
  reason?: string;
}

export interface GoBeyondSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category?: 'coding' | 'learning' | 'business' | 'general' | 'math';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  isLiked?: boolean | null; // true = liked, false = disliked, null = none
  isCopied?: boolean;
  isSeen?: boolean; // Seen indicator once rendered in UI
  // Multi-Model Orchestration Metadata
  mode?: 'fast' | 'smart' | 'deep';
  category?: string;
  councilLogs?: CouncilLog[];
  confidence?: ConfidenceData;
  goBeyond?: GoBeyondSuggestion[];
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  isCollapsed?: boolean;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  category: 'today' | 'yesterday' | 'previous_7_days' | 'older';
  messages: ChatMessage[];
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[]; // array of tag IDs
  folderId?: string | null;
  summary?: string; // Auto-generated 1-sentence summary
  systemOverride?: string; // Conversation-level temporary system instruction override
  threads?: Record<string, ChatMessage[]>; // Side-threads indexed by parent message ID
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Free' | 'Pro' | 'Max' | 'Business' | 'Enterprise' | string;
  role?: 'user' | 'admin' | 'super_admin';
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  isPopular?: boolean;
  features: string[];
  cta: string;
}

import { CodeThemeId } from './utils/codeThemes';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface AppSettings {
  model: string;
  selectedMode?: 'fast' | 'smart' | 'deep';
  effortLevel?: 'low' | 'medium' | 'high' | 'ultra';
  systemPrompt: string;
  temperature: number;
  soundEffects: boolean;
  autoScroll: boolean;
  theme: 'light' | 'dark' | 'system';
  voiceName?: string; // 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
  voicePitch?: 'low' | 'medium' | 'high';
  voiceSpeed?: number; // e.g. 0.5, 1.0, 1.25, 1.5, 2.0
  voiceVolume?: number; // 0.0 to 1.0
  bgPattern?: 'none' | 'dots' | 'grid' | 'cross';
  codeTheme?: CodeThemeId;
  appearance?: 'system' | 'dark' | 'light';
  contrast?: 'system' | 'standard' | 'high';
  accentColor?: 'default' | 'blue' | 'purple' | 'green' | 'amber';
  language?: string;
  higherIntelligence?: boolean;
  enableDictation?: boolean;
  desktopPushAlerts?: boolean;
  googleSearchGrounding?: boolean;
  codeInterpreter?: boolean;
  improveModel?: boolean;
  safeSearch?: boolean;
  parentalFilter?: boolean;
  trustedContact?: string;
}
