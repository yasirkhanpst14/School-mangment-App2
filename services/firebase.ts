import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCiPaiXPFzdH2Qwm_ATd_F3PLFuUI4zPgA",
  authDomain: "school-app-c5e79.firebaseapp.com",
  projectId: "school-app-c5e79",
  storageBucket: "school-app-c5e79.firebasestorage.app",
  messagingSenderId: "93032217420",
  appId: "1:93032217420:web:9722cd7e26eb3b47fe6de9",
  measurementId: "G-BKR86M892F"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
