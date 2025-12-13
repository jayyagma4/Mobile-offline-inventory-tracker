import { db } from './database';
import { Expense, Product, ProductWithInventory, Sale } from './types';

// Products
export async function listProducts(): Promise<ProductWithInventory[]> {
  const rows = await db.getAllAsync<ProductWithInventory>(
    `SELECT p.*, COALESCE(i.qty_on_hand, 0) as qty_on_hand
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.active = 1
     ORDER BY p.name ASC`
  );
  return rows;
}

export async function upsertProduct(input: Omit<Product, 'id' | 'active'> & { id?: number; active?: number; qty_on_hand?: number }) {
  const {
    id,
    name,
    type,
    color = null,
    size = null,
    unit_cost,
    price_suggested,
    active = 1,
    qty_on_hand = 0,
  } = input;

  if (id) {
    await db.runAsync(
      `UPDATE products SET name=?, type=?, color=?, size=?, unit_cost=?, price_suggested=?, active=? WHERE id=?`,
      [name, type, color, size, unit_cost, price_suggested, active, id]
    );
    await db.runAsync(
      `INSERT INTO inventory (product_id, qty_on_hand)
       VALUES (?, ?)
       ON CONFLICT(product_id) DO UPDATE SET qty_on_hand=excluded.qty_on_hand`,
      [id, qty_on_hand]
    );
    return id;
  }
  const result = await db.runAsync(
    `INSERT INTO products (name, type, color, size, unit_cost, price_suggested, active) VALUES (?,?,?,?,?,?,?)`,
    [name, type, color, size, unit_cost, price_suggested, active]
  );
  const newId = result.lastInsertRowId as number;
  await db.runAsync(
    `INSERT INTO inventory (product_id, qty_on_hand) VALUES (?, ?)`,
    [newId, qty_on_hand]
  );
  return newId;
}

export async function adjustInventory(productId: number, delta: number) {
  await db.runAsync(
    `INSERT INTO inventory (product_id, qty_on_hand)
     VALUES (?, COALESCE((SELECT qty_on_hand FROM inventory WHERE product_id=?), 0) + ?)
     ON CONFLICT(product_id) DO UPDATE SET qty_on_hand = qty_on_hand + ?`,
    [productId, productId, delta, delta]
  );
}

// Sales
export async function addSale(input: Omit<Sale, 'id'>) {
  const { product_id, qty, sale_price, channel = null, payment_method = null, fee = 0, date, note = null } = input;
  const result = await db.runAsync(
    `INSERT INTO sales (product_id, qty, sale_price, channel, payment_method, fee, date, note)
     VALUES (?,?,?,?,?,?,?,?)`,
    [product_id, qty, sale_price, channel, payment_method, fee, date, note]
  );
  await adjustInventory(product_id, -qty);
  return result.lastInsertRowId as number;
}

export async function listSales(limit = 100) {
  return db.getAllAsync<any>(
    `SELECT s.*, p.name, p.type, p.color, p.size
     FROM sales s
     JOIN products p ON p.id = s.product_id
     ORDER BY date DESC, s.id DESC
     LIMIT ?`,
    [limit]
  );
}

// Expenses
export async function addExpense(input: Omit<Expense, 'id'>) {
  const { category, amount, payment_method = null, fee = 0, date, supplier = null, note = null } = input;
  const result = await db.runAsync(
    `INSERT INTO expenses (category, amount, payment_method, fee, date, supplier, note)
     VALUES (?,?,?,?,?,?,?)`,
    [category, amount, payment_method, fee, date, supplier, note]
  );
  return result.lastInsertRowId as number;
}

export async function listExpenses(limit = 100) {
  return db.getAllAsync<any>(
    `SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT ?`,
    [limit]
  );
}

export async function deleteSale(id: number) {
  const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id=?', [id]);
  if (sale) {
    await adjustInventory(sale.product_id, sale.qty); // return stock
  }
  await db.runAsync(`DELETE FROM sales WHERE id=?`, [id]);
}

export async function deleteExpense(id: number) {
  await db.runAsync(`DELETE FROM expenses WHERE id=?`, [id]);
}

export async function returnSale(id: number) {
  const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id=?', [id]);
  if (!sale) return;
  const note = sale.note ? `${sale.note} • RETURN` : 'RETURN';
  await addSale({
    product_id: sale.product_id,
    qty: -sale.qty,
    sale_price: sale.sale_price,
    channel: sale.channel,
    payment_method: sale.payment_method,
    fee: 0,
    date: new Date().toISOString(),
    note,
  });
}

export async function updateSale(id: number, changes: Partial<Pick<Sale, 'qty' | 'sale_price' | 'fee' | 'note'>>) {
  const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id=?', [id]);
  if (!sale) return;
  const newQty = changes.qty ?? sale.qty;
  const newPrice = changes.sale_price ?? sale.sale_price;
  const newFee = changes.fee ?? sale.fee ?? 0;
  const newNote = changes.note ?? sale.note ?? null;
  await db.runAsync(
    `UPDATE sales SET qty=?, sale_price=?, fee=?, note=? WHERE id=?`,
    [newQty, newPrice, newFee, newNote, id]
  );
  const diff = sale.qty - newQty; // positive diff means give stock back, negative diff consumes more
  if (diff !== 0) {
    await adjustInventory(sale.product_id, diff);
  }
}

export async function updateExpense(id: number, changes: Partial<Pick<Expense, 'amount' | 'fee' | 'note'>>) {
  const exp = await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id=?', [id]);
  if (!exp) return;
  const newAmount = changes.amount ?? exp.amount;
  const newFee = changes.fee ?? exp.fee ?? 0;
  const newNote = changes.note ?? exp.note ?? null;
  await db.runAsync(`UPDATE expenses SET amount=?, fee=?, note=? WHERE id=?`, [newAmount, newFee, newNote, id]);
}

// Metrics (simple version)
export async function getSummarySince(dateISO: string) {
  const sales = await db.getFirstAsync<{ total: number; fee: number }>(
    `SELECT COALESCE(SUM(sale_price * qty), 0) as total, COALESCE(SUM(fee),0) as fee FROM sales WHERE date >= ?`,
    [dateISO]
  );
  const expenses = await db.getFirstAsync<{ total: number; fee: number }>(
    `SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(fee),0) as fee FROM expenses WHERE date >= ?`,
    [dateISO]
  );
  return {
    salesTotal: sales?.total ?? 0,
    salesFee: sales?.fee ?? 0,
    expensesTotal: expenses?.total ?? 0,
    expensesFee: expenses?.fee ?? 0,
    profit: (sales?.total ?? 0) - (expenses?.total ?? 0) - (sales?.fee ?? 0) - (expenses?.fee ?? 0),
  };
}
