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
    // Validación básica de campos vacíos
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      // Nota: No necesitas navegar manualmente aquí. 
      // El 'onAuthStateChanged' en App.js detectará el login y cambiará la pantalla automáticamente.
    } catch (error) {
      // Manejo de errores de Firebase (ej. usuario no encontrado, contraseña incorrecta)
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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>
          ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
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
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#333', marginBottom: 14,
    borderWidth: 1, borderColor: '#D0E4FF',
  },
  button: {
    backgroundColor: '#1A73E8', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10, marginBottom: 20,
  },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
  link: {
    textAlign: 'center', color: '#666', fontSize: 14,
  },
  linkBold: {
    color: '#1A73E8', fontWeight: 'bold',
  }
});