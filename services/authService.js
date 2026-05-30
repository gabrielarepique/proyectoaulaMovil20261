import { auth } from './firebase'; // Asegúrate de que esta sea la ruta correcta a tu firebase.js
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updateProfile // Útil si más adelante quieres guardar el nombre de usuario
} from "firebase/auth";

export const authService = {
  // Iniciar sesión
  login: (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  // Registrar nuevo usuario
  register: (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  // Cerrar sesión
  logout: () => {
    return signOut(auth);
  },

  // Obtener el usuario actualmente logueado
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // (Opcional) Actualizar perfil para guardar el nombre de usuario
  updateUserProfile: (user, profileData) => {
    return updateProfile(user, profileData);
  }
};