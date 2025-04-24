// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: 'AIzaSyC5zFuWZGZcsIbFTqSzyVgBVHjnUZmKdSE',
  authDomain: 'deepfakeaudio.firebaseapp.com',
  projectId: 'deepfakeaudio',
  storageBucket: 'deepfakeaudio.appspot.com',
  messagingSenderId: '996257752349',
  appId: '1:996257752349:android:41c3c0dda62c933fef6df4',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app); // Initialize Firestore

export { auth, googleProvider, db }; // Export db for Firestore
