import { useCallback } from 'react';
import { mockBackend } from '../services/mockBackend';
import { useAuth } from '../contexts/AuthContext';

// Since we are in a web environment, we cannot actually listen to Android Notifications.
// This hook simulates the process of receiving a notification and parsing it.

export const useAutoCapture = () => {
  const { user } = useAuth();

  const simulateIncomingTransaction = useCallback(async () => {
    if (!user) return;

    // Simulate random transaction data
    const merchants = ['Uber', 'Starbucks', 'Amazon', 'Netflix', 'Local Diner', 'Target'];
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const randomAmount = parseFloat((Math.random() * 100).toFixed(2));

    console.log(`[AutoCapture Service] Detected transaction from ${randomMerchant} for ${randomAmount}`);

    try {
      // In a real app, this would be triggered by a Background Task on Android
      const newTx = await mockBackend.autoCaptureTransaction(user.id, randomMerchant, randomAmount);
      return newTx;
    } catch (error) {
      console.error('[AutoCapture Service] Failed to sync transaction', error);
      throw error;
    }
  }, [user]);

  return { simulateIncomingTransaction };
};
