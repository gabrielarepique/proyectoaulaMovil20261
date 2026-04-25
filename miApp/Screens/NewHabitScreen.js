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
  ActivityIndicator
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';

export default function NewHabitScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('Diario');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor, ingresa el nombre del hábito.");
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      Alert.alert("Error", "No has iniciado sesión.");
      return;
    }

    setLoading(true);

    try {
      await habitService.createHabit(user.uid, { 
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        createdAt: new Date()
      });

      Alert.alert("Éxito", "Hábito creado correctamente");

      navigation.goBack();

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Nuevo Hábito</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Nombre del hábito" 
        value={name} 
        onChangeText={setName} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Descripción (opcional)" 
        value={description} 
        onChangeText={setDescription} 
        multiline
      />

      <Text style={styles.label}>Categoría:</Text>
      <View style={styles.pickerContainer}>
        <Picker 
          selectedValue={category} 
          onValueChange={(value) => setCategory(value)}
        >
          {['Salud', 'Trabajo', 'Personal', 'General'].map(c => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Frecuencia:</Text>
      <View style={styles.pickerContainer}>
        <Picker 
          selectedValue={frequency} 
          onValueChange={(value) => setFrequency(value)}
        >
          {['Diario', 'Semanal', 'Mensual'].map(f => (
            <Picker.Item key={f} label={f} value={f} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, loading && { opacity: 0.6 }]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Guardar Hábito</Text>
        )}
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 25, 
    backgroundColor: '#F0F7FF' 
  },

  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1A73E8', 
    marginBottom: 25, 
    textAlign: 'center' 
  },

  input: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1, 
    borderColor: '#D0E4FF', 
    fontSize: 16
  },

  label: { 
    fontSize: 14, 
    color: '#444', 
    marginBottom: 5, 
    marginLeft: 5 
  },

  pickerContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#D0E4FF' 
  },

  saveBtn: { 
    backgroundColor: '#1A73E8', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10 
  },

  saveBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});