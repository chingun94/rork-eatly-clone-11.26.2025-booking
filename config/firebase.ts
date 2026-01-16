import { initializeApp, getApps, getApp as getFirebaseApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, enableNetwork } from 'firebase/firestore';
import { getStorage as getFirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyA0pWGIav6WLKMeEhq-p5q-GsNfE69HLuk',
  authDomain: 'eatly-dev-f4f83.firebaseapp.com',
  projectId: 'eatly-dev-f4f83',
  storageBucket: 'eatly-dev-f4f83.firebasestorage.app',
  messagingSenderId: '1048705518768',
  appId: '1:1048705518768:web:7ee7ca36118c9869da3f75',
  measurementId: 'G-DD9BV32S63',
};

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getFirebaseAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let storage: ReturnType<typeof getFirebaseStorage> | undefined;
let isFirebaseReady = false;
let initPromise: Promise<void> | undefined;

function initFirebaseSync() {
  if (isFirebaseReady) {
    return;
  }

  if (initPromise) {
    return;
  }

  try {
    console.log('Firebase: Starting lazy initialization...');
    
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getFirebaseApp();
    }
    
    if (Platform.OS === 'web') {
      try {
        auth = initializeAuth(app, {
          persistence: [browserLocalPersistence],
        });
        console.log('Firebase: Web auth initialized with persistence');
      } catch (error: any) {
        if (error.code === 'auth/already-initialized') {
          auth = getFirebaseAuth(app);
          console.log('Firebase: Web auth already initialized, using existing instance');
        } else {
          console.error('Firebase: Web auth initialization error:', error);
          auth = getFirebaseAuth(app);
        }
      }
      
      db = getFirestore(app);
      
      setTimeout(() => {
        if (db) {
          enableMultiTabIndexedDbPersistence(db).catch((error: any) => {
            console.warn('Firebase: Persistence error:', error.code);
          });
        }
      }, 100);
    } else {
      try {
        auth = getFirebaseAuth(app);
        console.log('Firebase: Native auth initialized using default getAuth');
      } catch (error: any) {
        console.error('Firebase: Native auth initialization error:', error);
        auth = getFirebaseAuth(app);
      }
      
      db = getFirestore(app);
      console.log('Firebase: Firestore initialized for native platform');
    }
    
    storage = getFirebaseStorage(app);
    isFirebaseReady = true;
    console.log('Firebase: Lazy initialization complete');
  } catch (error) {
    console.error('Firebase: Initialization error:', error);
  }
}

export function getApp() {
  if (!isFirebaseReady) {
    initFirebaseSync();
  }
  return app;
}

export function getAuth() {
  if (!isFirebaseReady) {
    initFirebaseSync();
  }
  return auth;
}

export function getDb() {
  if (!isFirebaseReady) {
    initFirebaseSync();
  }
  return db;
}

export function getStorage() {
  if (!isFirebaseReady) {
    initFirebaseSync();
  }
  return storage;
}

export function isReady() {
  return isFirebaseReady;
}

export async function waitForFirebase(timeout = 2000): Promise<void> {
  if (isFirebaseReady) {
    return;
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkReady = () => {
      if (isFirebaseReady) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        console.warn('Firebase: Initialization timeout, proceeding anyway');
        resolve();
        return;
      }
      
      setTimeout(checkReady, 50);
    };
    
    checkReady();
  });
}

export async function ensureNetworkEnabled() {
  if (!db) {
    console.error('Firebase: Cannot enable network, Firestore not initialized');
    return false;
  }
  try {
    console.log('Firebase: Ensuring network is enabled...');
    const networkPromise = enableNetwork(db);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network enable timeout')), 3000)
    );
    await Promise.race([networkPromise, timeoutPromise]);
    console.log('Firebase: Network enabled successfully');
    return true;
  } catch (error: any) {
    console.error('Firebase: Error enabling network:', error);
    return false;
  }
}

export { app, auth, db, storage };
