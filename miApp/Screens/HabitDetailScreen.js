import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { habitService } from '../services/habitService';
import { authService } from '../services/authService';

export default function HabitDetailScreen({ route, navigation }) {

  const { habit } = route.params;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [category, setCategory] = useState(habit.category);

  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showEditModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      slideAnim.setValue(300);
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
    const today = new Date();
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (history.includes(dateStr)) count++;
    }

    return Math.round((count / 7) * 100);
  };

  const porcentaje = calculateWeeklyProgress();

  const getIcon = () => {
    switch (category) {
      case 'Salud': return 'fitness';
      case 'Trabajo': return 'briefcase';
      case 'Personal': return 'person';
      default: return 'star';
    }
  };

  const handleUpdate = async () => {
    try {
      const user = authService.getCurrentUser();

      await habitService.updateHabit(user.uid, habit.id, {
        name,
        description,
        category
      });

      Alert.alert("Éxito", "Hábito actualizado");
      setShowEditModal(false);

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDoneToday = async () => {
    try {
      const user = authService.getCurrentUser();
      await habitService.markHabitAsDone(user.uid, habit.id);
      loadData();
    } catch (error) {
      Alert.alert("Info", error.message);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1A73E8" />;
  }

  return (
    <View style={styles.container}>

      {/* HEADER CUSTOM */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Ionicons name="create-outline" size={24} />
        </TouchableOpacity>
      </View>

      {/* ICONO */}
      <View style={styles.iconBox}>
        <Ionicons name={getIcon()} size={40} color="#fff" />
      </View>

      {/* INFO */}
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.desc}>{description}</Text>

      {/* PROGRESO */}
      <View style={styles.progressBox}>
        <Text style={styles.percent}>{porcentaje}%</Text>

        <LinearGradient
          colors={['#4FACFE', '#00F2FE']}
          style={[styles.progressBar, { width: `${porcentaje}%` }]}
        />
      </View>

      {/* BOTÓN */}
      <TouchableOpacity style={styles.doneBtn} onPress={handleDoneToday}>
        <Text style={{ color: '#fff' }}>Marcar como hecho</Text>
      </TouchableOpacity>

      {/* HISTORIAL */}
      <FlatList
        data={history}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text>✅ {item}</Text>
          </View>
        )}
      />

      {/* MODAL PRO */}
      <Modal visible={showEditModal} transparent>
        <View style={styles.modalOverlay}>

          <Animated.View style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}>

            <Text style={styles.modalTitle}>Editar hábito</Text>

            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
            />

            <TextInput
              style={styles.modalInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción"
            />

            <Text style={styles.label}>Categoría</Text>

            <View style={styles.categoryRow}>
              {["Salud", "Trabajo", "Personal"].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={category === cat && { color: '#fff' }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Guardar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F7FF'
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40
  },

  iconBox: {
    alignSelf: 'center',
    backgroundColor: '#1A73E8',
    padding: 20,
    borderRadius: 50,
    marginTop: 20
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15
  },

  desc: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20
  },

  progressBox: {
    alignItems: 'center',
    marginBottom: 20
  },

  percent: {
    fontSize: 32,
    fontWeight: 'bold'
  },

  progressBar: {
    height: 10,
    borderRadius: 10,
    marginTop: 10
  },

  doneBtn: {
    backgroundColor: '#1A73E8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15
  },

  historyItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },

  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },

  modalInput: {
    backgroundColor: '#F5F7FB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 10
  },

  categoryRow: {
    flexDirection: 'row',
    marginBottom: 20
  },

  categoryChip: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 10
  },

  categoryActive: {
    backgroundColor: '#1A73E8'
  },

  saveBtn: {
    backgroundColor: '#1A73E8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center'
  },

  cancel: {
    textAlign: 'center',
    marginTop: 10,
    color: '#888'
  }

});