import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(email.trim(), password);
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
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />

      {/* LOGO / TÍTULO */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>NOW</Text>
        <Text style={styles.subtitle}>Mis Hábitos</Text>
      </View>

      <Text style={styles.welcomeText}>Inicia sesión para continuar</Text>

      {/* EMAIL */}
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={20} color="#1A73E8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          selectionColor="#1A73E8"
        />
      </View>

      {/* PASSWORD */}
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color="#1A73E8" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          selectionColor="#1A73E8"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* BOTÓN LOGIN */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {/* LINK REGISTRO */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
        <Text style={styles.link}>
          ¿No tienes cuenta?{'  '}
          <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A73E8',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A7CC7',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#D0E4FF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#1A73E8',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  linkWrap: {
    alignItems: 'center',
  },
  link: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#1A73E8',
    fontWeight: 'bold',
  },
});
