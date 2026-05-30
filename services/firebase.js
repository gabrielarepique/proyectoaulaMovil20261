import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Reemplaza estos valores con los de tu propia consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMFqp9ArrJXj0HONNLfJVWP4crbZkY9cE",
  authDomain: "taller-1-b7a67.firebaseapp.com",
  projectId: "taller-1-b7a67",
  storageBucket: "taller-1-b7a67.firebasestorage.app",
  messagingSenderId: "706715436597",
  appId: "1:706715436597:web:e60d888fdc9bcc6f97d37c",
  measurementId: "G-N73C9JZW15"
};

// Inicialización
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);

console.log("Firebase v10 inicializado correctamente");