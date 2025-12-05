export type Theme = 'light' | 'dark' | 'system';
export type Currency = 'USD' | 'EUR' | 'INR' | 'GBP' | 'JPY' | 'CAD';

export interface UserPreferences {
  theme: Theme;
  currency: Currency;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  category: string;
  date: string; // ISO String
  note?: string;
  type: TransactionType;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  principal: number;
  rate: number; // Annual interest rate in %
  minPayment: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Chart data types
export interface DebtProjectionPoint {
  month: number;
  balanceMinimum: number;
  balanceStrategy: number;
}
