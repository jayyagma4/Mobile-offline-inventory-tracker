import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBootstrapData, useDataStore } from '../state/useData';
import { formatPHP } from '../utils/currency';

export function RestockScreen() {
  useBootstrapData();
  const { products, adjustStock, loading, refreshAll } = useDataStore((s) => ({
    products: s.products,
    adjustStock: s.adjustStock,
    loading: s.loading,
    refreshAll: s.refreshAll,
  }));

  const lowStock = useMemo(
    () => products.filter((p) => (p.qty_on_hand ?? 0) <= 5).sort((a, b) => a.qty_on_hand - b.qty_on_hand),
    [products]
  );

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>
          Stock: {item.qty_on_hand} • Cost {formatPHP(item.unit_cost)} • Price {formatPHP(item.price_suggested)}
        </Text>
      </View>
      <View style={styles.adjustRow}>
        {[1, 5, 10].map((n) => (
          <TouchableOpacity key={n} style={styles.pill} onPress={() => adjustStock(item.id, n)}>
            <Text style={styles.pillText}>+{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Restock</Text>
      <Text style={styles.subtitle}>
        Items at 5 or below. Quick buttons add to stock.
      </Text>
      <FlatList
        data={lowStock}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={loading}
        onRefresh={refreshAll}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.subtitle}>All stocks healthy.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  heading: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 12 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: '#e5e7eb', fontSize: 16, fontWeight: '700' },
  adjustRow: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22d3ee',
    backgroundColor: '#0b172a',
  },
  pillText: { color: '#22d3ee', fontWeight: '700' },
  empty: { padding: 24, alignItems: 'center' },
});
