import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxX3ucdY7c_dUonMlWdaAkVoYBa8CFo6k",
  authDomain: "dallas-2026.firebaseapp.com",
  projectId: "dallas-2026",
  storageBucket: "dallas-2026.firebasestorage.app",
  messagingSenderId: "335190785187",
  appId: "1:335190785187:web:89b1c5b4d60a7e2d11d316",
  measurementId: "G-6NT52Z5CJ5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);