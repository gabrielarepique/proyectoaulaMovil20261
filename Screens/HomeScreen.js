import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';
import { auth } from '../services/firebase';
import Toast, { showToast } from '../components/ToastNotification';

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [userName, setUserName] = useState('');
  const [streaks, setStreaks] = useState({});
  const [doneToday, setDoneToday] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('Todas');
  const [frequency, setFrequency] = useState('Todas');
  const [status, setStatus] = useState('Todos');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

      // 🔔 ALERTA IN-APP: hábitos pendientes
      const pendingCount = habitsData.length - Object.values(doneMap).filter(Boolean).length;
      if (pendingCount > 0) {
        setTimeout(() => {
          showToast({
            type: 'warning',
            title: `${pendingCount} hábito${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}`,
            message: '¡Completa tus hábitos de hoy!',
            duration: 4000,
          });
        }, 800);
      } else if (habitsData.length > 0) {
        setTimeout(() => {
          showToast({
            type: 'info',
            title: '¡Todo listo por hoy! 🎉',
            message: 'Completaste todos tus hábitos',
            duration: 3000,
          });
        }, 800);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Usamos showToast + confirm manual para no perder el estilo
    // Mantenemos Alert solo para confirmación destructiva
    const { Alert } = require('react-native');
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handleDone = async (habitId, habitName) => {
    try {
      const user = authService.getCurrentUser();
      await habitService.markHabitAsDone(user.uid, habitId);
      setDoneToday((prev) => ({ ...prev, [habitId]: true }));
      const newStreak = (streaks[habitId] || 0) + 1;
      setStreaks((prev) => ({ ...prev, [habitId]: newStreak }));

      // 🎉 TOAST bonito de confirmación
      showToast({
        type: 'success',
        title: `¡Hábito completado! 🎉`,
        message: newStreak > 1
          ? `Llevas ${newStreak} días seguidos con "${habitName}" 🔥`
          : `Has completado "${habitName}" hoy`,
        duration: 3500,
      });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo registrar', message: error.message });
    }
  };

  const handleDelete = (habitId, habitName) => {
    const { Alert } = require('react-native');
    Alert.alert(
      'Eliminar hábito',
      `¿Deseas eliminar "${habitName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = authService.getCurrentUser();
              await habitService.deleteHabit(user.uid, habitId);
              setHabits((prev) => prev.filter((h) => h.id !== habitId));
              showToast({ type: 'info', title: 'Hábito eliminado', message: habitName });
            } catch (error) {
              showToast({ type: 'error', title: 'Error', message: error.message });
            }
          },
        },
      ]
    );
  };

  const getInitial = () => (userName ? userName.charAt(0).toUpperCase() : '?');

  const getFilteredHabits = () => {
    return habits.filter((habit) => {
      if (!habit.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'Todas' && habit.category !== category) return false;
      if (frequency !== 'Todas' && habit.frequency !== frequency) return false;
      if (status === 'Hechos' && !doneToday[habit.id]) return false;
      if (status === 'Pendientes' && doneToday[habit.id]) return false;
      return true;
    });
  };

  // Estado de meta
  const getGoalStatus = (habit) => {
    if (!habit.deadline) return null;
    const today = new Date().toISOString().split('T')[0];
    if (habit.deadline < today) return 'vencida';
    if (doneToday[habit.id]) return 'cumplida';
    return 'activa';
  };

  const GOAL_STATUS_CONFIG = {
    activa: { color: '#1A73E8', bg: '#E8F1FF', label: 'Activa', icon: 'radio-button-on' },
    cumplida: { color: '#2E7D32', bg: '#E8F5E9', label: 'Cumplida', icon: 'checkmark-circle' },
    vencida: { color: '#E53935', bg: '#FFEBEE', label: 'Vencida', icon: 'alert-circle' },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Cargando tus hábitos...</Text>
      </View>
    );
  }

  const filtered = getFilteredHabits();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bienvenido 👋</Text>
            <Text style={styles.name}>{userName || 'Usuario'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Estadísticas */}
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={styles.iconBtn}>
            <Ionicons name="bar-chart-outline" size={20} color="#1A73E8" />
          </TouchableOpacity>
          {/* Historial */}
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.iconBtn}>
            <Ionicons name="time-outline" size={20} color="#1A73E8" />
          </TouchableOpacity>
          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={20} color="#1A73E8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* RESUMEN RÁPIDO */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{habits.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.summaryNumber, { color: '#2E7D32' }]}>
            {Object.values(doneToday).filter(Boolean).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: '#2E7D32' }]}>Hoy ✅</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.summaryNumber, { color: '#E65100' }]}>
            {habits.length - Object.values(doneToday).filter(Boolean).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: '#E65100' }]}>Pendientes</Text>
        </View>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          placeholder="Buscar hábito..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          selectionColor="#1A73E8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* BOTÓN FILTROS */}
      <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
        <Ionicons name="options-outline" size={18} color="#1A73E8" />
        <Text style={styles.filterBtnText}>Filtros</Text>
        {(category !== 'Todas' || frequency !== 'Todas' || status !== 'Todos') && (
          <View style={styles.filterBadge} />
        )}
      </TouchableOpacity>

      {/* LISTA */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={60} color="#C5D8F5" />
            <Text style={styles.emptyText}>No hay hábitos aquí</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Intenta con otra búsqueda' : 'Toca + para crear tu primer hábito'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDone = doneToday[item.id];
          const goalStatus = getGoalStatus(item);
          const goalCfg = goalStatus ? GOAL_STATUS_CONFIG[goalStatus] : null;

          return (
            <View style={[styles.card, goalStatus === 'vencida' && styles.cardExpired]}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('HabitDetail', { habit: item })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {goalCfg && (
                    <View style={[styles.goalBadge, { backgroundColor: goalCfg.bg }]}>
                      <Ionicons name={goalCfg.icon} size={10} color={goalCfg.color} />
                      <Text style={[styles.goalBadgeText, { color: goalCfg.color }]}>{goalCfg.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>
                  {item.category} · {item.frequency}
                </Text>
                {item.deadline && (
                  <Text style={[styles.cardDeadline, goalStatus === 'vencida' && { color: '#E53935' }]}>
                    📅 Límite: {item.deadline}
                  </Text>
                )}
                <View style={styles.streakRow}>
                  <Ionicons name="flame" size={14} color="#FF6B00" />
                  <Text style={styles.streak}> {streaks[item.id] || 0} días seguidos</Text>
                </View>
              </TouchableOpacity>

              {/* ACCIONES */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.doneBtn, isDone && styles.doneBtnDone]}
                  onPress={() => !isDone && handleDone(item.id, item.name)}
                  disabled={isDone}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-done' : 'checkmark'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* MODAL FILTROS */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtros</Text>

            <Text style={styles.filterLabel}>Categoría</Text>
            <View style={styles.chipRow}>
              {['Todas', 'Salud', 'Trabajo', 'Personal', 'General'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Frecuencia</Text>
            <View style={styles.chipRow}>
              {['Todas', 'Diario', 'Semanal', 'Mensual'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setFrequency(item)}
                  style={[styles.chip, frequency === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, frequency === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Estado</Text>
            <View style={styles.chipRow}>
              {['Todos', 'Hechos', 'Pendientes'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[styles.chip, status === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, status === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setCategory('Todas'); setFrequency('Todas'); setStatus('Todos'); }}
              >
                <Text style={styles.resetBtnText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewHabit')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* 🔔 TOAST GLOBAL — siempre al final */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  header: {
    marginTop: 44, marginHorizontal: 20, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  userSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A73E8',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 3,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  greeting: { fontSize: 12, color: '#888' },
  name: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E8F1FF', justifyContent: 'center', alignItems: 'center',
  },
  summaryRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#E8F1FF', borderRadius: 14, padding: 12, alignItems: 'center' },
  summaryNumber: { fontSize: 22, fontWeight: '800', color: '#1A73E8' },
  summaryLabel: { fontSize: 11, color: '#1A73E8', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#D0E4FF', elevation: 1,
  },
  searchInput: { marginLeft: 10, flex: 1, color: '#222', fontSize: 15 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14,
    backgroundColor: '#E8F1FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  filterBtnText: { color: '#1A73E8', marginLeft: 6, fontWeight: '600', fontSize: 14 },
  filterBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', marginLeft: 6 },
  card: {
    backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12,
    marginHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardExpired: { borderWidth: 1.5, borderColor: '#FFCDD2' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginRight: 8 },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  goalBadgeText: { fontSize: 10, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, color: '#888', marginTop: 4 },
  cardDeadline: { fontSize: 12, color: '#888', marginTop: 3 },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  streak: { fontSize: 12, color: '#FF6B00', fontWeight: '600' },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 8, marginLeft: 10 },
  doneBtn: { backgroundColor: '#1A73E8', padding: 10, borderRadius: 12, elevation: 2 },
  doneBtnDone: { backgroundColor: '#2E7D32' },
  deleteBtn: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#AAA', marginTop: 6, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 30, right: 24,
    backgroundColor: '#1A73E8', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F0F4FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#D0E4FF' },
  chipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  resetBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F0F4FF', alignItems: 'center', borderWidth: 1.5, borderColor: '#D0E4FF' },
  resetBtnText: { color: '#555', fontWeight: '600' },
  applyBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#1A73E8', alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
