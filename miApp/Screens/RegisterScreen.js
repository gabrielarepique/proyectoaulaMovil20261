import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { habitService } from '../services/habitService';

export default function RegisterScreen({ navigation }) {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {

    // 🔴 VALIDACIONES
    if (!fullName.trim()) {
      return Alert.alert("Error", "Ingresa tu nombre completo");
    }

    if (!email.trim()) {
      return Alert.alert("Error", "Ingresa tu correo");
    }

    if (!password) {
      return Alert.alert("Error", "Ingresa una contraseña");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Mínimo 6 caracteres");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Las contraseñas no coinciden");
    }

    setLoading(true);

    try {
      // 🔐 1. CREAR USUARIO EN FIREBASE AUTH
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // 🔥 2. GUARDAR NOMBRE EN FIRESTORE (CLAVE)
      await habitService.createUserProfile(user.uid, {
        fullName: fullName.trim(),
        email: email.trim()
      });

      console.log("Usuario creado y perfil guardado");

      Alert.alert("Éxito", "Cuenta creada correctamente");

      // ❗ NO navegar manualmente
      // App.js se encarga de redirigir automáticamente

    } catch (error) {
      console.log(error);

      let message = "Error al registrarse";

      if (error.code === 'auth/email-already-in-use') {
        message = "Este correo ya está registrado";
      } else if (error.code === 'auth/invalid-email') {
        message = "Correo inválido";
      }

      Alert.alert("Error", message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Crear Cuenta</Text>

      {/* 👤 NOMBRE */}
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* 📧 EMAIL */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* 🔒 PASSWORD */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* 🔒 CONFIRM PASSWORD */}
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* 🔥 BOTÓN */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#F0F7FF'
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A73E8',
    marginBottom: 30,
    textAlign: 'center'
  },

  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D0E4FF'
  },

  button: {
    backgroundColor: '#1A73E8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  link: {
    marginTop: 20,
    textAlign: 'center',
    color: '#1A73E8'
  }

});