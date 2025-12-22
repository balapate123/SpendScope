import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { Plus, Trash2, X, CreditCard, TrendingDown, Calendar } from 'lucide-react-native';
import axios from 'axios';
import { Alert } from 'react-native';

interface Debt {
    id: string;
    name: string;
    principal: number;
    rate: number;
    minPayment: number;
}

export default function DebtManager() {
    const { user, updateUser, isAuthenticated } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isEditingIncome, setIsEditingIncome] = useState(false);
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [showAddDebtModal, setShowAddDebtModal] = useState(false);

    // Add debt form
    const [debtName, setDebtName] = useState('');
    const [debtPrincipal, setDebtPrincipal] = useState('');
    const [debtRate, setDebtRate] = useState('');
    const [debtMinPayment, setDebtMinPayment] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetchDebts();
        }
        setMonthlyIncome(user?.monthlyIncome?.toString() || '');
    }, [user, isAuthenticated]);

    const fetchDebts = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get(`${API_URL}/debts`);
            setDebts(res.data);
        } catch (e) {
            // Silently handle - user may not be authenticated
        }
    };

    const updateIncome = async () => {
        try {
            const income = parseFloat(monthlyIncome);
            if (isNaN(income)) return;
            await axios.patch(`${API_URL}/users/me`, { monthlyIncome: income });
            updateUser({ monthlyIncome: income });
            setIsEditingIncome(false);
        } catch (e) {
            console.error('Failed to update income', e);
        }
    };

    const deleteDebt = async (id: string) => {
        Alert.alert('Delete Debt', 'Are you sure you want to remove this debt?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/debts/${id}`);
                        fetchDebts();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete debt');
                    }
                },
            },
        ]);
    };

    const addDebt = async () => {
        try {
            const principal = parseFloat(debtPrincipal);
            const rate = parseFloat(debtRate);
            const minPayment = parseFloat(debtMinPayment);

            if (!debtName || isNaN(principal)) {
                Alert.alert('Error', 'Please fill in required fields');
                return;
            }

            await axios.post(`${API_URL}/debts`, {
                name: debtName,
                principal,
                rate: rate || 0,
                minPayment: minPayment || Math.ceil(principal * 0.02),
            });

            // Reset form
            setDebtName('');
            setDebtPrincipal('');
            setDebtRate('');
            setDebtMinPayment('');
            setShowAddDebtModal(false);
            fetchDebts();
        } catch (e) {
            Alert.alert('Error', 'Failed to add debt');
        }
    };

    const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const income = user?.monthlyIncome || 0;
    const safeExtra = Math.max(0, Math.floor((income - totalMinPayment) * 0.2));

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Debt Manager</Text>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIcon, { backgroundColor: colors.danger + '20' }]}>
                            <CreditCard size={20} color={colors.danger} />
                        </View>
                        <Text style={styles.summaryLabel}>Total Debt</Text>
                        <Text style={styles.summaryValue}>${totalDebt.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                            <TrendingDown size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.summaryLabel}>Min Payment</Text>
                        <Text style={styles.summaryValue}>${totalMinPayment}/mo</Text>
                    </View>
                </View>

                {/* Smart Suggestion Card */}
                <View style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionLabel}>SMART PAYOFF SUGGESTION</Text>
                        <Calendar size={18} color={colors.primaryLight} />
                    </View>
                    <Text style={styles.suggestionValue}>
                        ${safeExtra} <Text style={styles.suggestionSuffix}>/ month extra</Text>
                    </Text>
                    <Text style={styles.suggestionDescription}>
                        Based on your income of ${income.toLocaleString()}, you can safely contribute this extra amount to pay off debt faster.
                    </Text>
                </View>

                {/* Monthly Income */}
                <View style={styles.incomeCard}>
                    <View style={styles.incomeLeft}>
                        <Text style={styles.incomeLabel}>MONTHLY INCOME</Text>
                        {isEditingIncome ? (
                            <TextInput
                                value={monthlyIncome}
                                onChangeText={setMonthlyIncome}
                                keyboardType="numeric"
                                autoFocus
                                style={styles.incomeInput}
                                onBlur={updateIncome}
                            />
                        ) : (
                            <Text style={styles.incomeValue}>${user?.monthlyIncome?.toLocaleString() || '0'}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => isEditingIncome ? updateIncome() : setIsEditingIncome(true)}
                    >
                        <Text style={styles.editButtonText}>{isEditingIncome ? 'Save' : 'Edit'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Debts List */}
                <View style={styles.debtSection}>
                    <View style={styles.debtHeader}>
                        <Text style={styles.sectionTitle}>Your Debts</Text>
                        <TouchableOpacity style={styles.addDebtButton} onPress={() => setShowAddDebtModal(true)}>
                            <Plus size={18} color={colors.primary} />
                            <Text style={styles.addDebtText}>Add Debt</Text>
                        </TouchableOpacity>
                    </View>

                    {debts.map((debt) => (
                        <View key={debt.id} style={styles.debtCard}>
                            <View style={styles.debtCardHeader}>
                                <View>
                                    <Text style={styles.debtName}>{debt.name}</Text>
                                    <Text style={styles.debtRate}>{debt.rate}% APR</Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteDebt(debt.id)}>
                                    <Trash2 size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.debtDetails}>
                                <View>
                                    <Text style={styles.debtDetailLabel}>Balance</Text>
                                    <Text style={styles.debtBalance}>${debt.principal.toLocaleString()}</Text>
                                </View>
                                <View style={styles.debtDetailRight}>
                                    <Text style={styles.debtDetailLabel}>Min Payment</Text>
                                    <Text style={styles.debtMinPayment}>${debt.minPayment}/mo</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {debts.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No debts added yet 🎉</Text>
                            <Text style={styles.emptySubtext}>You're debt-free!</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Add Debt Modal */}
            <Modal
                visible={showAddDebtModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddDebtModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Debt</Text>
                            <TouchableOpacity onPress={() => setShowAddDebtModal(false)}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Debt Name (e.g. Chase Card)"
                            placeholderTextColor={colors.textMuted}
                            value={debtName}
                            onChangeText={setDebtName}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Balance ($)"
                            placeholderTextColor={colors.textMuted}
                            value={debtPrincipal}
                            onChangeText={setDebtPrincipal}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="APR % (e.g. 19.99)"
                            placeholderTextColor={colors.textMuted}
                            value={debtRate}
                            onChangeText={setDebtRate}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Min Payment (optional)"
                            placeholderTextColor={colors.textMuted}
                            value={debtMinPayment}
                            onChangeText={setDebtMinPayment}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={addDebt}>
                            <Text style={styles.saveButtonText}>Add Debt</Text>
                        </TouchableOpacity>
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
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    suggestionCard: {
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    suggestionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primaryLight,
        letterSpacing: 1,
    },
    suggestionValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    suggestionSuffix: {
        fontSize: 16,
        fontWeight: 'normal',
        opacity: 0.8,
    },
    suggestionDescription: {
        fontSize: 13,
        color: colors.primaryLight,
        lineHeight: 18,
    },
    incomeCard: {
        backgroundColor: colors.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    incomeLeft: {
        flex: 1,
    },
    incomeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    incomeInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        padding: 0,
    },
    incomeValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    editButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary + '20',
        borderRadius: borderRadius.md,
    },
    editButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    debtSection: {
        marginTop: spacing.sm,
    },
    debtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    addDebtButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    addDebtText: {
        color: colors.primary,
        fontWeight: '600',
    },
    debtCard: {
        backgroundColor: colors.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    debtCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    debtName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    debtRate: {
        fontSize: 13,
        color: colors.warning,
        marginTop: 2,
    },
    debtDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    debtDetailLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    debtBalance: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    debtDetailRight: {
        alignItems: 'flex-end',
    },
    debtMinPayment: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    emptyState: {
        backgroundColor: colors.cardBackground,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
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
    modalInput: {
        backgroundColor: colors.cardBackgroundLight,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    saveButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
