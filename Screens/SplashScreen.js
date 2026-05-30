/**
 * SplashScreen.js
 * Pantalla de bienvenida que se muestra al abrir la app.
 * Guardar en: screens/SplashScreen.js
 *
 * En App.js, muestra esta pantalla por ~2s antes de decidir
 * si ir a Login o Home según el estado de auth.
 *
 * Ejemplo de uso en App.js:
 *
 *   const [appReady, setAppReady] = useState(false);
 *
 *   if (!appReady) {
 *     return <SplashScreen onFinish={() => setAppReady(true)} />;
 *   }
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import AppLogo from '../components/AppLogo';

const { width, height } = Dimensions.get('window');

function DotGrid() {
  const dots = [];
  const cols = Math.ceil(width / 32);
  const rows = Math.ceil(height / 32);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View key={`${r}-${c}`} style={{
          position: 'absolute', width: 2.5, height: 2.5, borderRadius: 1.5,
          backgroundColor: '#B8D4F8', top: r * 32 + 6, left: c * 32 + 6,
        }} />
      );
    }
  }
  return <View style={StyleSheet.absoluteFillObject} pointerEvents="none">{dots}</View>;
}

export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo aparece con spring
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Texto aparece
      Animated.timing(textOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      // Pausa
      Animated.delay(700),
      // Fade out
      Animated.timing(exitOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDF4FF" />
      <DotGrid />
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <AppLogo size={110} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>NOW</Text>
        <Text style={styles.tagline}>Mis Hábitos</Text>
        <View style={styles.divider} />
        <Text style={styles.sub}>Construye tu mejor versión</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#EDF4FF',
    justifyContent: 'center', alignItems: 'center',
  },
  blobTop: {
    position: 'absolute', top: -height * 0.22, left: -width * 0.3,
    width: width * 1.6, height: height * 0.44,
    borderRadius: width * 0.8, backgroundColor: '#1A73E8', opacity: 0.08,
  },
  blobBottom: {
    position: 'absolute', bottom: -height * 0.18, right: -width * 0.3,
    width: width * 1.4, height: height * 0.36,
    borderRadius: width * 0.7, backgroundColor: '#1A73E8', opacity: 0.06,
  },
  logoWrap: { marginBottom: 28 },
  appName: {
    fontSize: 42, fontWeight: '900', color: '#1A73E8',
    letterSpacing: 4, marginBottom: 4,
  },
  tagline: {
    fontSize: 18, fontWeight: '600', color: '#4A7CC7',
    letterSpacing: 0.5, marginBottom: 16,
  },
  divider: {
    width: 40, height: 3, borderRadius: 2,
    backgroundColor: '#1A73E8', opacity: 0.4, marginBottom: 14,
  },
  sub: {
    fontSize: 13.5, color: '#94AFCE', fontWeight: '500', letterSpacing: 0.3,
  },
});