import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';

const CATEGORIES = ['Salud', 'Trabajo', 'Personal', 'General'];
const FREQUENCIES = ['Diario', 'Semanal', 'Mensual'];

// Valida formato YYYY-MM-DD y que sea fecha real
const isValidDate = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [year, month, day] = str.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() + 1 === month &&
    d.getDate() === day
  );
};

const isFutureOrToday = (str) => {
  const today = new Date().toISOString().split('T')[0];
  return str >= today;
};

export default function NewHabitScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('Diario');
  const [loading, setLoading] = useState(false);

  // 📅 FECHA LÍMITE manual (YYYY-MM-DD)
  const [deadline, setDeadline] = useState('');
  const [deadlineError, setDeadlineError] = useState('');

  const handleDeadlineChange = (text) => {
    // Auto-insertar guiones mientras escribe: 2025-06-15
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    if (cleaned.length > 7) cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
    cleaned = cleaned.slice(0, 10);
    setDeadline(cleaned);

    if (cleaned.length === 10) {
      if (!isValidDate(cleaned)) {
        setDeadlineError('Fecha inválida');
      } else if (!isFutureOrToday(cleaned)) {
        setDeadlineError('La fecha debe ser hoy o en el futuro');
      } else {
        setDeadlineError('');
      }
    } else {
      setDeadlineError('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del hábito.');
      return;
    }

    if (deadline.length > 0 && deadline.length < 10) {
      Alert.alert('Error', 'Ingresa la fecha completa en formato AAAA-MM-DD o déjala vacía.');
      return;
    }
    if (deadline.length === 10) {
      if (!isValidDate(deadline)) {
        Alert.alert('Error', 'La fecha no es válida. Usa el formato AAAA-MM-DD.');
        return;
      }
      if (!isFutureOrToday(deadline)) {
        Alert.alert('Error', 'La fecha límite debe ser hoy o en el futuro.');
        return;
      }
    }

    const user = authService.getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'No has iniciado sesión.');
      return;
    }

    setLoading(true);
    try {
      await habitService.createHabit(user.uid, {
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        deadline: deadline.length === 10 ? deadline : null,
        createdAt: new Date(),
      });

      Alert.alert('¡Éxito!', 'Hábito creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A73E8" />
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Hábito</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* NOMBRE */}
        <Text style={styles.label}>Nombre *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="pencil-outline" size={18} color="#1A73E8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ej: Meditar 10 minutos"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            selectionColor="#1A73E8"
          />
        </View>

        {/* DESCRIPCIÓN */}
        <Text style={styles.label}>Descripción (opcional)</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="¿Por qué quieres este hábito?"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            selectionColor="#1A73E8"
          />
        </View>

        {/* CATEGORÍA */}
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FRECUENCIA */}
        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.chipRow}>
          {FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[styles.chip, frequency === freq && styles.chipActive]}
              onPress={() => setFrequency(freq)}
            >
              <Ionicons
                name={
                  freq === 'Diario'
                    ? 'today-outline'
                    : freq === 'Semanal'
                    ? 'calendar-outline'
                    : 'calendar-clear-outline'
                }
                size={14}
                color={frequency === freq ? '#fff' : '#555'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chipText, frequency === freq && styles.chipTextActive]}>
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FECHA LÍMITE — input manual, sin dependencias externas */}
        <Text style={styles.label}>Fecha límite (opcional)</Text>
        <View style={[styles.inputWrapper, deadlineError ? styles.inputError : null]}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={deadline.length === 10 && !deadlineError ? '#1A73E8' : '#999'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD  (ej: 2025-12-31)"
            placeholderTextColor="#999"
            value={deadline}
            onChangeText={handleDeadlineChange}
            keyboardType="numeric"
            maxLength={10}
            selectionColor="#1A73E8"
          />
          {deadline.length > 0 && (
            <TouchableOpacity onPress={() => { setDeadline(''); setDeadlineError(''); }}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {deadlineError ? (
          <Text style={styles.errorText}>⚠ {deadlineError}</Text>
        ) : deadline.length > 0 && deadline.length < 10 ? (
          <Text style={styles.hintText}>Sigue escribiendo… {deadline.length}/10</Text>
        ) : deadline.length === 10 && !deadlineError ? (
          <Text style={styles.successText}>✅ Fecha válida</Text>
        ) : null}

        {/* INFO */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color="#4A7CC7" />
          <Text style={styles.infoText}>
            Puedes marcar el hábito como completado cada día desde la pantalla principal.
          </Text>
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar Hábito</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 44,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#D0E4FF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: '#E53935',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    marginBottom: 18,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D0E4FF',
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
    elevation: 3,
  },
  chipText: { fontSize: 14, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginBottom: 14,
    marginLeft: 4,
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 14,
    marginLeft: 4,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 12,
    marginBottom: 14,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F1FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    marginTop: 4,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4A7CC7',
    lineHeight: 18,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A73E8',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});