import { View, Text, TouchableOpacity, StyleSheet, Switch, Modal, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { Bell, Download, Trash2, LogOut, ChevronRight, User, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';

export default function Tools() {
    const { logout, user, refreshUser } = useAuth();
    const [autoCapture, setAutoCapture] = useState(true);

    // Edit Profile state
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editIncome, setEditIncome] = useState('');

    // Custom Alert state
    const [showAlert, setShowAlert] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
    };

    useEffect(() => {
        if (user) {
            setEditName(user.name || '');
            setEditIncome(user.monthlyIncome?.toString() || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        try {
            await axios.patch(`${API_URL}/users/me`, {
                name: editName,
                monthlyIncome: parseFloat(editIncome) || 0,
            });
            await refreshUser();
            setShowEditProfile(false);
            showCustomAlert('Success', 'Profile updated successfully', 'success');
        } catch (e) {
            showCustomAlert('Error', 'Failed to update profile', 'error');
        }
    };

    const handleExportData = async () => {
        try {
            const res = await axios.get(`${API_URL}/transactions`);
            const transactions = res.data;

            if (transactions.length === 0) {
                showCustomAlert('No Data', 'No transactions to export', 'error');
                return;
            }

            const header = 'Date,Merchant,Amount,Type,Category\n';
            const csv = header + transactions.map((t: any) =>
                `${new Date(t.date).toISOString()},"${t.merchant}",${t.amount},${t.type},${t.category}`
            ).join('\n');

            // Use new expo-file-system API
            const file = new File(Paths.cache, 'moneymap_export.csv');
            await file.write(csv);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Transactions',
                });
                showCustomAlert('Success', 'Export ready to share!', 'success');
            } else {
                showCustomAlert('Error', 'Sharing is not available on this device', 'error');
            }
        } catch (e) {
            console.error('Export error:', e);
            showCustomAlert('Error', 'Failed to export data', 'error');
        }
    };

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API_URL}/auth/me`);
            await logout();
        } catch (e) {
            showCustomAlert('Error', 'Failed to delete account', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Tools & Settings</Text>

            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROFILE</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} onPress={() => setShowEditProfile(true)}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '30' }]}>
                                <User size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingText}>Edit Profile</Text>
                                <Text style={styles.settingSubtext}>{user?.name || 'Set your name'}</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.chartPurple + '30' }]}>
                                <Bell size={20} color={colors.chartPurple} />
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
                    <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.success + '30' }]}>
                                <Download size={20} color={colors.success} />
                            </View>
                            <View>
                                <Text style={styles.settingText}>Export Data</Text>
                                <Text style={styles.settingSubtext}>Download as CSV</Text>
                            </View>
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

                    <TouchableOpacity style={styles.settingRow} onPress={() => setShowDeleteConfirm(true)}>
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

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditProfile}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEditProfile(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textMuted}
                        />

                        <Text style={styles.inputLabel}>Monthly Income</Text>
                        <TextInput
                            style={styles.input}
                            value={editIncome}
                            onChangeText={setEditIncome}
                            placeholder="5000"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert Modal */}
            <Modal
                visible={showAlert}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAlert(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <View style={[styles.alertIconBox, { backgroundColor: alertType === 'success' ? colors.success + '20' : colors.danger + '20' }]}>
                            {alertType === 'success' ? (
                                <CheckCircle size={32} color={colors.success} />
                            ) : (
                                <AlertCircle size={32} color={colors.danger} />
                            )}
                        </View>
                        <Text style={styles.alertTitle}>{alertTitle}</Text>
                        <Text style={styles.alertMessage}>{alertMessage}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: alertType === 'success' ? colors.success : colors.danger }]} onPress={() => setShowAlert(false)}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteConfirm(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <View style={[styles.alertIconBox, { backgroundColor: colors.danger + '20' }]}>
                            <Trash2 size={32} color={colors.danger} />
                        </View>
                        <Text style={styles.alertTitle}>Delete Account</Text>
                        <Text style={styles.alertMessage}>Are you sure? This will permanently delete your account and all data.</Text>
                        <View style={styles.alertButtonRow}>
                            <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                                <Text style={styles.alertCancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: colors.danger }]} onPress={() => { setShowDeleteConfirm(false); handleDeleteAccount(); }}>
                                <Text style={styles.alertBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.cardBackgroundLight,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    saveBtn: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveBtnText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    // Alert styles
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    alertBox: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    alertIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    alertBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        minWidth: 120,
        alignItems: 'center',
    },
    alertBtnText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    alertButtonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    alertCancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.textMuted,
        alignItems: 'center',
    },
    alertCancelBtnText: {
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: '600',
    },
});
