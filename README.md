# Mobile Offline Inventory Tracker

An Expo React Native (TypeScript) app for tracking products, inventory, sales, and expenses entirely offline using local SQLite storage. It includes quick sale/expense entry, low-stock cues, profit summaries, and basic analytics.

## Features
- Offline-first: data stored locally in `expo-sqlite` (no network required).
- Products & inventory: add/update products, track on-hand quantities, restock, and auto-decrement on sales.
- Sales: quick sale entry with channels, payment methods, optional fees, and margin hints.
- Expenses: categorized expenses with optional fees, supplier, and notes.
- Dashboard: today metrics, 7-day summary, best sellers, expense breakdown, and 14-day trends (Victory charts).
- History: recent sales and expenses with edit/delete/return flows.

## Tech Stack
- Expo SDK ~54 / React Native 0.81 / React 19
- TypeScript
- State: Zustand
- Navigation: React Navigation (bottom tabs + native stack)
- Charts: Victory Native
- Storage: `expo-sqlite`

## Getting Started
1. Install dependencies
   ```bash
   cd mobile
   npm install
   ```
2. Run in development (choose a platform: Android emulator, iOS simulator, or Expo Go)
   ```bash
   npm start
   ```
3. Build (optional, with EAS)
   ```bash
   npx expo prebuild
   npx eas build --platform android
   # or
   npx eas build --platform ios
   ```

## Project Structure
- `mobile/App.tsx` – boots the app and runs DB migration/seed.
- `mobile/src/db/` – SQLite schema, types, and repository functions.
- `mobile/src/state/` – Zustand store for products, sales, expenses, and summaries.
- `mobile/src/screens/` – UI screens (Dashboard, Quick Sale, Expense, Products, Restock, History, Settings).
- `mobile/src/utils/` – helpers (currency formatting).

## Data Model (SQLite)
- `products`: id, name, type, color/size, unit cost, suggested price, active flag.
- `inventory`: product_id, qty_on_hand.
- `sales`: product_id, qty, sale_price, channel, payment_method, fee, date, note.
- `expenses`: category, amount, payment_method, fee, date, supplier, note.

## Notes
- The app seeds a few sample products and inventory on first launch.
- Everything is local/offline; exporting/sharing would require platform permissions and is not enabled by default.
