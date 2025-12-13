import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('tracker.db');

const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- clothing | cap
  color TEXT,
  size TEXT,
  unit_cost REAL NOT NULL DEFAULT 0,
  price_suggested REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  qty_on_hand INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  sale_price REAL NOT NULL,
  channel TEXT,
  payment_method TEXT,
  fee REAL DEFAULT 0,
  date TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT,
  fee REAL DEFAULT 0,
  date TEXT NOT NULL,
  supplier TEXT,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
`;

export async function migrate() {
  await db.execAsync(schema);
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products', []);
  if ((existing?.count ?? 0) === 0) {
    await db.runAsync(
      `INSERT INTO products (name, type, color, size, unit_cost, price_suggested, active)
       VALUES
       ('Oversized Tee - Black', 'clothing', 'Black', 'L', 180, 280, 1),
       ('Oversized Tee - White', 'clothing', 'White', 'L', 170, 270, 1),
       ('Logo Cap - Navy', 'cap', 'Navy', NULL, 90, 180, 1)`
    );
    const ids = await db.getAllAsync<{ id: number }>('SELECT id FROM products', []);
    for (const row of ids) {
      await db.runAsync(
        `INSERT INTO inventory (product_id, qty_on_hand) VALUES (?, ?)`,
        [row.id, 10]
      );
    }
  }
}
