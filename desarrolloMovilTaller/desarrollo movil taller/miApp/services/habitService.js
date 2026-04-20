import { db } from './firebase';

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';

export const habitService = {

  // =========================
  // 👤 USUARIO
  // =========================

  createUserProfile: async (userId, data) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        fullName: data.fullName,
        email: data.email,
        createdAt: new Date()
      });
    } catch (error) {
      console.log("Error creando perfil:", error);
      throw error;
    }
  },

  getUserProfile: async (userId) => {
    try {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);

      if (snap.exists()) return snap.data();
      return null;

    } catch (error) {
      console.log("Error obteniendo usuario:", error);
      return null;
    }
  },

  // =========================
  // 📋 HÁBITOS
  // =========================

  getHabits: async (userId) => {
    try {
      const snapshot = await getDocs(
        collection(db, 'users', userId, 'habits')
      );

      const habits = [];

      snapshot.forEach(docItem => {
        habits.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      return habits;

    } catch (error) {
      console.log("Error obteniendo hábitos:", error);
      return [];
    }
  },

  getCategories: async (userId) => {
    try {
      const snapshot = await getDocs(
        collection(db, 'users', userId, 'categories')
      );

      const categories = [];

      snapshot.forEach(docItem => {
        const data = docItem.data();
        if (data?.name) categories.push(data.name);
      });

      return categories.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    } catch (error) {
      console.log("Error obteniendo categorías:", error);
      return [];
    }
  },

  createCategory: async (userId, categoryName) => {
    try {
      const trimmed = categoryName.trim();
      if (!trimmed) throw new Error('Nombre de categoría inválido');

      const categoryId = trimmed.toLowerCase().replace(/\s+/g, '-');

      await setDoc(
        doc(db, 'users', userId, 'categories', categoryId),
        {
          name: trimmed,
          createdAt: new Date()
        }
      );
    } catch (error) {
      console.log("Error creando categoría:", error);
      throw error;
    }
  },

  createHabit: async (userId, habitData) => {
    try {
      await addDoc(
        collection(db, 'users', userId, 'habits'),
        {
          ...habitData,
          createdAt: new Date()
        }
      );
    } catch (error) {
      console.log("Error creando hábito:", error);
      throw error;
    }
  },

  updateHabit: async (userId, habitId, data) => {
    try {
      await updateDoc(
        doc(db, 'users', userId, 'habits', habitId),
        data
      );
    } catch (error) {
      console.log("Error actualizando hábito:", error);
      throw error;
    }
  },

  deleteHabit: async (userId, habitId) => {
    try {
      await deleteDoc(
        doc(db, 'users', userId, 'habits', habitId)
      );
    } catch (error) {
      console.log("Error eliminando hábito:", error);
      throw error;
    }
  },

  // =========================
  // 📅 HISTORIAL
  // =========================

  getHabitHistory: async (userId, habitId) => {
    try {
      const snapshot = await getDocs(
        collection(db, 'users', userId, 'habits', habitId, 'history')
      );

      const history = [];

      snapshot.forEach(docItem => {
        history.push(docItem.id); // fecha como ID
      });

      // ordenar más reciente primero
      return history.sort((a, b) => new Date(b) - new Date(a));

    } catch (error) {
      console.log("Error cargando historial:", error);
      return [];
    }
  },

  markHabitAsDone: async (userId, habitId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const ref = doc(
        db,
        'users',
        userId,
        'habits',
        habitId,
        'history',
        today
      );

      const exists = await getDoc(ref);

      // 🚫 evitar duplicar día
      if (exists.exists()) {
        throw new Error("Ya marcaste este hábito hoy");
      }

      await setDoc(ref, {
        date: today,
        createdAt: new Date()
      });

    } catch (error) {
      console.log("Error marcando hábito:", error);
      throw error;
    }
  },

  // =========================
  // 🔥 STREAK
  // =========================

  calculateStreak: (history) => {
    if (!history || history.length === 0) return 0;

    // ordenar por fecha descendente
    const sorted = history.sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (sorted.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

};