import fs from 'fs';
import path from 'path';

// File-based store for pending payment data
// Note: For production, use Redis or a proper database

const STORE_FILE = path.join(process.cwd(), '.payment-store.json');

function readStore(): Record<string, any> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[PaymentStore] Error reading store:', e);
  }
  return {};
}

function writeStore(store: Record<string, any>): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('[PaymentStore] Error writing store:', e);
  }
}

export function storePendingPayment(basketId: string, data: any): void {
  const store = readStore();
  store[basketId] = {
    ...data,
    createdAt: Date.now(),
  };
  writeStore(store);
  
  // Auto-cleanup after 30 minutes
  setTimeout(() => {
    const s = readStore();
    delete s[basketId];
    writeStore(s);
  }, 30 * 60 * 1000);
}

export function getPendingPayment(basketId: string): any | undefined {
  const store = readStore();
  return store[basketId];
}

export function removePendingPayment(basketId: string): void {
  const store = readStore();
  delete store[basketId];
  writeStore(store);
}
