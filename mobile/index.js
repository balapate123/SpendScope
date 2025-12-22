import { AppRegistry } from 'react-native';
import 'expo-router/entry';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import { headlessNotificationHandler } from './services/NotificationService';

AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => headlessNotificationHandler);
