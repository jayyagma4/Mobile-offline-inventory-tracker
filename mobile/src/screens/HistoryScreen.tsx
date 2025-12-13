import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBootstrapData, useDataStore } from '../state/useData';
import { subDays } from 'date-fns';
import { formatPHP } from '../utils/currency';

type HistoryItem =
  | ({ kind: 'sale' } & ReturnType<typeof mapSale> extends infer T ? T : never)
  | ({ kind: 'expense' } & ReturnType<typeof mapExpense> extends infer T ? T : never);

const mapSale = (s: any) => ({
  id: s.id,
  kind: 'sale' as const,
  title: s.name ?? 'Sale',
  subtitle: `${s.channel ?? 'Walk-in'} • ${s.payment_method ?? 'Cash'}`,
  amount: s.sale_price * s.qty - (s.fee ?? 0),
  raw: s,
});

const mapExpense = (e: any) => ({
  id: e.id,
  kind: 'expense' as const,
  title: e.category,
  subtitle: e.supplier ? `${e.supplier}` : 'Expense',
  amount: -1 * (e.amount + (e.fee ?? 0)),
  raw: e,
});

export function HistoryScreen() {
  useBootstrapData();
  const { sales, expenses, removeSale, removeExpense, returnSale, loading, refreshAll } = useDataStore((s) => ({
    sales: s.sales,
    expenses: s.expenses,
    removeSale: s.removeSale,
    removeExpense: s.removeExpense,
    returnSale: s.returnSale,
    editSale: s.editSale,
    editExpense: s.editExpense,
    loading: s.loading,
    refreshAll: s.refreshAll,
  }));

  const [showSales, setShowSales] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [range, setRange] = useState<'all' | '7d' | '30d'>('all');
  const [editing, setEditing] = useState<{ kind: 'sale' | 'expense'; id: number } | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editNote, setEditNote] = useState('');

  const items: HistoryItem[] = useMemo(() => {
    const cutoff =
      range === 'all'
        ? null
        : subDays(new Date(), range === '7d' ? 7 : 30).getTime();
    const filterByDate = (d: string) => {
      if (!cutoff) return true;
      return new Date(d).getTime() >= cutoff;
    };
    return [
      ...(showSales ? sales.filter((s) => filterByDate(s.date)).map(mapSale) : []),
      ...(showExpenses ? expenses.filter((e) => filterByDate(e.date)).map(mapExpense) : []),
    ].sort((a, b) => {
      const da = new Date(a.raw.date).getTime();
      const db = new Date(b.raw.date).getTime();
      return db - da;
    });
  }, [sales, expenses, showSales, showExpenses, range]);

  const handleDelete = (item: HistoryItem) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (item.kind === 'sale') {
            await removeSale(item.id);
          } else {
            await removeExpense(item.id);
          }
          await refreshAll();
        },
      },
    ]);
  };

  const handleReturn = (item: HistoryItem) => {
    if (item.kind !== 'sale') return;
    Alert.alert('Return', 'Mark this sale as returned and restock items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return',
        style: 'destructive',
        onPress: async () => {
          await returnSale(item.id);
          await refreshAll();
        },
      },
    ]);
  };

  const handleEditOpen = (item: HistoryItem) => {
    setEditing({ kind: item.kind, id: item.id });
    if (item.kind === 'sale') {
      setEditQty(String(item.raw.qty));
      setEditPrice(String(item.raw.sale_price));
      setEditFee(String(item.raw.fee ?? 0));
      setEditNote(item.raw.note ?? '');
    } else {
      setEditAmount(String(item.raw.amount));
      setEditFee(String(item.raw.fee ?? 0));
      setEditNote(item.raw.note ?? '');
    }
  };

  const handleEditSave = async () => {
    if (!editing) return;
    if (editing.kind === 'sale') {
      const qtyNum = parseFloat(editQty);
      const priceNum = parseFloat(editPrice);
      const feeNum = parseFloat(editFee) || 0;
      if (isNaN(qtyNum) || isNaN(priceNum)) {
        Alert.alert('Enter valid qty/price');
        return;
      }
      await useDataStore.getState().editSale(editing.id, { qty: qtyNum, sale_price: priceNum, fee: feeNum, note: editNote });
    } else {
      const amtNum = parseFloat(editAmount);
      const feeNum = parseFloat(editFee) || 0;
      if (isNaN(amtNum)) {
        Alert.alert('Enter valid amount');
        return;
      }
      await useDataStore.getState().editExpense(editing.id, { amount: amtNum, fee: feeNum, note: editNote });
    }
    setEditing(null);
    await refreshAll();
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.meta}>{new Date(item.raw.date).toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, item.kind === 'sale' ? styles.positive : styles.negative]}>
            {item.kind === 'sale' ? '+' : '-'}{formatPHP(Math.abs(item.amount))}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {item.kind === 'sale' && (
              <TouchableOpacity onPress={() => handleReturn(item)} style={styles.returnBtn}>
                <Text style={styles.returnText}>Return</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleEditOpen(item)} style={styles.editBtn}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sales</Text>
          <Switch value={showSales} onValueChange={setShowSales} thumbColor="#22d3ee" />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Expenses</Text>
          <Switch value={showExpenses} onValueChange={setShowExpenses} thumbColor="#22d3ee" />
        </View>
        <View style={[styles.filterRow, { marginTop: 8 }]}>
          <Text style={styles.filterLabel}>Date</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['all', '7d', '30d'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, range === r && styles.pillActive]}
                onPress={() => setRange(r)}
              >
                <Text style={styles.pillText}>{r === 'all' ? 'All' : r.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.subtitle}>No history yet</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={refreshAll}
      />

      <Modal transparent visible={!!editing} animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)}>
          <View />
        </Pressable>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Edit {editing?.kind === 'sale' ? 'Sale' : 'Expense'}</Text>
          {editing?.kind === 'sale' ? (
            <>
              <Text style={styles.label}>Qty</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editQty}
                onChangeText={setEditQty}
              />
              <Text style={styles.label}>Price (₱)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editPrice}
                onChangeText={setEditPrice}
              />
              <Text style={styles.label}>Fee (₱)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editFee}
                onChangeText={setEditFee}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Amount (₱)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
              />
              <Text style={styles.label}>Fee (₱)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editFee}
                onChangeText={setEditFee}
              />
            </>
          )}
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            multiline
            value={editNote}
            onChangeText={setEditNote}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#1f2937' }]} onPress={() => setEditing(null)}>
              <Text style={[styles.buttonText, { color: '#e5e7eb' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={handleEditSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  filters: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterLabel: { color: '#e5e7eb', fontWeight: '600' },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  title: { color: '#e5e7eb', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  meta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800' },
  positive: { color: '#22d3ee' },
  negative: { color: '#f97316' },
  deleteBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#1f2937' },
  deleteText: { color: '#f87171', fontWeight: '700' },
  empty: { padding: 24, alignItems: 'center' },
  returnBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#22d3ee',
  },
  returnText: { color: '#22d3ee', fontWeight: '700' },
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
  editBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#22d3ee' },
  editText: { color: '#22d3ee', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '25%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#e5e7eb',
    marginTop: 6,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#22d3ee',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  label: { color: '#9ca3af', marginTop: 12, marginBottom: 6, fontWeight: '600' },
});
