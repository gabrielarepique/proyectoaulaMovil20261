import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { habitService } from '../services/habitService';
import { authService } from '../services/authService';
import { auth } from '../services/firebase';

export default function HomeScreen({ navigation }) {

  const [habits, setHabits] = useState([]);
  const [userName, setUserName] = useState('');
  const [streaks, setStreaks] = useState({});
  const [doneToday, setDoneToday] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔍 BUSCADOR
  const [search, setSearch] = useState('');

  // 🎛️ FILTROS AVANZADOS
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("Todas");
  const [frequency, setFrequency] = useState("Todas");
  const [status, setStatus] = useState("Todos");

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setLoading(true);

          const user = authService.getCurrentUser();
          if (!user) return;

          const profile = await habitService.getUserProfile(user.uid);
          if (profile?.fullName) setUserName(profile.fullName);

          const habitsData = await habitService.getHabits(user.uid);
          setHabits(habitsData);

          const streakMap = {};
          const doneMap = {};
          const today = new Date().toISOString().split('T')[0];

          for (const habit of habitsData) {
            const history = await habitService.getHabitHistory(user.uid, habit.id);

            streakMap[habit.id] = habitService.calculateStreak(history);
            doneMap[habit.id] = history.includes(today);
          }

          setStreaks(streakMap);
          setDoneToday(doneMap);

        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro?", [
      { text: "Cancelar" },
      { text: "Salir", onPress: () => signOut(auth) }
    ]);
  };

  const handleDone = async (habitId) => {
    try {
      const user = authService.getCurrentUser();

      await habitService.markHabitAsDone(user.uid, habitId);

      setDoneToday(prev => ({ ...prev, [habitId]: true }));
      setStreaks(prev => ({ ...prev, [habitId]: (prev[habitId] || 0) + 1 }));

    } catch (error) {
      Alert.alert("Info", error.message);
    }
  };

  const getInitial = () => {
    return userName ? userName.charAt(0).toUpperCase() : "?";
  };

  // 🔥 FILTRO PRO
  const getFilteredHabits = () => {
    return habits.filter(habit => {

      // 🔍 búsqueda
      if (!habit.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // 📂 categoría
      if (category !== "Todas" && habit.category !== category) {
        return false;
      }

      // 🔁 frecuencia
      if (frequency !== "Todas" && habit.frequency !== frequency) {
        return false;
      }

      // ✅ estado
      if (status === "Hechos" && !doneToday[habit.id]) {
        return false;
      }

      if (status === "Pendientes" && doneToday[habit.id]) {
        return false;
      }

      return true;
    });
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1A73E8" />;
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>

          <View>
            <Text style={styles.greeting}>Hola 👋</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 🔍 BUSCADOR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          placeholder="Buscar hábito..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* 🎛️ BOTÓN FILTROS */}
      <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
        <Ionicons name="options-outline" size={18} color="#fff" />
        <Text style={styles.filterBtnText}>Filtros</Text>
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={getFilteredHabits()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {

          const isDone = doneToday[item.id];

          return (
            <View style={styles.card}>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('HabitDetail', { habit: item })}
              >
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.category} • {item.frequency}</Text>
                <Text style={styles.streak}>🔥 {streaks[item.id] || 0} días</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.doneBtn, isDone && styles.doneBtnDisabled]}
                onPress={() => handleDone(item.id)}
                disabled={isDone}
              >
                <Ionicons
                  name={isDone ? "checkmark-done" : "checkmark"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>

            </View>
          );
        }}
      />

      {/* 🎛️ MODAL FILTROS */}
      <Modal visible={showFilters} animationType="slide">
        <View style={styles.modal}>

          <Text style={styles.modalTitle}>Filtros</Text>

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          {["Todas", "Salud", "Trabajo", "Personal"].map(item => (
            <TouchableOpacity key={item} onPress={() => setCategory(item)}>
              <Text style={category === item ? styles.activeOption : styles.option}>{item}</Text>
            </TouchableOpacity>
          ))}

          {/* Frecuencia */}
          <Text style={styles.label}>Frecuencia</Text>
          {["Todas", "Diario", "Semanal", "Mensual"].map(item => (
            <TouchableOpacity key={item} onPress={() => setFrequency(item)}>
              <Text style={frequency === item ? styles.activeOption : styles.option}>{item}</Text>
            </TouchableOpacity>
          ))}

          {/* Estado */}
          <Text style={styles.label}>Estado</Text>
          {["Todos", "Hechos", "Pendientes"].map(item => (
            <TouchableOpacity key={item} onPress={() => setStatus(item)}>
              <Text style={status === item ? styles.activeOption : styles.option}>{item}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFilters(false)}>
            <Text style={{ color: '#fff' }}>Aplicar filtros</Text>
          </TouchableOpacity>

        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewHabit')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, padding: 20, backgroundColor: '#F0F7FF' },

  header: {
    marginTop: 40,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  userSection: { flexDirection: 'row', alignItems: 'center' },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },

  avatarText: { color: '#fff', fontWeight: 'bold' },

  greeting: { fontSize: 13, color: '#888' },

  name: { fontSize: 20, fontWeight: 'bold' },

  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10
  },

  searchInput: { marginLeft: 10, flex: 1 },

  filterBtn: {
    flexDirection: 'row',
    backgroundColor: '#1A73E8',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15
  },

  filterBtnText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold'
  },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3
  },

  title: { fontSize: 17, fontWeight: 'bold' },

  subtitle: { fontSize: 13, color: '#888', marginTop: 5 },

  streak: { marginTop: 5, fontSize: 13, color: '#FF6B00', fontWeight: 'bold' },

  doneBtn: {
    backgroundColor: '#1A73E8',
    padding: 10,
    borderRadius: 10
  },

  doneBtnDisabled: { backgroundColor: 'green' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#1A73E8',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },

  modal: { flex: 1, padding: 25 },

  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },

  label: { marginTop: 15, fontWeight: 'bold' },

  option: { padding: 10, color: '#555' },

  activeOption: { padding: 10, color: '#1A73E8', fontWeight: 'bold' },

  closeBtn: {
    backgroundColor: '#1A73E8',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center'
  }

});