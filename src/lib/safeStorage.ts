import { Conversation, Attachment } from '../types';

/**
 * Safely writes a key-value pair to localStorage with fallback handling for QuotaExceededError.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // If quota exceeded, clean up non-essential temporary items and retry
    try {
      cleanupStorageSpace();
      localStorage.setItem(key, value);
      return true;
    } catch (secondErr) {
      // Return false silently so application functionality is never interrupted
      return false;
    }
  }
}

/**
 * Safely gets an item from localStorage without throwing errors.
 */
export function safeLocalStorageGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Removes non-essential temporary items from localStorage to reclaim space.
 */
export function cleanupStorageSpace(): void {
  try {
    // Remove draft attachments and temporary search histories first
    localStorage.removeItem('nexus_ai_draft_attachments');
    localStorage.removeItem('nexus_search_history');

    // Clean up temporary keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('nexus_chats_') && k.endsWith('_old'))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

/**
 * Strips or truncates huge base64 data URLs in attachments for lightweight localStorage caching.
 * Real attachment data remains intact in memory and remote Firestore database!
 */
export function sanitizeAttachmentsForStorage(attachments: Attachment[]): Attachment[] {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((att) => {
    let sanitizedUrl = att.url || '';
    let sanitizedData = att.data || '';

    // If url or data is a huge base64 string (> 30KB), prune the heavy base64 payload for localStorage cache
    if (sanitizedUrl.startsWith('data:') && sanitizedUrl.length > 30000) {
      sanitizedUrl = '[cached_file_attachment]';
    }
    if (sanitizedData.length > 30000) {
      sanitizedData = '';
    }

    return {
      ...att,
      url: sanitizedUrl,
      data: sanitizedData,
    };
  });
}

/**
 * Sanitizes conversation objects for localStorage to ensure they stay well under the ~5MB quota.
 */
export function sanitizeConversationsForStorage(conversations: Conversation[]): Conversation[] {
  if (!Array.isArray(conversations)) return [];

  return conversations.map((conv) => {
    const sanitizedMessages = (conv.messages || []).map((msg) => {
      let sanitizedContent = msg.content || '';
      // Truncate extremely long inline string data if over 80KB in a single message
      if (sanitizedContent.length > 80000) {
        sanitizedContent = sanitizedContent.slice(0, 80000) + '... [truncated for local storage cache]';
      }

      const sanitizedAttachments = msg.attachments ? sanitizeAttachmentsForStorage(msg.attachments) : undefined;

      return {
        ...msg,
        content: sanitizedContent,
        attachments: sanitizedAttachments,
      };
    });

    return {
      ...conv,
      messages: sanitizedMessages,
    };
  });
}

/**
 * Safely persists conversations to localStorage by sanitizing large base64 data and trying setItem.
 */
export function safeStoreConversations(key: string, conversations: Conversation[]): boolean {
  try {
    const jsonString = JSON.stringify(conversations);
    // If json payload is reasonable (< 1MB), try storing directly
    if (jsonString.length < 1000000) {
      if (safeLocalStorageSetItem(key, jsonString)) {
        return true;
      }
    }

    // If large or setItem failed, sanitize heavy base64/data URLs
    const sanitized = sanitizeConversationsForStorage(conversations);
    const sanitizedJson = JSON.stringify(sanitized);

    if (safeLocalStorageSetItem(key, sanitizedJson)) {
      return true;
    }

    // If still failing, store only recent 15 conversations in local cache
    const recentConvs = sanitized.slice(0, 15);
    return safeLocalStorageSetItem(key, JSON.stringify(recentConvs));
  } catch (err) {
    // Silently handle error so app execution is smooth
    return false;
  }
}
