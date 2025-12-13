import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { useBootstrapData, useDataStore } from '../state/useData';
import { formatPHP } from '../utils/currency';
import * as Victory from 'victory-native';
const { VictoryChart, VictoryLine, VictoryAxis, VictoryGroup, VictoryTheme }: any = Victory;

export function DashboardScreen() {
  useBootstrapData();
  const { sales, expenses, products, summary7d } = useDataStore((s) => ({
    sales: s.sales,
    expenses: s.expenses,
    products: s.products,
    summary7d: s.summary7d,
  }));

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTotals = useMemo(() => {
    const salesToday = sales.filter((s) => s.date.startsWith(today));
    const expensesToday = expenses.filter((e) => e.date.startsWith(today));
    const salesTotal = salesToday.reduce((acc, s) => acc + s.sale_price * s.qty - (s.fee ?? 0), 0);
    const expensesTotal = expensesToday.reduce((acc, e) => acc + e.amount + (e.fee ?? 0), 0);
    return { salesTotal, expensesTotal, profit: salesTotal - expensesTotal };
  }, [sales, expenses, today]);

  const bestSellers = useMemo(() => {
    const map = new Map<number, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      const prod = products.find((p) => p.id === s.product_id);
      const name = prod?.name ?? `SKU ${s.product_id}`;
      const entry = map.get(s.product_id) || { name, qty: 0, revenue: 0 };
      entry.qty += s.qty;
      entry.revenue += s.sale_price * s.qty;
      map.set(s.product_id, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const key = e.category || 'Other';
      map.set(key, (map.get(key) || 0) + e.amount + (e.fee ?? 0));
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const key = format(date, 'yyyy-MM-dd');
      return key;
    });
    return days.map((d) => {
      const salesTotal = sales
        .filter((s) => s.date.startsWith(d))
        .reduce((acc, s) => acc + s.sale_price * s.qty - (s.fee ?? 0), 0);
      const expensesTotal = expenses
        .filter((e) => e.date.startsWith(d))
        .reduce((acc, e) => acc + e.amount + (e.fee ?? 0), 0);
      return { day: d.slice(5), sales: salesTotal, expenses: expensesTotal, profit: salesTotal - expensesTotal };
    });
  }, [sales, expenses]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.heading}>Dashboard</Text>

        <View style={styles.row}>
          <Card title="Today Sales" value={formatPHP(todayTotals.salesTotal)} accent="#22d3ee" />
          <Card title="Today Expenses" value={formatPHP(todayTotals.expensesTotal)} accent="#f97316" />
        </View>
        <Card title="Today Profit" value={formatPHP(todayTotals.profit)} accent="#a78bfa" />

        <Text style={[styles.heading, { marginTop: 16 }]}>14-day Trend</Text>
        <View style={styles.chartCard}>
          <VictoryChart
            height={220}
            padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
            theme={VictoryTheme?.material ?? VictoryTheme}
            domainPadding={{ x: 12, y: 10 }}
          >
            <VictoryAxis
              tickFormat={(t: any) => String(t).slice(5)}
              style={{ tickLabels: { fill: '#9ca3af', fontSize: 10 }, axis: { stroke: '#1f2937' } }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t: any) => `₱${(Number(t) / 1000).toFixed(0)}k`}
              style={{ tickLabels: { fill: '#9ca3af', fontSize: 10 }, axis: { stroke: '#1f2937' }, grid: { stroke: '#1f2937' } }}
            />
            <VictoryGroup>
              <VictoryLine
                data={trend}
                x="day"
                y="sales"
                interpolation="monotoneX"
                style={{ data: { stroke: '#22d3ee', strokeWidth: 2 } }}
              />
              <VictoryLine
                data={trend}
                x="day"
                y="expenses"
                interpolation="monotoneX"
                style={{ data: { stroke: '#f97316', strokeWidth: 2 } }}
              />
              <VictoryLine
                data={trend}
                x="day"
                y="profit"
                interpolation="monotoneX"
                style={{ data: { stroke: '#a78bfa', strokeWidth: 2 } }}
              />
            </VictoryGroup>
          </VictoryChart>
          <View style={styles.legendRow}>
            <Legend color="#22d3ee" label="Sales" />
            <Legend color="#f97316" label="Expenses" />
            <Legend color="#a78bfa" label="Profit" />
          </View>
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <Card
            title="7-day Sales"
            value={formatPHP(summary7d?.salesTotal ?? 0)}
            accent="#22d3ee"
          />
          <Card
            title="7-day Expenses"
            value={formatPHP(summary7d?.expensesTotal ?? 0)}
            accent="#f97316"
          />
        </View>
        <Card
          title="7-day Profit"
          value={formatPHP(summary7d?.profit ?? 0)}
          accent={summary7d?.profit && summary7d.profit < 0 ? '#f87171' : '#2dd4bf'}
        />

        <Text style={[styles.heading, { marginTop: 16 }]}>Best Sellers</Text>
        <View style={styles.listCard}>
          {bestSellers.length === 0 && <Text style={styles.subtitle}>No sales yet</Text>}
          {bestSellers.map((b) => (
            <View key={b.name} style={styles.listRow}>
              <Text style={styles.subtitle}>{b.name}</Text>
              <Text style={styles.value}>Qty {b.qty} • {formatPHP(b.revenue, { maximumFractionDigits: 0 })}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.heading, { marginTop: 16 }]}>Expense Breakdown</Text>
        <View style={styles.listCard}>
          {expenseBreakdown.length === 0 && <Text style={styles.subtitle}>No expenses yet</Text>}
          {expenseBreakdown.map((e) => (
            <View key={e.category} style={styles.listRow}>
              <Text style={styles.subtitle}>{e.category}</Text>
              <Text style={styles.value}>{formatPHP(e.total, { maximumFractionDigits: 0 })}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <View style={[styles.card, { borderColor: accent }]}>
      <Text style={styles.subtitle}>{title}</Text>
      <Text style={[styles.title, { color: accent }]}>{value}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text style={{ color: '#e5e7eb', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  heading: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: { color: '#e5e7eb', fontSize: 22, fontWeight: '700', marginTop: 6 },
  subtitle: { color: '#9ca3af', fontSize: 14 },
  listCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  value: { color: '#e5e7eb', fontWeight: '700' },
  chartCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  legendRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingBottom: 8 },
});
