import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDataStore, useBootstrapData } from '../state/useData';
import { ProductWithInventory } from '../db/types';
import { formatPHP } from '../utils/currency';

const qtyPresets = [1, 3, 5];
const channels = ['Walk-in', 'Shopee', 'Lazada', 'Facebook', 'Instagram'];
const payments = ['Cash', 'GCash', 'Card'];
const channelFeePerc: Record<string, number> = {
  'Walk-in': 0,
  Shopee: 0.11,
  Lazada: 0.11,
  Facebook: 0.03,
  Instagram: 0.03,
};
const paymentFeePerc: Record<string, number> = {
  Cash: 0,
  GCash: 0.025,
  Card: 0.03,
};

export function QuickAddSaleScreen() {
  useBootstrapData();
  const { products, addQuickSale, loading } = useDataStore((s) => ({
    products: s.products,
    addQuickSale: s.addQuickSale,
    loading: s.loading,
  }));

  const [selected, setSelected] = useState<ProductWithInventory | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<string>('0');
  const [channel, setChannel] = useState<string | null>('Walk-in');
  const [payment, setPayment] = useState<string | null>('Cash');
  const [fee, setFee] = useState<string>('0');
  const [note, setNote] = useState('');
  const [feeTouched, setFeeTouched] = useState(false);

  useEffect(() => {
    if (products.length > 0 && !selected) {
      const first = products[0];
      setSelected(first);
      setPrice(String(first.price_suggested ?? 0));
    }
  }, [products, selected]);

  useEffect(() => {
    if (!selected) return;
    if (feeTouched) return;
    const p = parseFloat(price) || 0;
    const qtyVal = qty || 0;
    const channelRate = channel ? channelFeePerc[channel] ?? 0 : 0;
    const paymentRate = payment ? paymentFeePerc[payment] ?? 0 : 0;
    const subtotal = p * qtyVal;
    const computed = subtotal * (channelRate + paymentRate);
    setFee(computed > 0 ? computed.toFixed(2) : '0');
  }, [channel, payment, price, qty, selected, feeTouched]);

  const total = useMemo(() => {
    const p = parseFloat(price) || 0;
    const f = parseFloat(fee) || 0;
    return qty * p - f;
  }, [price, qty, fee]);

  const marginInfo = useMemo(() => {
    if (!selected) return null;
    const unitCost = selected.unit_cost || 0;
    const f = parseFloat(fee) || 0;
    const p = parseFloat(price) || 0;
    const revenue = p * qty;
    const cost = unitCost * qty;
    const net = revenue - f;
    const margin = net - cost;
    return { unitCost, revenue, cost, net, margin };
  }, [selected, price, qty, fee]);

  const handleSave = async () => {
    if (!selected) {
      Alert.alert('Pick a product');
      return;
    }
    if (qty <= 0) {
      Alert.alert('Quantity must be at least 1');
      return;
    }
    const salePrice = parseFloat(price) || 0;
    const feeValue = parseFloat(fee) || 0;
    try {
      await addQuickSale({
        product_id: selected.id,
        qty,
        sale_price: salePrice,
        channel,
        payment_method: payment,
        fee: feeValue,
        date: new Date().toISOString(),
        note: note || null,
      });
      setQty(1);
      setFee('0');
      setFeeTouched(false);
      setNote('');
      Alert.alert('Saved', 'Sale recorded');
    } catch (e) {
      Alert.alert('Error', 'Could not save sale');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.heading}>Quick Sale</Text>

        <Text style={styles.label}>Product</Text>
        <View style={styles.cardRow}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chip,
                selected?.id === p.id && styles.chipActive,
                p.qty_on_hand <= 3 && styles.lowStock,
              ]}
              onPress={() => {
                setSelected(p);
                setPrice(String(p.price_suggested ?? 0));
              }}
            >
              <Text style={styles.chipText}>{p.name}</Text>
              <Text style={styles.chipSub}>Stock: {p.qty_on_hand}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Quantity</Text>
        <View style={styles.row}>
          {qtyPresets.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.pill, qty === n && styles.pillActive]}
              onPress={() => setQty(n)}
            >
              <Text style={styles.pillText}>{n}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(qty)}
            onChangeText={(t) => setQty(Number(t) || 0)}
            placeholder="Qty"
            placeholderTextColor="#6b7280"
          />
        </View>

        <Text style={styles.label}>Sale price per item (₱)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          placeholder="Price"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Channel</Text>
        <View style={styles.row}>
          {channels.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, channel === c && styles.pillActive]}
              onPress={() => setChannel(c)}
            >
              <Text style={styles.pillText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <Text style={styles.label}>Fee (GCash/marketplace) (₱)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={fee}
          onChangeText={(t) => {
            setFee(t);
            setFeeTouched(true);
          }}
          placeholder="0"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="e.g., rush order, discount applied"
          placeholderTextColor="#6b7280"
        />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Net (qty x price - fee):</Text>
          <Text style={styles.summaryValue}>{formatPHP(total)}</Text>
        </View>
        {marginInfo && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.meta}>
              Unit cost: {formatPHP(marginInfo.unitCost)} • Net margin: {formatPHP(marginInfo.margin)}
            </Text>
            {marginInfo.margin < 0 ? (
              <Text style={styles.warning}>Warning: Under cost by {formatPHP(Math.abs(marginInfo.margin))}</Text>
            ) : marginInfo.margin < marginInfo.cost * 0.1 ? (
              <Text style={styles.caution}>Heads up: Margin below 10%</Text>
            ) : null}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>{loading ? 'Saving…' : 'Save Sale'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  heading: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { color: '#9ca3af', marginTop: 16, marginBottom: 8, fontWeight: '600' },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    minWidth: '45%',
  },
  chipActive: { borderColor: '#22d3ee', backgroundColor: '#0b172a' },
  lowStock: { borderColor: '#f97316' },
  chipText: { color: '#e5e7eb', fontWeight: '700' },
  chipSub: { color: '#9ca3af', marginTop: 4, fontSize: 12 },
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
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#e5e7eb',
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: { color: '#9ca3af' },
  summaryValue: { color: '#22d3ee', fontWeight: '700', fontSize: 16 },
  meta: { color: '#9ca3af', fontSize: 12 },
  warning: { color: '#f87171', marginTop: 4, fontWeight: '700' },
  caution: { color: '#fbbf24', marginTop: 4, fontWeight: '700' },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#22d3ee',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
});
