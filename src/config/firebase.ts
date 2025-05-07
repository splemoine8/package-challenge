import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA4pokHtxWMWB8MeeSb-1_5NkmMJ1YMjMw",
  authDomain: "pancakes-36186.firebaseapp.com",
  projectId: "pancakes-36186",
  storageBucket: "pancakes-36186.firebasestorage.app",
  messagingSenderId: "906733209483",
  appId: "1:906733209483:web:efdf26b25cdaeb8a0e118e",
  measurementId: "G-R48CQFZ2B0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// List of admin email addresses
const ADMIN_EMAILS = [
  'scottlemoine@gmail.com' // Add your email here
];

// Function to check if a user is an admin
export const isUserAdmin = (email: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}; 