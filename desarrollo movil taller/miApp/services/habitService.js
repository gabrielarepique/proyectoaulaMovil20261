import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { app } from './authService';

const db = getFirestore(app);

export const habitService = {
  /**
   * Crear un nuevo hábito
   */
  createHabit: async (userId, habitData) => {
    const docRef = await addDoc(collection(db, 'habits'), {
      userId,
      name: habitData.name,
      description: habitData.description || '',
      frequency: habitData.frequency || 'daily',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Obtener todos los hábitos del usuario autenticado
   */
  getHabits: async (userId) => {
    const q = query(collection(db, 'habits'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Eliminar un hábito
   */
  deleteHabit: async (habitId) => {
    await deleteDoc(doc(db, 'habits', habitId));
  },

  /**
   * Registrar cumplimiento diario de un hábito
   * Evita duplicados: un registro por hábito por día
   */
  markHabitDone: async (userId, habitId) => {
    const today = new Date();
    // Crear una fecha "YYYY-MM-DD" como clave única por día
    const dateKey = today.toISOString().split('T')[0];
    const recordId = `${userId}_${habitId}_${dateKey}`;

    const recordRef = doc(db, 'completions', recordId);
    const existing = await getDoc(recordRef);

    if (existing.exists()) {
      // Ya fue marcado hoy → retornar indicador
      return { alreadyDone: true };
    }

    await setDoc(recordRef, {
      userId,
      habitId,
      date: dateKey,
      completedAt: Timestamp.now(),
    });

    return { alreadyDone: false };
  },

  /**
   * Obtener los IDs de hábitos completados hoy por el usuario
   */
  getCompletionsToday: async (userId) => {
    const dateKey = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'completions'),
      where('userId', '==', userId),
      where('date', '==', dateKey)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data().habitId);
  },
};