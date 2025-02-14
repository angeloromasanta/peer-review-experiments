// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3fGiLCbg_rSpxaTt2mbG4k_EEHeMGx9Q",
  authDomain: "peer-review-experiment.firebaseapp.com",
  projectId: "peer-review-experiment",
  storageBucket: "peer-review-experiment.firebasestorage.app",
  messagingSenderId: "765213982928",
  appId: "1:765213982928:web:6af69378a39fca96795ed5",
  measurementId: "G-MJLPHFBPED"
};


// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };