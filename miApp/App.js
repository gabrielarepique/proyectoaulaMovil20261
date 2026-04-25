import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';

// Screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import HomeScreen from './Screens/HomeScreen';
import NewHabitScreen from './Screens/NewHabitScreen';
import HabitDetailScreen from './Screens/HabitDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 FORZAR LOGOUT AL INICIAR APP
  useEffect(() => {
    const forceLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.log("Error forzando logout:", error);
      }
    };

    forceLogout();
  }, []);

  // 🔐 ESCUCHAR ESTADO DE AUTENTICACIÓN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userLogged) => {
      setUser(userLogged);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // 🔓 USUARIO LOGUEADO
        <Stack.Navigator>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="NewHabit" 
            component={NewHabitScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HabitDetail" 
            component={HabitDetailScreen} 
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        // 🔐 NO LOGUEADO
        <Stack.Navigator>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}