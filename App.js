import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

// Screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import HomeScreen from './Screens/HomeScreen';
import NewHabitScreen from './Screens/NewHabitScreen';
import HabitDetailScreen from './Screens/HabitDetailScreen';
import SplashScreen from './Screens/SplashScreen';
import StatsScreen from './Screens/StatsScreen';  
import HistoryScreen from './Screens/HistoryScreen'; 

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(undefined);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userLogged) => {
      setUser(userLogged ?? null);
    });
    return unsubscribe;
  }, []);

  if (!splashDone || user === undefined) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen name="Home"        component={HomeScreen}        options={{ headerShown: false }} />
          <Stack.Screen name="NewHabit"    component={NewHabitScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Stats"       component={StatsScreen}       options={{ headerShown: false }} />   
          <Stack.Screen name="History"     component={HistoryScreen}     options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
