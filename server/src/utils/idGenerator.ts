import { Customer } from '../models/Customer.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Payment } from '../models/Payment.js';

export const generateCustomerId = async (): Promise<string> => {
  const count = await Customer.countDocuments();
  const nextNum = 1001 + count;
  return `CUST-${nextNum}`;
};

export const generateAccountNumber = async (type: 'daily' | 'weekly'): Promise<string> => {
  const prefix = type === 'daily' ? 'DF' : 'WF';
  const year = new Date().getFullYear();
  const count = await FinanceAccount.countDocuments({ financeType: type });
  const formattedCount = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${formattedCount}`;
};

export const generateTransactionId = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${y}${m}${d}-${rand}`;
};

export const generateReceiptNumber = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${y}${m}${d}-${rand}`;
};
