import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();
const databaseId =
  firebaseConfigJson.firestoreDatabaseId &&
  firebaseConfigJson.firestoreDatabaseId !== '' &&
  firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? firebaseConfigJson.firestoreDatabaseId
    : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export const isFirestoreQuotaExhausted = () => false;
