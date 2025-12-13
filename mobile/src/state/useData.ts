import { useEffect } from 'react';
import { create } from 'zustand';
import { formatISO, subDays } from 'date-fns';
import {
  addExpense,
  addSale,
  adjustInventory,
  deleteExpense,
  deleteSale,
  returnSale as returnSaleRepo,
  updateSale,
  updateExpense,
  getSummarySince,
  listExpenses,
  listProducts,
  listSales,
  upsertProduct,
} from '../db/repositories';
import { Expense, ProductWithInventory, Sale } from '../db/types';

interface DataState {
  products: ProductWithInventory[];
  sales: Sale[];
  expenses: Expense[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  addQuickSale: (args: Omit<Sale, 'id'>) => Promise<void>;
  addQuickExpense: (args: Omit<Expense, 'id'>) => Promise<void>;
  saveProduct: (args: Parameters<typeof upsertProduct>[0]) => Promise<void>;
  adjustStock: (productId: number, delta: number) => Promise<void>;
  removeSale: (id: number) => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
  returnSale: (id: number) => Promise<void>;
  editSale: (id: number, changes: Parameters<typeof updateSale>[1]) => Promise<void>;
  editExpense: (id: number, changes: Parameters<typeof updateExpense>[1]) => Promise<void>;
  summary7d: Summary | null;
  refreshSummary: () => Promise<void>;
}

interface Summary {
  salesTotal: number;
  salesFee: number;
  expensesTotal: number;
  expensesFee: number;
  profit: number;
}

export const useDataStore = create<DataState>((set, get) => ({
  products: [],
  sales: [],
  expenses: [],
  loading: false,
  summary7d: null,
  refreshAll: async () => {
    set({ loading: true });
    const [products, sales, expenses] = await Promise.all([
      listProducts(),
      listSales(),
      listExpenses(),
    ]);
    set({ products, sales, expenses, loading: false });
    await get().refreshSummary();
  },
  addQuickSale: async (sale) => {
    await addSale(sale);
    await get().refreshAll();
  },
  addQuickExpense: async (expense) => {
    await addExpense(expense);
    await get().refreshAll();
  },
  saveProduct: async (args) => {
    await upsertProduct(args);
    await get().refreshAll();
  },
  adjustStock: async (productId, delta) => {
    await adjustInventory(productId, delta);
    await get().refreshAll();
  },
  removeSale: async (id: number) => {
    await deleteSale(id);
    await get().refreshAll();
  },
  removeExpense: async (id: number) => {
    await deleteExpense(id);
    await get().refreshAll();
  },
  returnSale: async (id: number) => {
    await returnSaleRepo(id);
    await get().refreshAll();
  },
  editSale: async (id, changes) => {
    await updateSale(id, changes);
    await get().refreshAll();
  },
  editExpense: async (id, changes) => {
    await updateExpense(id, changes);
    await get().refreshAll();
  },
  refreshSummary: async () => {
    const since = formatISO(subDays(new Date(), 7));
    const summary = await getSummarySince(since);
    set({ summary7d: summary });
  },
}));

export function useBootstrapData(enabled = true) {
  const refreshAll = useDataStore((s) => s.refreshAll);
  useEffect(() => {
    if (enabled) refreshAll();
  }, [enabled, refreshAll]);
}
