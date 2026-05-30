import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { habitService } from '../services/habitService';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) return Alert.alert('Error', 'Ingresa tu nombre completo');
    if (!email.trim()) return Alert.alert('Error', 'Ingresa tu correo');
    if (!password) return Alert.alert('Error', 'Ingresa una contraseña');
    if (password.length < 6) return Alert.alert('Error', 'Mínimo 6 caracteres');
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden');

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await habitService.createUserProfile(user.uid, {
        fullName: fullName.trim(),
        email: email.trim(),
      });

      Alert.alert('¡Éxito!', 'Cuenta creada correctamente');
    } catch (error) {
      let message = 'Error al registrarse';
      if (error.code === 'auth/email-already-in-use') message = 'Este correo ya está registrado';
      else if (error.code === 'auth/invalid-email') message = 'Correo inválido';
      Alert.alert('Error', message);
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
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A73E8" />
        </TouchableOpacity>

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a NOW · Mis Hábitos</Text>
        </View>

        {/* NOMBRE */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#1A73E8" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            selectionColor="#1A73E8"
          />
        </View>

        {/* EMAIL */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#1A73E8" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor="#1A73E8"
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#1A73E8" style={styles.icon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Contraseña (mín. 6 caracteres)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            selectionColor="#1A73E8"
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#1A73E8" style={styles.icon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Confirmar contraseña"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPass}
            selectionColor="#1A73E8"
          />
          <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeIcon}>
            <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* BOTÓN */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta?{'  '}
            <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backBtn: {
    marginTop: 20,
    marginBottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A73E8',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#4A7CC7',
    marginTop: 4,
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
  icon: {
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
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
