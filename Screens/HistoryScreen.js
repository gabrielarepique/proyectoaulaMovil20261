/**
 * HistoryScreen.js
 * Historial general del usuario con filtros por fecha y categoría.
 * Guardar en: screens/HistoryScreen.js
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, Modal, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { habitService } from '../services/habitService';
import { authService } from '../services/authService';

const CATEGORIES = ['Todas', 'Salud', 'Trabajo', 'Personal', 'General'];
const CAT_COLORS = { Salud: '#43E97B', Trabajo: '#4FACFE', Personal: '#FA709A', General: '#A18CD1', Todas: '#1A73E8' };
const CAT_ICONS = { Salud: 'fitness', Trabajo: 'briefcase', Personal: 'person', General: 'star', Todas: 'list' };

export default function HistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [habitHistories, setHabitHistories] = useState({});

  // Filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('Todas');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      for (const h of habitsData) {
        const hist = await habitService.getHabitHistory(user.uid, h.id);
        histories[h.id] = hist;
      }
      setHabitHistories(histories);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // Construye registros planos { date, habitId, habitName, category }
  const buildRecords = () => {
    const records = [];
    habits.forEach((h) => {
      const hist = habitHistories[h.id] || [];
      hist.forEach((date) => {
        records.push({ date, habitId: h.id, habitName: h.name, category: h.category || 'General' });
      });
    });
    return records;
  };

  const filteredRecords = () => {
    let records = buildRecords();

    if (category !== 'Todas') {
      records = records.filter((r) => r.category === category);
    }
    if (searchText.trim()) {
      records = records.filter((r) => r.habitName.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (dateFrom && dateFrom.length === 10) {
      records = records.filter((r) => r.date >= dateFrom);
    }
    if (dateTo && dateTo.length === 10) {
      records = records.filter((r) => r.date <= dateTo);
    }

    // Ordenar por fecha descendente
    records.sort((a, b) => (b.date > a.date ? 1 : -1));
    return records;
  };

  // Agrupa por fecha
  const groupByDate = (records) => {
    const groups = {};
    records.forEach((r) => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => (b > a ? 1 : -1));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (dateStr === today) return 'Hoy';
    if (dateStr === yStr) return 'Ayer';
    return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const autoFormatDate = (text, setter) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    if (cleaned.length > 7) cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
    setter(cleaned.slice(0, 10));
  };

  const hasActiveFilters = category !== 'Todas' || dateFrom || dateTo || searchText;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  const records = filteredRecords();
  const grouped = groupByDate(records);
  const totalRecords = buildRecords().length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A73E8" />
        </TouchableOpacity>
        <Text style={styles.title}>Historial</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[styles.iconBtn, hasActiveFilters && styles.iconBtnActive]}
        >
          <Ionicons name="options-outline" size={22} color={hasActiveFilters ? '#fff' : '#1A73E8'} />
        </TouchableOpacity>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          placeholder="Buscar hábito..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          selectionColor="#1A73E8"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* CHIPS CATEGORÍA rápidos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingRight: 30 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && { backgroundColor: CAT_COLORS[cat], borderColor: CAT_COLORS[cat] }]}
            onPress={() => setCategory(cat)}
          >
            <Ionicons name={CAT_ICONS[cat]} size={13} color={category === cat ? '#fff' : '#666'} />
            <Text style={[styles.catChipText, category === cat && { color: '#fff', fontWeight: '700' }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTADOR */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {records.length} de {totalRecords} registros
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={() => { setCategory('Todas'); setDateFrom(''); setDateTo(''); setSearchText(''); }}>
            <Text style={styles.clearText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA AGRUPADA */}
      {grouped.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={56} color="#C5D8F5" />
          <Text style={styles.emptyTitle}>Sin registros</Text>
          <Text style={styles.emptySubtext}>
            {hasActiveFilters ? 'Prueba con otros filtros' : 'Completa tus hábitos para verlos aquí'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: [date, entries] }) => (
            <View style={styles.group}>
              {/* Cabecera de fecha */}
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <View style={styles.dateBubble}>
                  <Text style={styles.dateBubbleText}>{formatDate(date)}</Text>
                </View>
                <View style={styles.dateLine} />
              </View>

              {/* Entradas del día */}
              {entries.map((r, idx) => (
                <View key={idx} style={styles.record}>
                  <View style={[styles.recordDot, { backgroundColor: CAT_COLORS[r.category] || '#AAA' }]} />
                  <View style={styles.recordContent}>
                    <Text style={styles.recordName}>{r.habitName}</Text>
                    <Text style={styles.recordCat}>{r.category}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* MODAL FILTROS AVANZADOS */}
      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtros avanzados</Text>

            <Text style={styles.filterLabel}>Categoría</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Fecha desde (AAAA-MM-DD)</Text>
            <View style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={18} color="#1A73E8" />
              <TextInput
                style={styles.dateInputText}
                placeholder="2025-01-01"
                placeholderTextColor="#999"
                value={dateFrom}
                onChangeText={(t) => autoFormatDate(t, setDateFrom)}
                keyboardType="numeric"
                maxLength={10}
                selectionColor="#1A73E8"
              />
              {dateFrom.length > 0 && (
                <TouchableOpacity onPress={() => setDateFrom('')}>
                  <Ionicons name="close-circle" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.filterLabel}>Fecha hasta (AAAA-MM-DD)</Text>
            <View style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={18} color="#1A73E8" />
              <TextInput
                style={styles.dateInputText}
                placeholder="2025-12-31"
                placeholderTextColor="#999"
                value={dateTo}
                onChangeText={(t) => autoFormatDate(t, setDateTo)}
                keyboardType="numeric"
                maxLength={10}
                selectionColor="#1A73E8"
              />
              {dateTo.length > 0 && (
                <TouchableOpacity onPress={() => setDateTo('')}>
                  <Ionicons name="close-circle" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setCategory('Todas'); setDateFrom(''); setDateTo(''); }}
              >
                <Text style={styles.resetBtnText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7FF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 44, paddingHorizontal: 20, marginBottom: 14,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F1FF', justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: { backgroundColor: '#1A73E8' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A73E8' },
  searchBox: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#D0E4FF', elevation: 1,
  },
  searchInput: { marginLeft: 10, flex: 1, color: '#222', fontSize: 15 },
  catScroll: { marginBottom: 10 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#D0E4FF',
  },
  catChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10,
  },
  countText: { fontSize: 12, color: '#888' },
  clearText: { fontSize: 12, color: '#1A73E8', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#AAA', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  group: { marginBottom: 8 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#D0E4FF' },
  dateBubble: {
    backgroundColor: '#E8F1FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10,
  },
  dateBubbleText: { fontSize: 12, fontWeight: '700', color: '#1A73E8' },
  record: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 8, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  recordDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  recordContent: { flex: 1 },
  recordName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  recordCat: { fontSize: 11, color: '#888', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F0F4FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#D0E4FF' },
  chipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FB',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#D0E4FF',
    paddingHorizontal: 14, marginBottom: 16, gap: 10,
  },
  dateInputText: { flex: 1, fontSize: 15, color: '#222', paddingVertical: 12 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  resetBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F0F4FF', alignItems: 'center', borderWidth: 1.5, borderColor: '#D0E4FF' },
  resetBtnText: { color: '#555', fontWeight: '600' },
  applyBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#1A73E8', alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
