import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { Calendar, Trophy, ChevronRight, X, BarChart2, Activity } from 'lucide-react-native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { useFocusEffect } from 'expo-router';

interface Transaction {
    id: string;
    merchant: string;
    amount: number;
    category: string;
    type: string;
    date: string;
}

interface CategoryData {
    name: string;
    amount: number;
    color: string;
    percentage: number;
    icon: string;
}

export default function Insights() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [focusedPie, setFocusedPie] = useState<{ name: string; amount: number } | null>(null);
    const [trendMode, setTrendMode] = useState<'7Days' | 'LastWeek' | 'Year'>('7Days');
    const [selectedTrendPoint, setSelectedTrendPoint] = useState<{ label: string, value: number } | null>(null);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${API_URL}/transactions`);
            setTransactions(res.data);
        } catch (e) {
            // console.error('Failed to fetch transactions', e);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Refresh when screen gains focus
    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [])
    );

    // Get date range based on trendMode
    const getDateRange = (): { start: Date; end: Date } => {
        const today = new Date();
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);

        if (trendMode === '7Days') {
            start.setDate(today.getDate() - 6);
        } else if (trendMode === 'LastWeek') {
            start.setDate(today.getDate() - 13);
            end.setDate(today.getDate() - 7);
            end.setHours(23, 59, 59, 999);
        } else if (trendMode === 'Year') {
            start.setMonth(0, 1); // Jan 1 of current year
        }

        return { start, end };
    };

    // Get transactions filtered by period
    const getFilteredExpenses = (): Transaction[] => {
        const { start, end } = getDateRange();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });
    };

    // Calculate category breakdown (filtered by period)
    const getCategoryData = (): CategoryData[] => {
        const expenses = getFilteredExpenses();
        const categoryTotals: Record<string, number> = {};

        expenses.forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

        const categoryColors: Record<string, string> = {
            'Food': colors.categoryFood,
            'Dining': colors.categoryFood,
            'Transport': colors.categoryTransport,
            'Shopping': colors.categoryShopping,
            'Bills': colors.categoryBills,
            'Entertainment': colors.warning,
            'Other': colors.categoryOther,
        };

        const categoryIcons: Record<string, string> = {
            'Food': '🍽️',
            'Dining': '🍽️',
            'Transport': '🚗',
            'Shopping': '🛒',
            'Bills': '📄',
            'Entertainment': '🎬',
            'Other': '📦',
        };

        return Object.entries(categoryTotals)
            .map(([name, amount]) => ({
                name,
                amount,
                color: categoryColors[name] || colors.categoryOther,
                percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
                icon: categoryIcons[name] || '📦',
            }))
            .sort((a, b) => b.amount - a.amount);
    };

    const categoryData = getCategoryData();
    const totalSpent = categoryData.reduce((sum, c) => sum + c.amount, 0);
    const topCategory = categoryData[0];


    // Pie chart data with onPress handler and stroke for gaps
    const pieData = categoryData.map((c, index) => ({
        value: c.amount,
        color: c.color,
        text: c.name,
        focused: focusedPie?.name === c.name,
        onPress: () => setFocusedPie({ name: c.name, amount: c.amount }),
        strokeWidth: 3,
        strokeColor: colors.cardBackground,
    }));

    // Trend Data Logic
    const getTrendData = () => {
        const today = new Date();
        let dataPoints: { label: string, date: Date }[] = [];

        if (trendMode === '7Days') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dataPoints.push({ label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], date: d });
            }
        } else if (trendMode === 'LastWeek') {
            for (let i = 13; i >= 7; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dataPoints.push({ label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], date: d });
            }
        } else if (trendMode === 'Year') {
            for (let i = 0; i < 12; i++) {
                const d = new Date(today.getFullYear(), i, 1);
                dataPoints.push({ label: d.toLocaleString('default', { month: 'short' }), date: d });
            }
        }

        return dataPoints.map(({ label, date }) => {
            let total = 0;
            const start = new Date(date);
            const end = new Date(date);

            if (trendMode === 'Year') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(start.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
            } else {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            }

            total = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'expense' && tDate >= start && tDate <= end;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                value: total,
                label,
                labelTextStyle: { color: colors.textSecondary, fontSize: 10 },
            };
        });
    };

    const trendData = getTrendData();

    const openCategoryDetail = (category: CategoryData) => {
        setSelectedCategory(category);
        setShowCategoryModal(true);
    };

    const getCategoryTransactions = (categoryName: string) => {
        const { start, end } = getDateRange();
        return transactions.filter(t => {
            if (t.category !== categoryName || t.type !== 'expense') return false;
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Insights</Text>
                    <View style={styles.periodSelector}>
                        <TouchableOpacity
                            style={[styles.periodBtn, trendMode === '7Days' && styles.periodBtnActive]}
                            onPress={() => setTrendMode('7Days')}
                        >
                            <Text style={[styles.periodText, trendMode === '7Days' && styles.periodTextActive]}>7 Days</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.periodBtn, trendMode === 'LastWeek' && styles.periodBtnActive]}
                            onPress={() => setTrendMode('LastWeek')}
                        >
                            <Text style={[styles.periodText, trendMode === 'LastWeek' && styles.periodTextActive]}>Lst Wk</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.periodBtn, trendMode === 'Year' && styles.periodBtnActive]}
                            onPress={() => setTrendMode('Year')}
                        >
                            <Text style={[styles.periodText, trendMode === 'Year' && styles.periodTextActive]}>Year</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Total Spent Card */}
                <View style={styles.totalSpentCard}>
                    <Text style={styles.totalSpentLabel}>
                        TOTAL SPENT • {trendMode === '7Days' ? 'Last 7 Days' : trendMode === 'LastWeek' ? 'Previous Week' : 'This Year'}
                    </Text>
                    <Text style={styles.totalSpentValue}>${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>

                {/* Top Category Card */}
                {topCategory && (
                    <View style={styles.topCategoryCard}>
                        <Text style={styles.topCategoryLabel}>TOP CATEGORY</Text>
                        <View style={styles.topCategoryRow}>
                            <View>
                                <Text style={styles.topCategoryName}>{topCategory.name}</Text>
                                <Text style={styles.topCategoryAmount}>
                                    <Text style={styles.amountHighlight}>${topCategory.amount.toFixed(2)}</Text> spent
                                </Text>
                            </View>
                            <View style={[styles.trophyIcon, { backgroundColor: colors.primary + '30' }]}>
                                <Trophy size={24} color={colors.primary} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Spending Breakdown */}
                <View style={styles.breakdownCard}>
                    <Text style={styles.sectionTitle}>Spending Breakdown</Text>

                    {pieData.length > 0 ? (
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={pieData}
                                donut
                                radius={100}
                                innerRadius={60}
                                innerCircleColor={colors.cardBackground}
                                focusOnPress
                                sectionAutoFocus
                                centerLabelComponent={() => (
                                    <View style={styles.centerLabel}>
                                        {focusedPie ? (
                                            <View style={styles.centerLabelBox}>
                                                <Text style={styles.centerLabelBoxText}>{focusedPie.name} : ${focusedPie.amount.toFixed(0)}</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.centerLabelBox}>
                                                <Text style={styles.centerLabelBoxText}>Tap segment</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            />
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>No spending data yet</Text>
                        </View>
                    )}

                    {/* Legend */}
                    <View style={styles.legend}>
                        {categoryData.map((cat) => (
                            <View key={cat.name} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                                <Text style={styles.legendText}>{cat.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Category Details */}
                <View style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>Category Details</Text>
                    <Text style={styles.sectionSubtitle}>Tap a category to see transactions</Text>

                    {categoryData.map((cat) => (
                        <TouchableOpacity
                            key={cat.name}
                            style={styles.categoryCard}
                            onPress={() => openCategoryDetail(cat)}
                        >
                            <View style={styles.categoryLeft}>
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                                </View>
                                <View>
                                    <Text style={styles.categoryName}>{cat.name}</Text>
                                    <Text style={styles.categoryPercentage}>{cat.percentage}% of total</Text>
                                </View>
                            </View>
                            <View style={styles.categoryRight}>
                                <Text style={styles.categoryAmount}>${cat.amount.toFixed(2)}</Text>
                                <ChevronRight size={18} color={colors.textMuted} />
                            </View>
                        </TouchableOpacity>
                    ))}

                    {categoryData.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Add some transactions to see insights</Text>
                        </View>
                    )}
                </View>

                {/* Trends */}
                <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                        <View style={styles.trendTitleRow}>
                            <Text style={styles.sectionTitle}>
                                {trendMode === 'Year' ? 'Monthly Trend' : 'Weekly Trend'}
                            </Text>
                            <View style={styles.trendIconBadge}>
                                <Activity size={14} color={colors.textSecondary} />
                            </View>
                        </View>
                        {selectedTrendPoint && (
                            <View style={styles.selectedValueDisplay}>
                                <Text style={styles.selectedValueDay}>{selectedTrendPoint.label}</Text>
                                <Text style={styles.selectedValueAmount}>${selectedTrendPoint.value.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.barChartContainer}>
                        <LineChart
                            data={trendData}
                            color={colors.chartPurple}
                            thickness={3}
                            hideDataPoints={false}
                            dataPointsColor={colors.chartPurple}
                            dataPointsRadius={5}
                            xAxisThickness={0}
                            yAxisThickness={0}
                            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                            noOfSections={4}
                            backgroundColor={colors.cardBackground}
                            hideRules
                            isAnimated
                            animationDuration={800}
                            curved
                            areaChart
                            startFillColor={colors.chartPurple}
                            endFillColor={colors.cardBackground}
                            startOpacity={0.3}
                            endOpacity={0.05}
                            initialSpacing={20}
                            endSpacing={20}
                            pointerConfig={{
                                pointerStripHeight: 160,
                                pointerStripColor: 'rgba(150,150,150,0.6)',
                                pointerStripWidth: 2,
                                pointerColor: colors.chartPurple,
                                radius: 8,
                                pointerLabelWidth: 0,
                                pointerLabelHeight: 0,
                                pointerLabelComponent: (items: any) => {
                                    if (items[0]) {
                                        setTimeout(() => setSelectedTrendPoint({ label: items[0].label, value: items[0].value }), 0);
                                    }
                                    return null;
                                },
                            }}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Category Detail Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleRow}>
                                <View style={[styles.modalIcon, { backgroundColor: (selectedCategory?.color || colors.primary) + '20' }]}>
                                    <Text style={styles.modalEmoji}>{selectedCategory?.icon}</Text>
                                </View>
                                <View>
                                    <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
                                    <Text style={styles.modalSubtitle}>Transaction History</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.transactionList}>
                            {selectedCategory && getCategoryTransactions(selectedCategory.name).map((tx) => (
                                <View key={tx.id} style={styles.transactionItem}>
                                    <View style={styles.transactionLeft}>
                                        <View style={[styles.txIcon, { backgroundColor: colors.danger + '20' }]}>
                                            <Text style={styles.txArrow}>↙</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.txMerchant}>{tx.merchant}</Text>
                                            <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.txAmount}>-${tx.amount.toFixed(2)}</Text>
                                </View>
                            ))}

                            {selectedCategory && getCategoryTransactions(selectedCategory.name).length === 0 && (
                                <Text style={styles.emptyText}>No transactions in this category</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackgroundLight,
        borderRadius: borderRadius.md,
        padding: 3,
        gap: 2,
    },
    periodBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    periodBtnActive: {
        backgroundColor: colors.primary,
    },
    periodText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600',
    },
    periodTextActive: {
        color: colors.textPrimary,
    },
    totalSpentCard: {
        marginHorizontal: spacing.lg,
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    totalSpentLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primaryLight,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    totalSpentValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    topCategoryCard: {
        marginHorizontal: spacing.lg,
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    topCategoryLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    topCategoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topCategoryName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    topCategoryAmount: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    amountHighlight: {
        color: colors.success,
        fontWeight: '600',
    },
    trophyIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdownCard: {
        marginHorizontal: spacing.lg,
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    centerLabel: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabelBox: {
        backgroundColor: 'rgba(30, 30, 40, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    centerLabelBoxText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    centerLabelText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    centerLabelSubtext: {
        fontSize: 12,
        color: colors.textMuted,
    },
    emptyChart: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    categorySection: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryEmoji: {
        fontSize: 22,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    categoryPercentage: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    categoryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    historyCard: {
        marginHorizontal: spacing.lg,
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: 100,
    },
    barChartContainer: {
        marginTop: spacing.md,
        overflow: 'hidden',
    },
    emptyState: {
        backgroundColor: colors.cardBackground,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
        zIndex: 9999,
        elevation: 10,
    },
    modalContent: {
        backgroundColor: colors.cardBackground,
        padding: spacing.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    modalIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalEmoji: {
        fontSize: 22,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    modalSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
    },
    transactionList: {
        marginTop: spacing.sm,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardBackgroundLight,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txArrow: {
        fontSize: 18,
        color: colors.danger,
    },
    txMerchant: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    txDate: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    trendIconBadge: {
        backgroundColor: colors.cardBackgroundLight,
        padding: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    trendTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    selectedValueDisplay: {
        backgroundColor: colors.cardBackgroundLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedValueDay: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    selectedValueAmount: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    tooltip: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.cardBackgroundLight,
        marginLeft: -50,
        marginTop: 10,
    },
    tooltipDay: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    tooltipAmount: {
        color: colors.primary,
        fontSize: 13,
        marginTop: 2,
    },
    lineTooltip: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 8,
    },
});
