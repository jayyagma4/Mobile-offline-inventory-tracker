import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import { useDataStore } from '../state/useData';
import { subDays } from 'date-fns';

export function SettingsScreen() {
  const { sales, expenses, products } = useDataStore((s) => ({
    sales: s.sales,
    expenses: s.expenses,
    products: s.products,
  }));

  const [exporting, setExporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPerm, setCheckingPerm] = useState(true);
  const [exportRange, setExportRange] = useState<'all' | '7d' | '30d'>('all');
  const [exportKind, setExportKind] = useState<'both' | 'sales' | 'expenses'>('both');

  useEffect(() => {
    (async () => {
      const settings = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
      setCheckingPerm(false);
    })();
  }, []);

  const scheduleDaily = async () => {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted && perm.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
      Alert.alert('Permission needed', 'Enable notifications to get daily reminders.');
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Log your sales & expenses',
        body: '1 minute to keep profit accurate. Add any missing sales/expenses now.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
    setNotificationsEnabled(true);
    Alert.alert('Reminder set', 'Daily 9PM reminder scheduled.');
  };

  const cancelDaily = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setNotificationsEnabled(false);
    Alert.alert('Reminder off', 'Daily reminder canceled.');
  };

  const exportCSV = async () => {
    try {
      setExporting(true);
      const cutoff =
        exportRange === 'all'
          ? null
          : subDays(new Date(), exportRange === '7d' ? 7 : 30).getTime();
      const inRange = (d: string) => (cutoff ? new Date(d).getTime() >= cutoff : true);
      const salesRows =
        exportKind !== 'expenses'
          ? sales
              .filter((s) => inRange(s.date))
              .map((s) =>
                [
                  'sale',
                  s.id,
                  s.product_id,
                  s.qty,
                  s.sale_price,
                  s.channel ?? '',
                  s.payment_method ?? '',
                  s.fee ?? 0,
                  s.date,
                  s.note ?? '',
                ].join(',')
              )
          : [];
      const expenseRows =
        exportKind !== 'sales'
          ? expenses
              .filter((e) => inRange(e.date))
              .map((e) =>
                [
                  'expense',
                  e.id,
                  '',
                  '',
                  '',
                  '',
                  e.payment_method ?? '',
                  e.fee ?? 0,
                  e.date,
                  `${e.category}: ${e.amount}`,
                ].join(',')
              )
          : [];
      const header = 'type,id,product_id,qty,price,channel,payment_method,fee,date,note\n';
      const content = header + [...salesRows, ...expenseRows].join('\n');
      const dirs = FileSystem as unknown as { cacheDirectory?: string; documentDirectory?: string };
      const baseDir = dirs.cacheDirectory ?? dirs.documentDirectory ?? '';
      const fileUri = baseDir + 'tracker-export.csv';
      await FileSystem.writeAsStringAsync(fileUri, content);
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' });
      } else {
        Alert.alert('Exported', `Saved to ${fileUri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Daily Reminder</Text>
        <Text style={styles.subtitle}>Remind at 9PM to log sales/expenses</Text>
        <View style={styles.row}>
          <Switch
            value={notificationsEnabled}
            onValueChange={(v) => (v ? scheduleDaily() : cancelDaily())}
            thumbColor="#22d3ee"
          />
          {checkingPerm && <ActivityIndicator color="#22d3ee" style={{ marginLeft: 12 }} />}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Export CSV</Text>
        <Text style={styles.subtitle}>Sales & expenses combined</Text>
        <View style={styles.rowSpread}>
          <Text style={styles.subtitle}>Range</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['all', '7d', '30d'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, exportRange === r && styles.pillActive]}
                onPress={() => setExportRange(r)}
              >
                <Text style={styles.pillText}>{r === 'all' ? 'All' : r.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.rowSpread, { marginTop: 8 }]}>
          <Text style={styles.subtitle}>Include</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['both', 'sales', 'expenses'] as const).map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.pill, exportKind === k && styles.pillActive]}
                onPress={() => setExportKind(k)}
              >
                <Text style={styles.pillText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.button, exporting && { opacity: 0.6 }]}
          onPress={exportCSV}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>{exporting ? 'Exporting…' : 'Export & Share'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>Products: {products.length}</Text>
        <Text style={styles.subtitle}>Sales: {sales.length}</Text>
        <Text style={styles.subtitle}>Expenses: {expenses.length}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  title: { color: '#e5e7eb', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowSpread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  button: {
    marginTop: 12,
    backgroundColor: '#22d3ee',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  pillActive: { borderColor: '#22d3ee', backgroundColor: '#0b172a' },
  pillText: { color: '#e5e7eb', fontWeight: '700' },
});
