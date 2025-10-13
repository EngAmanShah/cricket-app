// config/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // ✅ Realtime DB
import { getStorage } from "firebase/storage";
import {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  FIREBASE_DATABASE_URL,
} from "@env";

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  databaseURL: FIREBASE_DATABASE_URL, // ✅ Required for Realtime DB
};

// Initialize app
const app = initializeApp(firebaseConfig);

// ✅ Export everything properly
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = getDatabase(app); // ✅ Realtime DB instance (important)
export const storage = getStorage(app);
