/**
 * StatsScreen.js
 * Panel de estadísticas básicas: cumplimiento semanal/mensual.
 * Guardar en: screens/StatsScreen.js
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';

// Genera los últimos N días como strings YYYY-MM-DD
const lastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Pequeña barra horizontal
function StatBar({ value, max, color }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { height: 10, backgroundColor: '#E8F1FF', borderRadius: 10, overflow: 'hidden', flex: 1 },
  fill: { height: 10, borderRadius: 10 },
});

// Mini gráfica de puntos para los últimos 7 días
function WeekDots({ days, allHistory }) {
  return (
    <View style={dotStyles.row}>
      {days.map((day) => {
        const done = allHistory.some((h) => h.includes(day));
        const label = new Date(day + 'T12:00:00').toLocaleDateString('es', { weekday: 'narrow' });
        return (
          <View key={day} style={dotStyles.col}>
            <View style={[dotStyles.dot, done ? dotStyles.dotDone : dotStyles.dotEmpty]} />
            <Text style={dotStyles.label}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  col: { alignItems: 'center', flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, marginBottom: 4 },
  dotDone: { backgroundColor: '#1A73E8' },
  dotEmpty: { backgroundColor: '#E8F1FF', borderWidth: 1.5, borderColor: '#C5D8F5' },
  label: { fontSize: 10, color: '#888' },
});

export default function StatsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [allHistory, setAllHistory] = useState([]); // array of arrays
  const [habitHistories, setHabitHistories] = useState({}); // habitId -> [dates]

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) return;
      const habitsData = await habitService.getHabits(user.uid);
      setHabits(habitsData);

      const histories = {};
      const all = [];
      for (const h of habitsData) {
        const hist = await habitService.getHabitHistory(user.uid, h.id);
        histories[h.id] = hist;
        all.push(hist);
      }
      setHabitHistories(histories);
      setAllHistory(all);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ---- Cálculos globales ----
  const today = new Date().toISOString().split('T')[0];
  const week7 = lastNDays(7);
  const month30 = lastNDays(30);

  const totalHabits = habits.length;

  // Cuántos hábitos completados hoy
  const doneToday = habits.filter((h) => (habitHistories[h.id] || []).includes(today)).length;
  const pendingToday = totalHabits - doneToday;

  // Meta activa/cumplida/vencida
  const active = habits.filter((h) => !h.deadline || h.deadline >= today).length;
  const expired = habits.filter((h) => h.deadline && h.deadline < today).length;

  // Cumplimiento semanal global (% de (hábito x día) completados en últimos 7 días)
  const possibleWeek = totalHabits * 7;
  let doneWeek = 0;
  Object.values(habitHistories).forEach((hist) => {
    week7.forEach((d) => { if (hist.includes(d)) doneWeek++; });
  });
  const weeklyPct = possibleWeek === 0 ? 0 : Math.round((doneWeek / possibleWeek) * 100);

  // Cumplimiento mensual
  const possibleMonth = totalHabits * 30;
  let doneMonth = 0;
  Object.values(habitHistories).forEach((hist) => {
    month30.forEach((d) => { if (hist.includes(d)) doneMonth++; });
  });
  const monthlyPct = possibleMonth === 0 ? 0 : Math.round((doneMonth / possibleMonth) * 100);

  // Mejor racha global
  const bestStreak = Math.max(0, ...Object.values(habitHistories).map((hist) => habitService.calculateStreak(hist)));

  // Total días completados (todas las entradas únicas sumadas)
  const totalDays = Object.values(habitHistories).reduce((sum, h) => sum + h.length, 0);

  // Por categoría
  const catMap = {};
  habits.forEach((h) => {
    const cat = h.category || 'General';
    if (!catMap[cat]) catMap[cat] = { total: 0, done: 0 };
    catMap[cat].total++;
    const hist = habitHistories[h.id] || [];
    if (hist.includes(today)) catMap[cat].done++;
  });

  const CAT_COLORS = { Salud: '#43E97B', Trabajo: '#4FACFE', Personal: '#FA709A', General: '#A18CD1' };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A73E8" />
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* RESUMEN RÁPIDO */}
        <View style={styles.grid2}>
          <StatCard icon="today" color="#1A73E8" bg="#E8F1FF" value={doneToday} label="Completados hoy" />
          <StatCard icon="time-outline" color="#E65100" bg="#FFF3E0" value={pendingToday} label="Pendientes hoy" />
          <StatCard icon="flame" color="#FF6B00" bg="#FFF3E0" value={bestStreak} label="Mejor racha" />
          <StatCard icon="checkmark-done" color="#2E7D32" bg="#E8F5E9" value={totalDays} label="Total registros" />
        </View>

        {/* METAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de metas</Text>
          <View style={styles.goalsRow}>
            <GoalBadge count={active} label="Activas" color="#1A73E8" icon="radio-button-on" />
            <GoalBadge count={expired} label="Vencidas" color="#E53935" icon="alert-circle" />
          </View>
        </View>

        {/* CUMPLIMIENTO SEMANAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos 7 días</Text>
          <View style={styles.pctRow}>
            <Text style={styles.bigPct}>{weeklyPct}%</Text>
            <Text style={styles.pctLabel}>cumplimiento{'\n'}semanal</Text>
          </View>
          <WeekDots days={week7} allHistory={Object.values(habitHistories).flat()} />
          <View style={styles.motiveLine}>
            <Text style={styles.motiveText}>
              {weeklyPct >= 80 ? '🚀 ¡Semana excelente! Sigue así.' :
               weeklyPct >= 50 ? '💪 Buen ritmo, ¡no pares!' :
               '🌱 Cada día cuenta. ¡Tú puedes!'}
            </Text>
          </View>
        </View>

        {/* CUMPLIMIENTO MENSUAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos 30 días</Text>
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cumplimiento mensual</Text>
              <Text style={styles.progressPct}>{monthlyPct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${monthlyPct}%` }]} />
            </View>
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Esta semana</Text>
              <Text style={styles.progressPct}>{weeklyPct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${weeklyPct}%`, backgroundColor: '#43E97B' }]} />
            </View>
          </View>
        </View>

        {/* POR CATEGORÍA */}
        {Object.keys(catMap).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Por categoría (hoy)</Text>
            {Object.entries(catMap).map(([cat, { total, done }]) => (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: CAT_COLORS[cat] || '#AAA' }]} />
                <Text style={styles.catName}>{cat}</Text>
                <StatBar value={done} max={total} color={CAT_COLORS[cat] || '#AAA'} />
                <Text style={styles.catFrac}>{done}/{total}</Text>
              </View>
            ))}
          </View>
        )}

        {/* POR HÁBITO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle por hábito (7 días)</Text>
          {habits.length === 0 && (
            <Text style={styles.emptyText}>Aún no tienes hábitos creados.</Text>
          )}
          {habits.map((h) => {
            const hist = habitHistories[h.id] || [];
            const cnt = week7.filter((d) => hist.includes(d)).length;
            const pct = Math.round((cnt / 7) * 100);
            return (
              <View key={h.id} style={styles.habitStatRow}>
                <Text style={styles.habitStatName} numberOfLines={1}>{h.name}</Text>
                <StatBar value={cnt} max={7} color="#1A73E8" />
                <Text style={styles.habitStatPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, color, bg, value, label }) {
  return (
    <View style={[cardSt.card, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[cardSt.val, { color }]}>{value}</Text>
      <Text style={cardSt.lbl}>{label}</Text>
    </View>
  );
}
const cardSt = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', margin: 4, minWidth: '44%' },
  val: { fontSize: 26, fontWeight: '800', marginTop: 6 },
  lbl: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
});

function GoalBadge({ count, label, color, icon }) {
  return (
    <View style={[badgeSt.badge, { borderColor: color + '44', backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[badgeSt.count, { color }]}>{count}</Text>
      <Text style={badgeSt.label}>{label}</Text>
    </View>
  );
}
const badgeSt = StyleSheet.create({
  badge: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center', margin: 4 },
  count: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  label: { fontSize: 12, color: '#888', marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7FF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 44, paddingHorizontal: 20, marginBottom: 16,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F1FF', justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A73E8' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 4 },
  section: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20,
    marginBottom: 14, padding: 18, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 14 },
  goalsRow: { flexDirection: 'row', gap: 10 },
  pctRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 4 },
  bigPct: { fontSize: 52, fontWeight: '900', color: '#1A73E8', lineHeight: 58 },
  pctLabel: { fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 18 },
  motiveLine: { marginTop: 12, backgroundColor: '#F0F7FF', borderRadius: 10, padding: 10 },
  motiveText: { fontSize: 13, color: '#4A7CC7', fontWeight: '500', textAlign: 'center' },
  progressWrap: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#1A73E8' },
  progressTrack: { height: 12, backgroundColor: '#E8F1FF', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: 12, borderRadius: 10, backgroundColor: '#1A73E8', minWidth: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 13, fontWeight: '600', color: '#444', width: 70 },
  catFrac: { fontSize: 12, color: '#888', fontWeight: '600', width: 28, textAlign: 'right' },
  habitStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  habitStatName: { fontSize: 13, color: '#333', fontWeight: '600', width: 100 },
  habitStatPct: { fontSize: 12, fontWeight: '700', color: '#1A73E8', width: 36, textAlign: 'right' },
  emptyText: { color: '#AAA', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
});
