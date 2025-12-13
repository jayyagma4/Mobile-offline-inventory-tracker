export type ProductType = 'clothing' | 'cap';

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  color?: string | null;
  size?: string | null;
  unit_cost: number;
  price_suggested: number;
  active: number;
}

export interface InventoryRecord {
  id: number;
  product_id: number;
  qty_on_hand: number;
}

export interface ProductWithInventory extends Product {
  qty_on_hand: number;
}

export interface Sale {
  id: number;
  product_id: number;
  qty: number;
  sale_price: number;
  channel?: string | null;
  payment_method?: string | null;
  fee?: number | null;
  date: string;
  note?: string | null;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  payment_method?: string | null;
  fee?: number | null;
  date: string;
  supplier?: string | null;
  note?: string | null;
}

export interface DashboardSummary {
  periodLabel: string;
  salesTotal: number;
  expensesTotal: number;
  profit: number;
  bestSellers: { product_id: number; name: string; qty: number; revenue: number }[];
  expenseBreakdown: { category: string; total: number }[];
  underpriced: { product_id: number; name: string; unit_cost: number; price_suggested: number }[];
}
