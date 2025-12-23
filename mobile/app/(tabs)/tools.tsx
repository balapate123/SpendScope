import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { Bell, Download, Trash2, LogOut, ChevronRight } from 'lucide-react-native';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/Config';

export default function Tools() {
    const { logout } = useAuth();
    const [autoCapture, setAutoCapture] = useState(true);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure? This will permanently delete your account and all data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/auth/me`);
                            await logout();
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete account");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Tools & Settings</Text>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '30' }]}>
                                <Bell size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingText}>Auto-Capture (Android)</Text>
                                <Text style={styles.settingSubtext}>Capture GPay transactions</Text>
                            </View>
                        </View>
                        <Switch
                            value={autoCapture}
                            onValueChange={setAutoCapture}
                            trackColor={{ false: colors.cardBackgroundLight, true: colors.primary }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>
            </View>

            {/* Data Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DATA</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} onPress={async () => {
                        try {
                            const res = await axios.get(`${API_URL}/transactions`);
                            const transactions = res.data;

                            const header = 'Date,Merchant,Amount,Type,Category\n';
                            const csv = header + transactions.map((t: any) =>
                                `${new Date(t.date).toISOString()},"${t.merchant}",${t.amount},${t.type},${t.category}`
                            ).join('\n');

                            // Dynamic import to avoid web breaking if these pkgs aren't installed or mockable on web
                            const FileSystem = require('expo-file-system');
                            const Sharing = require('expo-sharing');

                            const fileUri = FileSystem.documentDirectory + 'moneymap_export.csv';
                            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

                            if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(fileUri);
                            } else {
                                Alert.alert("Export", "Sharing is not available on this device");
                            }
                        } catch (e) {
                            Alert.alert("Error", "Failed to export data");
                        }
                    }}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.success + '30' }]}>
                                <Download size={20} color={colors.success} />
                            </View>
                            <Text style={styles.settingText}>Export Data</Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} onPress={logout}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.warning + '30' }]}>
                                <LogOut size={20} color={colors.warning} />
                            </View>
                            <Text style={styles.settingText}>Logout</Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.danger + '30' }]}>
                                <Trash2 size={20} color={colors.danger} />
                            </View>
                            <Text style={[styles.settingText, { color: colors.danger }]}>Delete Account</Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: spacing.sm,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    settingSubtext: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBackgroundLight,
        marginHorizontal: spacing.md,
    },
});
