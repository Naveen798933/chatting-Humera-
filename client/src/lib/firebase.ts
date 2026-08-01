import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Configuration (Uses env vars if present, with real project fallbacks for production builds)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAuXj08cai-FiYt1-XoHxDQq5PPqwXR0t8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "our-universe-naveen-humera.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "our-universe-naveen-humera",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "our-universe-naveen-humera.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "780150831368",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:780150831368:web:bdbaac71ded7432905d4bd"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authorized User Credentials (Hardcoded Boundary as required in Section 3)
export const AUTHORIZED_USERS = [
  {
    uid: 'naveen_uid_798933' as const,
    email: 'naveen@ouruniverse.app',
    realName: 'Naveen',
    nickname: 'Naveen',
    petName: 'Bangaram ❤️',
    role: 'owner' as const,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    city: 'Hyderabad, India',
    pin: '7989'
  },
  {
    uid: 'humera_uid_140299' as const,
    email: 'humera@ouruniverse.app',
    realName: 'Humera',
    nickname: 'Humera',
    petName: 'Jaanu ❤️',
    role: 'partner' as const,
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    city: 'Bengaluru, India',
    pin: '1402'
  }
];

export const IS_AUTHORIZED_EMAIL = (email: string) => {
  return AUTHORIZED_USERS.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
};
