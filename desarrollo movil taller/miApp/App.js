import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importamos tus pantallas
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import HomeScreen from './Screens/HomeScreen';

// Importamos el servicio de autenticación
import { authService } from './services/authService';

const Stack = createStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Escuchar cambios en el estado de Firebase (Login/Logout)
  useEffect(() => {
    const subscriber = authService.subscribeToAuthState((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber; // Limpieza al desmontar
  }, []);

  if (initializing) return null; // Puedes poner un <ActivityIndicator /> aquí

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Si hay usuario, solo mostramos la pantalla principal
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Mis Hábitos' }} 
          />
        ) : (
          // Si no hay usuario, mostramos las pantallas de acceso
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: 'Crear Cuenta' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}