import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../constants/Theme';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Trash2, Edit2, X } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants/Config';

interface Transaction {
    id: string;
    merchant: string;
    amount: number;
    category: string;
    type: string;
    date: string;
}

export default function AllTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editMerchant, setEditMerchant] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editType, setEditType] = useState<'income' | 'expense'>('expense');

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${API_URL}/transactions`);
            setTransactions(res.data);
        } catch (e) {
            // Silently handle
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [])
    );

    const openEditModal = (tx: Transaction) => {
        setEditingTransaction(tx);
        setEditMerchant(tx.merchant);
        setEditAmount(tx.amount.toString());
        setEditCategory(tx.category);
        setEditType(tx.type as 'income' | 'expense');
        setShowEditModal(true);
    };

    const saveTransaction = async () => {
        if (!editingTransaction) return;
        try {
            await axios.patch(`${API_URL}/transactions/${editingTransaction.id}`, {
                merchant: editMerchant,
                amount: parseFloat(editAmount),
                category: editCategory,
                type: editType,
            });
            setShowEditModal(false);
            setEditingTransaction(null);
            fetchTransactions();
        } catch (e) {
            Alert.alert('Error', 'Failed to update transaction');
        }
    };

    const deleteTransaction = async (id: string) => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/transactions/${id}`);
                            setShowEditModal(false);
                            fetchTransactions();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete transaction');
                        }
                    },
                },
            ]
        );
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups: Record<string, Transaction[]>, tx) => {
        const date = new Date(tx.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
    }, {});

    const getCategoryColor = (category: string) => {
        const categoryColors: Record<string, string> = {
            'Food': colors.categoryFood,
            'Transport': colors.categoryTransport,
            'Shopping': colors.categoryShopping,
            'Bills': colors.categoryBills,
            'Salary': colors.success,
            'Other': colors.categoryOther,
        };
        return categoryColors[category] || colors.categoryOther;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>All Transactions</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {(['all', 'expense', 'income'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Transactions List */}
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(groupedTransactions).map(([date, txs]) => (
                    <View key={date}>
                        <Text style={styles.dateHeader}>{date}</Text>
                        {txs.map((tx) => (
                            <View key={tx.id} style={styles.transactionCard}>
                                <View style={styles.transactionLeft}>
                                    <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(tx.category) + '20' }]}>
                                        {tx.type === 'income' ? (
                                            <ArrowUpRight size={20} color={colors.success} />
                                        ) : (
                                            <ArrowDownLeft size={20} color={colors.danger} />
                                        )}
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={styles.merchantName}>{tx.merchant}</Text>
                                        <Text style={styles.categoryName}>{tx.category}</Text>
                                    </View>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.amount, tx.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => openEditModal(tx)}
                                        style={styles.actionButton}
                                    >
                                        <Edit2 size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteTransaction(tx.id)}
                                        style={styles.actionButton}
                                    >
                                        <Trash2 size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}

                {filteredTransactions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                )}
            </ScrollView>

            {/* Edit Transaction Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Transaction</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.editInput}
                            value={editMerchant}
                            onChangeText={setEditMerchant}
                            placeholder="Merchant"
                            placeholderTextColor={colors.textMuted}
                        />

                        <TextInput
                            style={styles.editInput}
                            value={editAmount}
                            onChangeText={setEditAmount}
                            placeholder="Amount"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />

                        <TextInput
                            style={styles.editInput}
                            value={editCategory}
                            onChangeText={setEditCategory}
                            placeholder="Category"
                            placeholderTextColor={colors.textMuted}
                        />

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, editType === 'expense' && styles.typeBtnActiveExpense]}
                                onPress={() => setEditType('expense')}
                            >
                                <Text style={[styles.typeText, editType === 'expense' && styles.typeTextActive]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, editType === 'income' && styles.typeBtnActiveIncome]}
                                onPress={() => setEditType('income')}
                            >
                                <Text style={[styles.typeText, editType === 'income' && styles.typeTextActive]}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.editButtonRow}>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => editingTransaction && deleteTransaction(editingTransaction.id)}
                            >
                                <Trash2 size={18} color={colors.danger} />
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={saveTransaction}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    filterButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    filterTextActive: {
        color: colors.textPrimary,
    },
    dateHeader: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginTop: spacing.sm,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardBackground,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    merchantName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    categoryName: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    transactionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    incomeAmount: {
        color: colors.success,
    },
    expenseAmount: {
        color: colors.textPrimary,
    },
    actionButton: {
        padding: spacing.xs,
    },
    emptyState: {
        backgroundColor: colors.cardBackground,
        marginHorizontal: spacing.lg,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
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
    editInput: {
        backgroundColor: colors.cardBackgroundLight,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.cardBackgroundLight,
        alignItems: 'center',
    },
    typeBtnActiveExpense: {
        backgroundColor: colors.danger + '20',
        borderColor: colors.danger,
    },
    typeBtnActiveIncome: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
    },
    typeText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    typeTextActive: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    editButtonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteBtnText: {
        fontSize: 14,
        color: colors.danger,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 2,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
    },
});
