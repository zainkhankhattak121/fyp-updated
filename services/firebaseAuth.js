// services/firebaseAuth.js
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path as needed

// Sign-Up function
export const handleSignUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up:', userCredential.user);
  } catch (error) {
    console.log('Error during sign-up:', error.message);
  }
};

// Login function
export const handleLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user);
  } catch (error) {
    console.log('Error during login:', error.message);
  }
};

// Google Sign-In function
export const handleGoogleSignIn = async () => {
  const { idToken } = await GoogleSignin.signIn();
  const googleCredential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, googleCredential);
};
