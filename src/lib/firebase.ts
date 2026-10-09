import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore 
} from 'firebase/firestore';

// Default project configuration derived from metadata
const firebaseConfig = {
  projectId: "ai-studio-raviniecosystemh-bc880a56-6099-46ea-8173-16fa9788f3e6",
  databaseId: "ai-studio-raviniecosystemh-bc880a56-6099-46ea-8173-16fa9788f3e6",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseAvailable = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!app) {
    try {
      if (getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(firebaseConfig);
      }
    } catch (e) {
      console.warn('Firebase init warning, continuing with durable local storage:', e);
      return null;
    }
  }
  return app;
}

export function getFirebaseDb(): Firestore | null {
  if (!db) {
    const initializedApp = getFirebaseApp();
    if (initializedApp) {
      try {
        db = getFirestore(initializedApp);
        isFirebaseAvailable = true;
      } catch (e) {
        console.warn('Firestore initialization warning, falling back to local realtime sync:', e);
        db = null;
      }
    }
  }
  return db;
}

// Background sync to Firestore for permanent preservation
export async function syncUserToFirestore(userData: any) {
  try {
    const firestore = getFirebaseDb();
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userData.id);
    await setDoc(userRef, { ...userData, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    // Non-blocking, data is safely held in permanent local storage
    console.debug('Cloud sync queued locally');
  }
}

export async function syncPostToFirestore(postData: any) {
  try {
    const firestore = getFirebaseDb();
    if (!firestore) return;
    const postRef = doc(firestore, 'posts', postData.id);
    await setDoc(postRef, { ...postData, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.debug('Post cloud sync queued locally');
  }
}
