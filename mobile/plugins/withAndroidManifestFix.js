const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Custom Expo config plugin to fix AndroidManifest merger conflicts
 * and add NotificationListenerService for reading notifications.
 */
module.exports = function withAndroidManifestFix(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        // Ensure the tools namespace is declared
        androidManifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

        // Get the application element
        const application = androidManifest.manifest.application?.[0];

        if (application) {
            // Add tools:replace to override the conflicting allowBackup attribute
            application.$["tools:replace"] = "android:allowBackup";
            // Set allowBackup to false to match the notification listener library
            application.$["android:allowBackup"] = "false";

            // Initialize service array if it doesn't exist
            if (!application.service) {
                application.service = [];
            }

            // Check if the notification listener service already exists
            const serviceExists = application.service.some(
                (service) => service.$?.["android:name"] === "com.lesimoes.androidnotificationlistener.RNAndroidNotificationListenerService"
            );

            if (!serviceExists) {
                // Add the NotificationListenerService
                application.service.push({
                    $: {
                        "android:name": "com.lesimoes.androidnotificationlistener.RNAndroidNotificationListenerService",
                        "android:label": "MoneyMap Notification Listener",
                        "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
                        "android:exported": "false",
                    },
                    "intent-filter": [
                        {
                            action: [
                                {
                                    $: {
                                        "android:name": "android.service.notification.NotificationListenerService",
                                    },
                                },
                            ],
                        },
                    ],
                });
            }
        }

        return config;
    });
};
