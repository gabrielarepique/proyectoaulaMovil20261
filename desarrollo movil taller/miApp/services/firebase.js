import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCMFqp9ArrJXj0HONNLfJVWP4crbZkY9cE",
  authDomain: "taller-1-b7a67.firebaseapp.com",
  projectId: "taller-1-b7a67",
  storageBucket: "taller-1-b7a67.firebasestorage.app",
  messagingSenderId: "706715436597",
  appId: "1:706715436597:web:e60d888fdc9bcc6f97d37c",
  measurementId: "G-N73C9JZW15"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };