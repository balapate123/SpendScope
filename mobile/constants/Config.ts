import { Platform } from 'react-native';

// Production API URL (Railway deployment)
// For local development, change this back to your local IP
export const API_URL = 'https://backend-production-2ad5.up.railway.app';

// Local development URLs (uncomment for local testing):
// export const API_URL = Platform.OS === 'web'
//     ? 'http://localhost:5000'
//     : 'http://192.168.2.34:5000';
