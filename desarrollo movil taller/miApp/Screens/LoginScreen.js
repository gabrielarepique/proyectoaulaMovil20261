import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { authService } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      // La navegación la maneja App.js al detectar el cambio de estado
    } catch (error) {
      Alert.alert('Error al iniciar sesión', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Mis Hábitos</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F0F7FF',
    justifyContent: 'center', paddingHorizontal: 28,
  },
  title: {
    fontSize: 36, fontWeight: '800', color: '#1A73E8',
    textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#333', marginBottom: 14,
    borderWidth: 1, borderColor: '#D0E4FF',
    shadowColor: '#1A73E8', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 1,
  },
  button: {
    backgroundColor: '#1A73E8', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 20,
    shadowColor: '#1A73E8', shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkBold: { color: '#1A73E8', fontWeight: '700' },
});