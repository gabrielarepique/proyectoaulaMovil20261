import { auth } from './firebase.js';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

export const authService = {

  register: (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  login: (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  logout: () => {
    return signOut(auth);
  },

  subscribeToAuthState: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};