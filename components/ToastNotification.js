/**
 * ToastNotification.js
 * Notificaciones in-app con estilo bonito.
 * Guardar en: components/ToastNotification.js
 *
 * Uso:
 *   import Toast, { showToast } from '../components/ToastNotification'; 
 *   showToast({ type: 'success', title: '¡Hábito completado!', message: 'Llevas 5 días seguidos 🔥' });
 *   showToast({ type: 'warning', title: 'Recuerda', message: 'Tienes 3 hábitos pendientes' });
 *   showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar' });
 *   showToast({ type: 'info', title: 'Info', message: 'Hábito ya completado hoy' });
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Singleton ref para poder llamar showToast() desde fuera del componente
let _showToast = null;

export function showToast({ type = 'success', title, message, duration = 3200 }) {
  if (_showToast) _showToast({ type, title, message, duration });
}

const CONFIGS = {
  success: {
    icon: 'checkmark-circle',
    bgFrom: '#1A73E8',
    bgTo: '#0D5FBF',
    accent: '#A8D5FF',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  warning: {
    icon: 'warning',
    bgFrom: '#FF9800',
    bgTo: '#E65100',
    accent: '#FFE0B2',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  error: {
    icon: 'close-circle',
    bgFrom: '#E53935',
    bgTo: '#B71C1C',
    accent: '#FFCDD2',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  info: {
    icon: 'information-circle',
    bgFrom: '#43A047',
    bgTo: '#2E7D32',
    accent: '#C8E6C9',
    iconBg: 'rgba(255,255,255,0.18)',
  },
};

export default function ToastNotification() {
  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 320, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, []);

  const show = useCallback(({ type, title, message, duration }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, title, message });

    translateY.setValue(-120);
    opacity.setValue(0);
    scale.setValue(0.92);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(hide, duration);
  }, [hide]);

  // Register global ref
  _showToast = show;

  if (!toast) return null;

  const cfg = CONFIGS[toast.type] || CONFIGS.success;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.card, { backgroundColor: cfg.bgFrom }]}>
        {/* Decoración de fondo */}
        <View style={[styles.blob, { backgroundColor: cfg.bgTo }]} />

        {/* Icono */}
        <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
          <Ionicons name={cfg.icon} size={26} color="#fff" />
        </View>

        {/* Texto */}
        <View style={styles.textBlock}>
          <Text style={styles.titleText} numberOfLines={1}>{toast.title}</Text>
          {toast.message ? (
            <Text style={styles.messageText} numberOfLines={2}>{toast.message}</Text>
          ) : null}
        </View>

        {/* Cerrar */}
        <TouchableOpacity onPress={hide} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Barra de progreso */}
      <ProgressBar duration={toast.duration ?? 3200} color={cfg.accent} />
    </Animated.View>
  );
}

function ProgressBar({ duration, color }) {
  const anim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    anim.setValue(1);
    Animated.timing(anim, {
      toValue: 0,
      duration: duration - 300,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
    gap: 12,
  },
  blob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -30,
    top: -40,
    opacity: 0.35,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  messageText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    marginTop: -1,
  },
  progressFill: {
    height: 3,
  },
});
