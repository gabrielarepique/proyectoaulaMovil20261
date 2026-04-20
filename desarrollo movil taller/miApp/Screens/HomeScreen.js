import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { authService } from '../services/authService';
import { habitService } from '../services/habitService';

export default function HomeScreen() {
  const [habits, setHabits] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const user = authService.getCurrentUser();

  // ─── Cargar hábitos y completados de hoy ────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [habitList, doneToday] = await Promise.all([
        habitService.getHabits(user.uid),
        habitService.getCompletionsToday(user.uid),
      ]);
      setHabits(habitList);
      setCompletedToday(doneToday);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los hábitos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Pull-to-refresh ─────────────────────────────────────────────────────────
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ─── Crear hábito ─────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Campo requerido', 'El nombre del hábito no puede estar vacío.');
      return;
    }
    setSaving(true);
    try {
      await habitService.createHabit(user.uid, {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setNewName('');
      setNewDesc('');
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el hábito.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Marcar cumplimiento diario ───────────────────────────────────────────────
  const handleMarkDone = async (habit) => {
    const isDone = completedToday.includes(habit.id);
    if (isDone) {
      Alert.alert('Ya registrado', `"${habit.name}" ya fue marcado como completado hoy. ✅`);
      return;
    }

    try {
      const result = await habitService.markHabitDone(user.uid, habit.id);
      if (result.alreadyDone) {
        Alert.alert('Ya registrado', `"${habit.name}" ya fue completado hoy. ✅`);
      } else {
        // Actualizar estado local sin recargar todo
        setCompletedToday((prev) => [...prev, habit.id]);
        Alert.alert('¡Bien hecho! 🎉', `Registraste "${habit.name}" como completado hoy.`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el cumplimiento.');
    }
  };

  // ─── Eliminar hábito ──────────────────────────────────────────────────────────
  const handleDelete = (habit) => {
    Alert.alert(
      'Eliminar hábito',
      `¿Seguro que quieres eliminar "${habit.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await habitService.deleteHabit(habit.id);
              setHabits((prev) => prev.filter((h) => h.id !== habit.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el hábito.');
            }
          },
        },
      ]
    );
  };

  // ─── Cerrar sesión ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => authService.logout() },
    ]);
  };

  // ─── Render de cada hábito ────────────────────────────────────────────────────
  const renderHabit = ({ item }) => {
    const done = completedToday.includes(item.id);
    return (
      <View style={[styles.habitCard, done && styles.habitCardDone]}>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, done && styles.habitNameDone]}>
            {done ? '✅ ' : '⬜ '}{item.name}
          </Text>
          {item.description ? (
            <Text style={styles.habitDesc}>{item.description}</Text>
          ) : null}
          {done && (
            <Text style={styles.doneLabel}>Completado hoy</Text>
          )}
        </View>
        <View style={styles.habitActions}>
          <TouchableOpacity
            style={[styles.doneBtn, done && styles.doneBtnDisabled]}
            onPress={() => handleMarkDone(item)}
          >
            <Text style={styles.doneBtnText}>{done ? '✓' : 'Hacer'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Render principal ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Cargando hábitos...</Text>
      </View>
    );
  }

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Hábitos</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen del día */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryNumber}>{completedToday.length}</Text>
          {' / '}
          <Text style={styles.summaryNumber}>{habits.length}</Text>
          {'  hábitos completados hoy'}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: habits.length > 0
                  ? `${Math.round((completedToday.length / habits.length) * 100)}%`
                  : '0%',
              },
            ]}
          />
        </View>
      </View>

      {/* Lista de hábitos */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={habits.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Sin hábitos aún</Text>
            <Text style={styles.emptySubtitle}>Toca el botón "+" para agregar tu primer hábito</Text>
          </View>
        }
      />

      {/* Botón flotante para crear */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal para crear hábito */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo Hábito</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del hábito *"
              placeholderTextColor="#aaa"
              value={newName}
              onChangeText={setNewName}
              maxLength={60}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#aaa"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setNewName(''); setNewDesc(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0EDFF',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A73E8' },
  headerDate: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    backgroundColor: '#FFF0F0', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFCCCC',
  },
  logoutText: { color: '#E53935', fontWeight: '700', fontSize: 13 },

  // Resumen
  summaryCard: {
    margin: 16, padding: 16,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#1A73E8', shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  summaryText: { fontSize: 15, color: '#444', marginBottom: 10 },
  summaryNumber: { fontWeight: '800', color: '#1A73E8', fontSize: 17 },
  progressBar: {
    height: 8, backgroundColor: '#E0EDFF', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#1A73E8', borderRadius: 4 },

  // Lista
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#444', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 24 },

  // Tarjeta de hábito
  habitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#E0EDFF',
    shadowColor: '#1A73E8', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  habitCardDone: {
    backgroundColor: '#F0FFF4', borderColor: '#A8E6BB',
  },
  habitInfo: { flex: 1, marginRight: 10 },
  habitName: { fontSize: 16, fontWeight: '700', color: '#222' },
  habitNameDone: { color: '#2E7D32' },
  habitDesc: { fontSize: 13, color: '#888', marginTop: 3 },
  doneLabel: { fontSize: 12, color: '#43A047', fontWeight: '600', marginTop: 4 },

  // Acciones de hábito
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneBtn: {
    backgroundColor: '#1A73E8', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  doneBtnDisabled: { backgroundColor: '#A5C8FF' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1A73E8', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A73E8', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A73E8', marginBottom: 18 },
  input: {
    backgroundColor: '#F5F9FF', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#333', marginBottom: 12,
    borderWidth: 1, borderColor: '#D0E4FF',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD',
  },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#1A73E8',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});