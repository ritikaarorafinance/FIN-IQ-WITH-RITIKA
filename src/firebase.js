// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmDb894RIXoCZwpXx5GSw60RgmGppDjHE",
  authDomain: "finance-quiz-6d2ab.firebaseapp.com",
  projectId: "finance-quiz-6d2ab",
  storageBucket: "finance-quiz-6d2ab.firebasestorage.app",
  messagingSenderId: "883190536409",
  appId: "1:883190536409:web:e3638e9c947ced7bcd86c8",
  measurementId: "G-E87Q3CFRV6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
