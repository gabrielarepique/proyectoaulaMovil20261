import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, TextInput, Modal, Animated,
  StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';
import Toast, { showToast } from '../components/ToastNotification';

const CATEGORIES = ['Salud', 'Trabajo', 'Personal', 'General'];

// ---- Lógica de estado de meta ----
const getGoalStatus = (habit, doneToday) => {
  if (!habit.deadline) return null;
  const today = new Date().toISOString().split('T')[0];
  if (habit.deadline < today) return 'vencida';
  if (doneToday) return 'cumplida';
  return 'activa';
};

const GOAL_CONFIG = {
  activa:  { color: '#1A73E8', bg: '#E8F1FF', label: 'Meta activa',   icon: 'radio-button-on',  desc: 'Sigue completando el hábito' },
  cumplida:{ color: '#2E7D32', bg: '#E8F5E9', label: 'Meta cumplida', icon: 'checkmark-circle', desc: '¡Completaste el hábito hoy!' },
  vencida: { color: '#E53935', bg: '#FFEBEE', label: 'Meta vencida',  icon: 'alert-circle',     desc: 'La fecha límite ya pasó' },
};

export default function HabitDetailScreen({ route, navigation }) {
  const { habit } = route.params;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [category, setCategory] = useState(habit.category);

  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (showEditModal) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [showEditModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      const data = await habitService.getHabitHistory(user.uid, habit.id);
      setHistory(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyProgress = () => {
    if (!history || history.length === 0) return 0;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      if (history.includes(date.toISOString().split('T')[0])) count++;
    }
    return Math.round((count / 7) * 100);
  };

  const calculateTotalProgress = () => {
    if (!history || history.length === 0) return 0;
    const createdAt = habit.createdAt?.toDate
      ? habit.createdAt.toDate()
      : new Date(habit.createdAt || Date.now());
    const diffMs = new Date() - createdAt;
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return Math.min(100, Math.round((history.length / totalDays) * 100));
  };

  const calculateCurrentStreak = () => {
    if (!history || history.length === 0) return 0;
    const sorted = [...history].sort((a, b) => (b > a ? 1 : -1));
    let streak = 0;
    let current = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const dateStr = current.toISOString().split('T')[0];
      if (sorted[i] === dateStr) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const weeklyPct = calculateWeeklyProgress();
  const totalPct = calculateTotalProgress();
  const streak = calculateCurrentStreak();
  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = history.includes(todayStr);
  const goalStatus = getGoalStatus(habit, doneToday);
  const goalCfg = goalStatus ? GOAL_CONFIG[goalStatus] : null;

  const getIcon = () => {
    switch (category) {
      case 'Salud': return 'fitness';
      case 'Trabajo': return 'briefcase';
      case 'Personal': return 'person';
      default: return 'star';
    }
  };

  const getIconColor = () => {
    switch (category) {
      case 'Salud': return '#43E97B';
      case 'Trabajo': return '#4FACFE';
      case 'Personal': return '#FA709A';
      default: return '#A18CD1';
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Error', message: 'El nombre no puede estar vacío' });
      return;
    }
    try {
      const user = authService.getCurrentUser();
      await habitService.updateHabit(user.uid, habit.id, { name, description, category });
      showToast({ type: 'success', title: '¡Actualizado!', message: 'Los cambios se guardaron' });
      setShowEditModal(false);
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

  const handleDoneToday = async () => {
    if (doneToday) {
      showToast({ type: 'info', title: 'Ya completado 🎉', message: 'Ya registraste este hábito hoy' });
      return;
    }
    try {
      const user = authService.getCurrentUser();
      await habitService.markHabitAsDone(user.uid, habit.id);
      await loadData();
      const newStreak = streak + 1;
      showToast({
        type: 'success',
        title: '¡Hábito completado! 🎉',
        message: newStreak > 1 ? `¡${newStreak} días seguidos! Sigue así 🔥` : 'Primer día registrado',
        duration: 3500,
      });
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `¿Deseas eliminar "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              const user = authService.getCurrentUser();
              await habitService.deleteHabit(user.uid, habit.id);
              navigation.goBack();
            } catch (error) {
              showToast({ type: 'error', title: 'Error', message: error.message });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A73E8" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={22} color="#1A73E8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="trash-outline" size={22} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HÉROE */}
        <View style={styles.heroSection}>
          <View style={[styles.iconBox, { backgroundColor: getIconColor() }]}>
            <Ionicons name={getIcon()} size={38} color="#fff" />
          </View>
          <Text style={styles.habitName}>{name}</Text>
          {description ? <Text style={styles.habitDesc}>{description}</Text> : null}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>

          {/* ESTADO DE META */}
          {goalCfg && (
            <View style={[styles.goalStatusCard, { backgroundColor: goalCfg.bg, borderColor: goalCfg.color + '44' }]}>
              <Ionicons name={goalCfg.icon} size={16} color={goalCfg.color} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.goalStatusLabel, { color: goalCfg.color }]}>{goalCfg.label}</Text>
                <Text style={styles.goalStatusDesc}>{goalCfg.desc}</Text>
              </View>
              {habit.deadline && (
                <Text style={[styles.goalDeadline, { color: goalCfg.color }]}>
                  {habit.deadline}
                </Text>
              )}
            </View>
          )}

          {habit.deadline && !goalCfg && (
            <View style={styles.deadlineBadge}>
              <Ionicons name="calendar-outline" size={12} color="#4A7CC7" />
              <Text style={styles.deadlineText}>Límite: {habit.deadline}</Text>
            </View>
          )}
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>🔥 Racha</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.statLabel}>✅ Total días</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{weeklyPct}%</Text>
            <Text style={styles.statLabel}>📅 Esta semana</Text>
          </View>
        </View>

        {/* PROGRESO SEMANAL */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso semanal</Text>
            <Text style={styles.progressPct}>{weeklyPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${weeklyPct}%`, backgroundColor: weeklyPct >= 70 ? '#43E97B' : '#4FACFE' }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {weeklyPct >= 70 ? '¡Excelente semana! 🚀' : weeklyPct >= 40 ? 'Vas bien, sigue así 💪' : 'Puedes mejorar, ¡tú puedes! 🌟'}
          </Text>
        </View>

        {/* PROGRESO TOTAL */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso total</Text>
            <Text style={styles.progressPct}>{totalPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${totalPct}%`, backgroundColor: '#FA709A' }]} />
          </View>
        </View>

        {/* BOTÓN MARCAR */}
        <TouchableOpacity
          style={[styles.doneBtn, doneToday && styles.doneBtnDone]}
          onPress={handleDoneToday}
          activeOpacity={0.8}
        >
          <Ionicons name={doneToday ? 'checkmark-done-circle' : 'checkmark-circle-outline'} size={22} color="#fff" />
          <Text style={styles.doneBtnText}>{doneToday ? '¡Completado hoy! 🎉' : 'Marcar como hecho hoy'}</Text>
        </TouchableOpacity>

        {/* HISTORIAL */}
        <Text style={styles.historyTitle}>Historial ({history.length} días)</Text>
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>Aún no hay registros. ¡Completa tu primer día!</Text>
          </View>
        ) : (
          [...history]
            .sort((a, b) => (b > a ? 1 : -1))
            .map((item) => (
              <View key={item} style={styles.historyItem}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={styles.historyDate}>{item}</Text>
              </View>
            ))
        )}
      </ScrollView>

      {/* MODAL EDITAR */}
      <Modal visible={showEditModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Editar hábito</Text>

            <Text style={styles.modalLabel}>Nombre</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput style={styles.modalInput} value={name} onChangeText={setName}
                placeholder="Nombre del hábito" placeholderTextColor="#999" selectionColor="#1A73E8" />
            </View>

            <Text style={styles.modalLabel}>Descripción</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                value={description} onChangeText={setDescription}
                placeholder="Descripción (opcional)" placeholderTextColor="#999" multiline selectionColor="#1A73E8" />
            </View>

            <Text style={styles.modalLabel}>Categoría</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* TOAST */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 44, paddingHorizontal: 20, marginBottom: 10,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F1FF', justifyContent: 'center', alignItems: 'center' },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  iconBox: { width: 82, height: 82, borderRadius: 41, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 6 },
  habitName: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  habitDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  categoryBadge: { backgroundColor: '#E8F1FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  categoryBadgeText: { color: '#1A73E8', fontWeight: '600', fontSize: 13 },
  goalStatusCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, width: '100%',
  },
  goalStatusLabel: { fontSize: 13, fontWeight: '700' },
  goalStatusDesc: { fontSize: 11, color: '#888', marginTop: 1 },
  goalDeadline: { marginLeft: 'auto', fontSize: 12, fontWeight: '700' },
  deadlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F1FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, gap: 4 },
  deadlineText: { fontSize: 12, color: '#4A7CC7', fontWeight: '500' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#1A73E8' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  progressSection: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginHorizontal: 20, marginBottom: 12, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#444' },
  progressPct: { fontSize: 20, fontWeight: '800', color: '#1A73E8' },
  progressTrack: { height: 10, backgroundColor: '#E8F1FF', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 10, minWidth: 4 },
  progressSubtext: { fontSize: 12, color: '#888', marginTop: 8 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A73E8', marginHorizontal: 20, padding: 16, borderRadius: 16,
    marginBottom: 20, gap: 8, elevation: 4,
    shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  doneBtnDone: { backgroundColor: '#2E7D32' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#444', marginHorizontal: 20, marginBottom: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginHorizontal: 20, marginBottom: 8, gap: 10, elevation: 1 },
  historyDate: { fontSize: 14, color: '#333', fontWeight: '500' },
  emptyHistory: { alignItems: 'center', padding: 24, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16 },
  emptyHistoryText: { color: '#888', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInputWrapper: { backgroundColor: '#F5F7FB', borderRadius: 14, marginBottom: 16, borderWidth: 1.5, borderColor: '#D0E4FF', paddingHorizontal: 14 },
  modalInput: { fontSize: 15, color: '#222', paddingVertical: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F0F4FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#D0E4FF' },
  chipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: '#1A73E8', padding: 15, borderRadius: 14, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#888', fontSize: 14 },
});
