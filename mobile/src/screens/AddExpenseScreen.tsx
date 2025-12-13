import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBootstrapData, useDataStore } from '../state/useData';

const expenseCategories = [
  'Fabric',
  'Screen printing / DTF',
  'Embroidery',
  'Packaging',
  'Shopee/Lazada fee',
  'GCash fee',
  'Delivery/rider',
  'Stall rent',
  'Electricity',
  'Ads',
  'Buttons/tags/labels',
];

const payments = ['Cash', 'GCash', 'Card'];

export function AddExpenseScreen() {
  useBootstrapData(false); // data not required to load expenses
  const { addQuickExpense, loading } = useDataStore((s) => ({
    addQuickExpense: s.addQuickExpense,
    loading: s.loading,
  }));

  const [category, setCategory] = useState<string>('Fabric');
  const [amount, setAmount] = useState<string>('');
  const [payment, setPayment] = useState<string | null>('Cash');
  const [fee, setFee] = useState<string>('0');
  const [supplier, setSupplier] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleSave = async () => {
    const value = parseFloat(amount);
    const feeValue = parseFloat(fee) || 0;
    if (isNaN(value) || value <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }
    try {
      await addQuickExpense({
        category,
        amount: value,
        payment_method: payment,
        fee: feeValue,
        date: new Date().toISOString(),
        supplier: supplier || null,
        note: note || null,
      });
      setAmount('');
      setFee('0');
      setSupplier('');
      setNote('');
      Alert.alert('Saved', 'Expense recorded');
    } catch (e) {
      Alert.alert('Error', 'Could not save expense');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.heading}>Add Expense</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {expenseCategories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, category === c && styles.pillActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={styles.pillText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Payment</Text>
        <View style={styles.row}>
          {payments.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.pill, payment === p && styles.pillActive]}
              onPress={() => setPayment(p)}
            >
              <Text style={styles.pillText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Fee (if any) (₱)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={fee}
          onChangeText={setFee}
          placeholder="0"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Supplier (optional)</Text>
        <TextInput
          style={styles.input}
          value={supplier}
          onChangeText={setSupplier}
          placeholder="Supplier name"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="e.g., paid cash, partial payment"
          placeholderTextColor="#6b7280"
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>{loading ? 'Saving…' : 'Save Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  heading: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { color: '#9ca3af', marginTop: 16, marginBottom: 8, fontWeight: '600' },
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
});
