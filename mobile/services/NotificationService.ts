import { AppRegistry } from 'react-native';
// import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as SecureStore from 'expo-secure-store';

// Helper to parse Google Pay notifications
const parseNotification = (text: string, title: string) => {
    // Basic regex for example "You paid Starbuck $5.40"
    // This needs to be robust for real Google Pay messages
    // Example: "You spent $15.50 at Trader Joe's"
    const amountRegex = /\$(\d+\.\d{2})/;
    const merchantRegex = /at (.+)/; // Very naive

    const amountMatch = text.match(amountRegex);

    if (amountMatch) {
        return {
            amount: parseFloat(amountMatch[1]),
            merchant: title || "Unknown Merchant", // Often title is "Google Pay" or bank name
            category: "Uncategorized", // logic to classify
            date: new Date().toISOString(),
            isAutoCaptured: true,
            type: 'expense'
        };
    }
    return null;
};

export const headlessNotificationHandler = async ({ notification }: any) => {
    if (!notification) return;

    // Filter for payment related apps (Google Pay, Wallet, Bank Apps)
    // const allowedPackages = ['com.google.android.apps.walletnfcrel', 'com.google.android.apps.nbu.paisa.user']; 
    // if (!allowedPackages.includes(notification.packageName)) return;

    const { title, text } = notification;
    console.log('Notification received:', title, text);

    const transaction = parseNotification(text, title);

    if (transaction) {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                await axios.post(`${API_URL}/transactions`, transaction, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("Transaction auto-captured!");
            }
        } catch (error) {
            console.error("Failed to sync auto-captured transaction", error);
        }
    }
};

// AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => headlessNotificationHandler);
// Note: This requires a custom development client or APK build.
// Uncommenting for production build:
// AppRegistry.registerHeadlessTask('RNAndroidNotificationListenerHeadlessJs', () => headlessNotificationHandler); 
