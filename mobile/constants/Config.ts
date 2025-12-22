import { Platform } from 'react-native';

// Use localhost for web (running on same PC), IP for mobile devices
export const API_URL = Platform.OS === 'web'
    ? 'http://localhost:5000'
    : 'http://192.168.2.34:5000';
