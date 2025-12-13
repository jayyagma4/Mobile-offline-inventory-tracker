import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductType } from '../db/types';
import { useBootstrapData, useDataStore } from '../state/useData';
import { formatPHP } from '../utils/currency';

export function ProductsScreen() {
  useBootstrapData();
  const { products, saveProduct, adjustStock, loading } = useDataStore((s) => ({
    products: s.products,
    saveProduct: s.saveProduct,
    adjustStock: s.adjustStock,
    loading: s.loading,
  }));

  const lowStock = products.filter((p) => p.qty_on_hand <= 3);

  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('clothing');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    setStock('');
  }, [products.length]);

  const handleAdd = async () => {
    const unit = parseFloat(unitCost);
    const pr = parseFloat(price);
    const st = parseInt(stock || '0', 10) || 0;
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }
    if (isNaN(unit)) {
      Alert.alert('Enter unit cost');
      return;
    }
    if (isNaN(pr)) {
      Alert.alert('Enter suggested price');
      return;
    }
    try {
      await saveProduct({
        name: name.trim(),
        type,
        color: color || null,
        size: size || null,
        unit_cost: unit,
        price_suggested: pr,
        qty_on_hand: st,
      });
      setName('');
      setColor('');
      setSize('');
      setUnitCost('');
      setPrice('');
      setStock('');
      Alert.alert('Saved', 'Product added');
    } catch (e) {
      Alert.alert('Error', 'Could not save product');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>
            {item.type} {item.color ? `• ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}
          </Text>
          <Text style={styles.subtitle}>
            Cost {formatPHP(item.unit_cost)} • Price {formatPHP(item.price_suggested)}
          </Text>
          <Text style={styles.subtitle}>Stock: {item.qty_on_hand}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.labelSmall}>Adjust stock</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.pill} onPress={() => adjustStock(item.id, -1)}>
              <Text style={styles.pillText}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => adjustStock(item.id, 1)}>
              <Text style={styles.pillText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => adjustStock(item.id, 5)}>
              <Text style={styles.pillText}>+5</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Products & Inventory</Text>

            {lowStock.length > 0 && (
              <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>Low stock (≤3)</Text>
                {lowStock.map((p) => (
                  <View key={p.id} style={styles.alertRow}>
                    <Text style={styles.alertItem}>
                      {p.name} — {p.qty_on_hand} left
                    </Text>
                    <TouchableOpacity style={styles.restockBtn} onPress={() => adjustStock(p.id, 5)}>
                      <Text style={styles.restockText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Oversized Tee - Black"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.row}>
              {(['clothing', 'cap'] as ProductType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, type === t && styles.pillActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={styles.pillText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Color (optional)</Text>
            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="Black / Navy / White"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Size (optional)</Text>
            <TextInput
              style={styles.input}
              value={size}
              onChangeText={setSize}
              placeholder="S / M / L / XL"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Unit cost</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={unitCost}
              onChangeText={setUnitCost}
              placeholder="0"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Suggested price</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Initial stock</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              placeholderTextColor="#6b7280"
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={loading}
            >
              <Text style={styles.saveText}>{loading ? 'Saving…' : 'Add Product'}</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { marginTop: 24 }]}>Inventory</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  heading: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  title: { color: '#e5e7eb', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  label: { color: '#9ca3af', marginTop: 16, marginBottom: 8, fontWeight: '600' },
  labelSmall: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  pillActive: { borderColor: '#22d3ee', backgroundColor: '#0b172a' },
  pillText: { color: '#e5e7eb' },
  input: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#e5e7eb',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#22d3ee',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  adjustRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  alertCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f97316',
    marginBottom: 12,
  },
  alertTitle: { color: '#f97316', fontWeight: '800', marginBottom: 6 },
  alertItem: { color: '#fbbf24', fontSize: 13, marginTop: 2 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  restockBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#22d3ee' },
  restockText: { color: '#0b1220', fontWeight: '800' },
});
