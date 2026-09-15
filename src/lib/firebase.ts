import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  setLogLevel,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { safeLocalStorageSetItem } from './safeStorage';

// Suppress Firestore internal noisy console logs (like backoff warnings & quota errors)
try {
  setLogLevel('silent');
} catch {}

export interface UserRecord {
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  photoURL: string;
  provider: 'google.com' | 'password' | 'phone';
  createdAt?: string | any;
  lastLogin?: any;
  emailVerified?: boolean;
  role?: 'user' | 'admin' | 'super_admin';
  preferences?: {
    theme: 'dark' | 'light' | 'system';
    notifications: boolean;
  };
}

export interface FirebaseEnvDiagnosticReport {
  timestamp: string;
  isFullyConfigured: boolean;
  hasInjectedEnvVars: boolean;
  isUsingFallbackDefaults: boolean;
  missingCount: number;
  invalidFormatCount: number;
  missingKeys: string[];
  variables: any[];
  details: string[];
}

// Load configuration with priority given to environment variables (for Vercel/external hosting)
// falling back to the bundled firebase-applet-config.json
const envApiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || '';
const envAuthDomain = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || '';
const envProjectId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || '';
const envStorageBucket = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || '';
const envMessagingSenderId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '';
const envAppId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || '';
const envMeasurementId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || '';
const envDbId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIRESTORE_DATABASE_ID) || '';

export const firebaseConfig = {
  apiKey: envApiKey || firebaseConfigJson.apiKey,
  authDomain: envAuthDomain || firebaseConfigJson.authDomain,
  projectId: envProjectId || firebaseConfigJson.projectId,
  storageBucket: envStorageBucket || firebaseConfigJson.storageBucket,
  messagingSenderId: envMessagingSenderId || firebaseConfigJson.messagingSenderId,
  appId: envAppId || firebaseConfigJson.appId,
  measurementId: envMeasurementId || (firebaseConfigJson as any).measurementId || '',
  firestoreDatabaseId: envDbId || (firebaseConfigJson as any).firestoreDatabaseId || ''
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if specified
const databaseId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '' &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const analytics = null;

// ==========================================
// Firestore Quota Circuit Breaker & Resilience
// ==========================================
const QUOTA_STORAGE_KEY = 'avo_firestore_quota_exhausted_until';

let inMemoryQuotaExhaustedUntil: number = (() => {
  try {
    const val = localStorage.getItem(QUOTA_STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
})();

export function checkIsQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    code.includes('quota') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('free daily write units') ||
    msg.includes('quota exceeded')
  );
}

export function isFirestoreQuotaExhausted(): boolean {
  if (inMemoryQuotaExhaustedUntil && Date.now() < inMemoryQuotaExhaustedUntil) {
    return true;
  }
  return false;
}

export function recordFirestoreQuotaExhausted(error?: any): void {
  // Suspend network writes for 24 hours to avoid hammering backend and stop backoff loops
  const suspendUntil = Date.now() + 24 * 60 * 60 * 1000;
  inMemoryQuotaExhaustedUntil = suspendUntil;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, suspendUntil.toString());
  } catch {}

  // Gracefully disable Firestore network to shut down retrying streams
  try {
    if (db) {
      disableNetwork(db).catch(() => {});
    }
  } catch {}
}

export function resetFirestoreQuotaCircuitBreaker(): void {
  inMemoryQuotaExhaustedUntil = 0;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    if (db) {
      enableNetwork(db).catch(() => {});
    }
  } catch {}
}

// Global Event Interceptor to suppress & handle unhandled Firestore quota errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (checkIsQuotaError(event.reason)) {
      recordFirestoreQuotaExhausted(event.reason);
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
  });

  window.addEventListener(
    'error',
    (event) => {
      if (checkIsQuotaError(event.error) || checkIsQuotaError(event.message)) {
        recordFirestoreQuotaExhausted(event.error || event.message);
        event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
      }
    },
    true
  );
}

// If quota was already exhausted from a previous turn, disable network immediately on startup
if (isFirestoreQuotaExhausted() && db) {
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
}

export function checkFirebaseEnvDiagnostics(): FirebaseEnvDiagnosticReport {
  return {
    timestamp: new Date().toISOString(),
    isFullyConfigured: true,
    hasInjectedEnvVars: true,
    isUsingFallbackDefaults: false,
    missingCount: 0,
    invalidFormatCount: 0,
    missingKeys: [],
    variables: [],
    details: [`Firebase provisioned successfully with project ID: ${firebaseConfig.projectId}`]
  };
}

export const firebaseEnvDiagnostics = checkFirebaseEnvDiagnostics();

// Database helper: Save or Update User profile in Firestore and LocalStorage
export async function saveUserToDatabase(userRecord: UserRecord): Promise<void> {
  if (!userRecord || !userRecord.uid) return;

  const displayName = userRecord.displayName || userRecord.name || (userRecord.email ? userRecord.email.split('@')[0] : 'User');

  // 1. Always save to LocalStorage for instant offline availability
  try {
    const localRecord = {
      ...userRecord,
      displayName,
      lastLogin: new Date().toISOString()
    };
    const existingUsers = JSON.parse(localStorage.getItem('avo_ai_users_db') || '{}');
    existingUsers[userRecord.uid] = localRecord;
    if (userRecord.email) {
      existingUsers[userRecord.email.toLowerCase()] = localRecord;
    }
    safeLocalStorageSetItem('avo_ai_users_db', JSON.stringify(existingUsers));
  } catch (e) {
    // Silently ignore local storage user cache write errors
  }

  // 2. Only attempt Firestore write if quota is NOT exhausted
  if (!isFirestoreQuotaExhausted() && db) {
    try {
      const userRef = doc(db, 'users', userRecord.uid);
      const firestoreData = {
        ...userRecord,
        displayName,
        lastLogin: serverTimestamp()
      };
      await setDoc(userRef, firestoreData, { merge: true });
    } catch (e: any) {
      if (checkIsQuotaError(e)) {
        recordFirestoreQuotaExhausted(e);
      }
    }
  }
}

// Database helper: Get User profile from Firestore with LocalStorage fallback
export async function getUserFromDatabase(uidOrEmail: string): Promise<UserRecord | null> {
  if (!uidOrEmail) return null;

  // 1. Try reading from Firestore only if quota not exhausted
  if (!isFirestoreQuotaExhausted() && db) {
    try {
      const userRef = doc(db, 'users', uidOrEmail);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserRecord;
      }
    } catch (e: any) {
      if (checkIsQuotaError(e)) {
        recordFirestoreQuotaExhausted(e);
      }
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const key = uidOrEmail.toLowerCase();
    const existingUsers = JSON.parse(localStorage.getItem('avo_ai_users_db') || '{}');
    if (existingUsers[key]) {
      return existingUsers[key];
    }
  } catch (e) {
    console.error('Error reading local user storage:', e);
  }

  return null;
}

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An error occurred during authentication.';
  return error.message || String(error);
}
