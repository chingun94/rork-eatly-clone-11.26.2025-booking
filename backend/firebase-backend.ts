import { initializeApp, getApps, getApp as getFirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
let db: ReturnType<typeof getFirestore> | undefined;

function initFirebase() {
  if (app) {
    return;
  }

  try {
    console.log('[Backend] Initializing Firebase...');
    
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getFirebaseApp();
    }
    
    db = getFirestore(app);
    console.log('[Backend] Firebase initialized successfully');
  } catch (error) {
    console.error('[Backend] Firebase initialization error:', error);
  }
}

export function getApp() {
  if (!app) {
    initFirebase();
  }
  return app;
}

export function getDb() {
  if (!db) {
    initFirebase();
  }
  return db;
}
