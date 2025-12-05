import { User, Transaction, Debt, AuthResponse, TransactionType } from '../types';

// Keys for localStorage
const USERS_KEY = 'spendscope_users';
const TRANSACTIONS_KEY = 'spendscope_transactions';
const DEBTS_KEY = 'spendscope_debts';
const CURRENT_USER_KEY = 'spendscope_current_user_id';

// Helper to delay response for realism
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Seed data
const seedTransactions = (userId: string): Transaction[] => [
  { id: '1', userId, amount: 2500, merchant: 'Tech Corp', category: 'Salary', date: new Date().toISOString(), type: 'income' },
  { id: '2', userId, amount: 45, merchant: 'Grocery Mart', category: 'Food', date: new Date(Date.now() - 86400000).toISOString(), type: 'expense' },
  { id: '3', userId, amount: 120, merchant: 'Electric Co', category: 'Utilities', date: new Date(Date.now() - 172800000).toISOString(), type: 'expense' },
  { id: '4', userId, amount: 15.50, merchant: 'Coffee Shop', category: 'Dining', date: new Date().toISOString(), type: 'expense' },
];

const seedDebts = (userId: string): Debt[] => [
  { id: '1', userId, name: 'Credit Card', principal: 5000, rate: 18.99, minPayment: 150 },
  { id: '2', userId, name: 'Student Loan', principal: 12000, rate: 4.5, minPayment: 200 },
];

export const mockBackend = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await delay(800);
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Simple mock auth - in reality, check password hash
    const user = users.find(u => u.email === email);
    
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
      return { token: 'mock-jwt-token-' + Date.now(), user };
    }
    throw new Error('Invalid credentials');
  },

  register: async (name: string, email: string, password: string, currency: string): Promise<AuthResponse> => {
    await delay(800);
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      preferences: {
        theme: 'dark', // Default to dark for premium
        currency: currency as any,
      }
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);

    // Seed data for new user
    const transactions = seedTransactions(newUser.id);
    const debts = seedDebts(newUser.id);
    
    const allTransStr = localStorage.getItem(TRANSACTIONS_KEY);
    const allTrans = allTransStr ? JSON.parse(allTransStr) : [];
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([...allTrans, ...transactions]));

    const allDebtsStr = localStorage.getItem(DEBTS_KEY);
    const allDebts = allDebtsStr ? JSON.parse(allDebtsStr) : [];
    localStorage.setItem(DEBTS_KEY, JSON.stringify([...allDebts, ...debts]));

    return { token: 'mock-jwt-token-' + Date.now(), user: newUser };
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    return users.find(u => u.id === id) || null;
  },

  updateUserPreferences: async (userId: string, preferences: Partial<User['preferences']>): Promise<User> => {
    await delay(300);
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error('User not found');

    users[userIndex].preferences = { ...users[userIndex].preferences, ...preferences };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users[userIndex];
  },

  // Transactions
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    await delay(400);
    const str = localStorage.getItem(TRANSACTIONS_KEY);
    const all: Transaction[] = str ? JSON.parse(str) : [];
    return all.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: async (userId: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    await delay(400);
    const str = localStorage.getItem(TRANSACTIONS_KEY);
    const all: Transaction[] = str ? JSON.parse(str) : [];
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      amount: transaction.amount || 0,
      merchant: transaction.merchant || 'Unknown',
      category: transaction.category || 'Uncategorized',
      date: new Date().toISOString(),
      type: transaction.type || 'expense',
      note: transaction.note
    };
    
    all.push(newTx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
    return newTx;
  },

  autoCaptureTransaction: async (userId: string, merchant: string, amount: number): Promise<Transaction> => {
    await delay(500);
    const str = localStorage.getItem(TRANSACTIONS_KEY);
    const all: Transaction[] = str ? JSON.parse(str) : [];
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      amount,
      merchant,
      category: 'Uncategorized',
      date: new Date().toISOString(),
      type: 'expense',
      note: 'Auto-captured via GPay'
    };
    
    all.push(newTx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
    return newTx;
  },

  // Debts
  getDebts: async (userId: string): Promise<Debt[]> => {
    await delay(300);
    const str = localStorage.getItem(DEBTS_KEY);
    const all: Debt[] = str ? JSON.parse(str) : [];
    return all.filter(d => d.userId === userId);
  },

  addDebt: async (userId: string, debt: Partial<Debt>): Promise<Debt> => {
    await delay(400);
    const str = localStorage.getItem(DEBTS_KEY);
    const all: Debt[] = str ? JSON.parse(str) : [];

    const newDebt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      name: debt.name || 'New Debt',
      principal: debt.principal || 0,
      rate: debt.rate || 0,
      minPayment: debt.minPayment || 0
    };

    all.push(newDebt);
    localStorage.setItem(DEBTS_KEY, JSON.stringify(all));
    return newDebt;
  }
};
