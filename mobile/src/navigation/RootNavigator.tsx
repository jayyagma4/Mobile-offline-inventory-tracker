import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { QuickAddSaleScreen } from '../screens/QuickAddSaleScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useBootstrapData, useDataStore } from '../state/useData';
import { RestockScreen } from '../screens/RestockScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  useBootstrapData();
  const lowStockCount = useDataStore((s) => s.products.filter((p) => p.qty_on_hand <= 3).length);
  const badge = lowStockCount > 99 ? '99+' : lowStockCount > 0 ? lowStockCount : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2dd4bf',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#0b1220', borderTopColor: '#1f2937' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sale" component={QuickAddSaleScreen} options={{ title: 'Quick Sale' }} />
      <Tab.Screen name="Expense" component={AddExpenseScreen} />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ tabBarBadge: badge }}
      />
      <Tab.Screen name="Restock" component={RestockScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
