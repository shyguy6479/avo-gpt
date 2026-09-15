import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  db,
  isFirestoreQuotaExhausted,
  recordFirestoreQuotaExhausted,
  checkIsQuotaError
} from '../lib/firebase';
import { Conversation, Folder as FolderType, UserProfile } from '../types';
import {
  safeLocalStorageSetItem,
  safeStoreConversations
} from '../lib/safeStorage';

export function useFirestoreChats(
  user: UserProfile | null,
  defaultConversations: Conversation[],
  defaultFolders: FolderType[]
) {
  const getInitialConversations = (u: UserProfile | null): Conversation[] => {
    if (u?.email) {
      const cacheKey = `nexus_chats_${u.email.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return [];
    }
    const guestCached = localStorage.getItem('nexus_chats_guest');
    if (guestCached) {
      try {
        const parsed = JSON.parse(guestCached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultConversations;
  };

  const getInitialFolders = (u: UserProfile | null): FolderType[] => {
    if (u?.email) {
      const cacheKey = `nexus_folders_${u.email.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return [];
    }
    const guestCached = localStorage.getItem('nexus_folders_guest');
    if (guestCached) {
      try {
        const parsed = JSON.parse(guestCached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultFolders;
  };

  const [conversations, setConversationsState] = useState<Conversation[]>(() =>
    getInitialConversations(user)
  );

  const [folders, setFoldersState] = useState<FolderType[]>(() =>
    getInitialFolders(user)
  );

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(() => !isFirestoreQuotaExhausted());

  const isRemoteUpdateRef = useRef<boolean>(false);
  const lastPersistedStateRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUserEmail = user?.email ? user.email.toLowerCase() : null;
  const userDocId = cleanUserEmail ? cleanUserEmail.replace(/[^a-z0-9]/g, '_') : 'guest_session';

  // Synchronize state immediately whenever active user changes
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    lastPersistedStateRef.current = '';

    setConversationsState(getInitialConversations(user));
    setFoldersState(getInitialFolders(user));
  }, [cleanUserEmail]);

  // 1. Listen for real-time changes from Firestore onSnapshot if quota is active
  useEffect(() => {
    if (!cleanUserEmail || !db || isFirestoreQuotaExhausted()) {
      setIsFirestoreConnected(false);
      return;
    }

    const chatDocRef = doc(db, 'chats', userDocId);

    const unsubscribe = onSnapshot(
      chatDocRef,
      (snapshot) => {
        setIsFirestoreConnected(true);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.conversations && Array.isArray(data.conversations)) {
            isRemoteUpdateRef.current = true;
            setConversationsState(data.conversations);
            if (data.folders && Array.isArray(data.folders)) {
              setFoldersState(data.folders);
            }
            if (data.updatedAt) {
              setLastSyncedAt(data.updatedAt);
            }
            // Update local cache safely for this specific user
            safeStoreConversations(`nexus_chats_${cleanUserEmail}`, data.conversations);
            if (data.folders) {
              safeLocalStorageSetItem(`nexus_folders_${cleanUserEmail}`, JSON.stringify(data.folders));
            }
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 100);
          }
        } else {
          // Document does not exist yet for this user in Firestore.
          const localCache = localStorage.getItem(`nexus_chats_${cleanUserEmail}`);
          if (!localCache) {
            setConversationsState([]);
            setFoldersState([]);
          }
        }
      },
      (error) => {
        if (checkIsQuotaError(error)) {
          recordFirestoreQuotaExhausted(error);
        }
        setIsFirestoreConnected(false);
      }
    );

    return () => unsubscribe();
  }, [cleanUserEmail, userDocId]);

  // 2. Persist local changes to Firestore and LocalStorage
  const saveToFirestore = useCallback(
    async (nextConvs: Conversation[], nextFolders: FolderType[]) => {
      // Local caching is always user-isolated and synchronous
      try {
        if (cleanUserEmail) {
          safeStoreConversations(`nexus_chats_${cleanUserEmail}`, nextConvs);
          safeLocalStorageSetItem(`nexus_folders_${cleanUserEmail}`, JSON.stringify(nextFolders));
        } else {
          safeStoreConversations('nexus_chats_guest', nextConvs);
          safeLocalStorageSetItem('nexus_folders_guest', JSON.stringify(nextFolders));
        }
      } catch (e) {
        // Silently ignore local storage cache errors
      }

      // If Firestore write quota is exhausted, skip remote write completely
      if (isFirestoreQuotaExhausted()) {
        setIsFirestoreConnected(false);
        return;
      }

      // Check if data actually changed to avoid duplicate writes
      const currentSignature = `${nextConvs.length}_${nextConvs[0]?.messages?.length || 0}_${nextFolders.length}`;
      if (lastPersistedStateRef.current === currentSignature && nextConvs.length > 0) {
        return;
      }

      // Firestore persistence
      if (cleanUserEmail && db && !isRemoteUpdateRef.current) {
        setIsSyncing(true);
        try {
          const chatDocRef = doc(db, 'chats', userDocId);
          const now = new Date().toISOString();
          await setDoc(
            chatDocRef,
            {
              userId: cleanUserEmail,
              conversations: nextConvs,
              folders: nextFolders,
              updatedAt: now
            },
            { merge: true }
          );
          lastPersistedStateRef.current = currentSignature;
          setLastSyncedAt(now);
          setIsFirestoreConnected(true);
        } catch (err: any) {
          if (checkIsQuotaError(err)) {
            recordFirestoreQuotaExhausted(err);
          }
          setIsFirestoreConnected(false);
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [cleanUserEmail, userDocId]
  );

  const setConversations = useCallback(
    (updater: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
      setConversationsState((prev) => {
        const nextConvs = typeof updater === 'function' ? updater(prev) : updater;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveToFirestore(nextConvs, folders);
        }, 1500);
        return nextConvs;
      });
    },
    [folders, saveToFirestore]
  );

  const setFolders = useCallback(
    (updater: FolderType[] | ((prev: FolderType[]) => FolderType[])) => {
      setFoldersState((prev) => {
        const nextFolders = typeof updater === 'function' ? updater(prev) : updater;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveToFirestore(conversations, nextFolders);
        }, 1500);
        return nextFolders;
      });
    },
    [conversations, saveToFirestore]
  );

  const clearAllChats = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // 1. Reset React state immediately
    setConversationsState([]);
    setFoldersState([]);

    // 2. Wipe local storage keys for this user
    try {
      localStorage.removeItem('nexus_conversations');
      localStorage.removeItem('nexus_folders');
      localStorage.removeItem('nexus_ai_draft_input');
      localStorage.removeItem('nexus_ai_draft_attachments');

      if (cleanUserEmail) {
        localStorage.removeItem(`nexus_chats_${cleanUserEmail}`);
        localStorage.removeItem(`nexus_folders_${cleanUserEmail}`);
      } else {
        localStorage.removeItem('nexus_chats_guest');
        localStorage.removeItem('nexus_folders_guest');
      }
    } catch (e) {
      console.error('LocalStorage clear error:', e);
    }

    // 3. Clear remote Firestore doc if user is signed in
    if (cleanUserEmail && db && !isFirestoreQuotaExhausted()) {
      setIsSyncing(true);
      try {
        const chatDocRef = doc(db, 'chats', userDocId);
        const now = new Date().toISOString();
        await setDoc(
          chatDocRef,
          {
            userId: cleanUserEmail,
            conversations: [],
            folders: [],
            updatedAt: now
          },
          { merge: false }
        );
        lastPersistedStateRef.current = '0_0_0';
        setLastSyncedAt(now);
        setIsFirestoreConnected(true);
      } catch (err: any) {
        if (checkIsQuotaError(err)) {
          recordFirestoreQuotaExhausted(err);
        }
        setIsFirestoreConnected(false);
      } finally {
        setIsSyncing(false);
      }
    } else {
      lastPersistedStateRef.current = '0_0_0';
    }
  }, [cleanUserEmail, userDocId]);

  return {
    conversations,
    setConversations,
    folders,
    setFolders,
    isSyncing,
    lastSyncedAt,
    isFirestoreConnected,
    clearAllChats
  };
}
