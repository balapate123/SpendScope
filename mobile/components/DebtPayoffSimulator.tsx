import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/Theme';
import { TrendingDown, Calendar, ArrowRight } from 'lucide-react-native';

interface Debt {
    id: string;
    principal: number;
    rate: number;
    minPayment: number;
}

interface PayoffResult {
    months: number;
    totalInterest: number;
    payoffDate: Date;
}

interface Props {
    debts: Debt[];
    monthlyIncome: number;
}

export default function DebtPayoffSimulator({ debts, monthlyIncome }: Props) {
    const [extraPayment, setExtraPayment] = useState('');
    const [statusQuo, setStatusQuo] = useState<PayoffResult>({ months: 0, totalInterest: 0, payoffDate: new Date() });
    const [accelerated, setAccelerated] = useState<PayoffResult>({ months: 0, totalInterest: 0, payoffDate: new Date() });

    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);

    const calculatePayoff = (extra: number): PayoffResult => {
        if (debts.length === 0) return { months: 0, totalInterest: 0, payoffDate: new Date() };

        // Deep copy debts to simulate paying them down
        let currentDebts = debts.map(d => ({ ...d }));
        let totalInterest = 0;
        let months = 0;
        let monthlyExtra = extra;

        // Avalanche method: Sort by highest rate first
        currentDebts.sort((a, b) => b.rate - a.rate);

        while (currentDebts.some(d => d.principal > 0) && months < 1200) { // Cap at 100 years to prevent infinite loops
            months++;
            let availableExtra = monthlyExtra;

            for (let debt of currentDebts) {
                if (debt.principal <= 0) continue;

                const interest = (debt.principal * (debt.rate / 100)) / 12;
                totalInterest += interest;
                debt.principal += interest;

                let payment = debt.minPayment;

                // Add extra payment to highest interest debt
                if (availableExtra > 0) {
                    payment += availableExtra;
                    availableExtra = 0; // All extra used on highest priority
                }

                // If payment exceeds principal, leftover goes to next debt? 
                // For simplicity, we just zero out this debt and let next loop handle "snowballing" the freed up min payment logic if we wanted detailed snowball,
                // but here we just apply defined extra.
                // Actually, correct Avalanche implies once a debt is dead, its min payment + extra rolls over.
                // Let's implement full rollover logic properly later if needed, but for "Simulator" simple extra payment is often enough.
                // However, user asked for "Better work", so let's do rollover.

                // Real Rollover Logic: 
                // We have a "Total Budget" = Total Min Payments (fixed at start) + Extra.
                // Each month we pay min on all active.
                // Remaining budget goes to highest rate.
            }
        }

        // Let's re-implement with proper "Total Budget" approach for correctness
        currentDebts = debts.map(d => ({ ...d }));
        totalInterest = 0;
        months = 0;
        const totalBudget = totalMinPayment + extra;

        while (currentDebts.some(d => d.principal > 0.01) && months < 600) {
            months++;
            let monthBudget = totalBudget;

            // 1. Charge Interest
            currentDebts.forEach(d => {
                if (d.principal > 0) {
                    const interest = (d.principal * (d.rate / 100)) / 12;
                    d.principal += interest;
                    totalInterest += interest;
                }
            });

            // 2. Pay Minimums
            currentDebts.forEach(d => {
                if (d.principal > 0) {
                    let payment = d.minPayment;
                    if (payment > d.principal) payment = d.principal;
                    d.principal -= payment;
                    monthBudget -= payment;
                }
            });

            // 3. Apply Leftover Budget to Highest Rate (Avalanche)
            // Sort active debts by rate descending
            const activeDebts = currentDebts.filter(d => d.principal > 0).sort((a, b) => b.rate - a.rate);

            for (let debt of activeDebts) {
                if (monthBudget <= 0) break;
                let payment = monthBudget;
                if (payment > debt.principal) {
                    payment = debt.principal;
                }
                debt.principal -= payment;
                monthBudget -= payment;
            }
        }

        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + months);

        return { months, totalInterest, payoffDate };
    };

    useEffect(() => {
        setStatusQuo(calculatePayoff(0));
        const extra = parseFloat(extraPayment) || 0;
        setAccelerated(calculatePayoff(extra));
    }, [debts, extraPayment]);

    const formatMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <TrendingDown size={20} color={colors.primary} />
                </View>
                <Text style={styles.title}>Payoff Simulator</Text>
            </View>

            <Text style={styles.description}>
                See how faster you can be debt-free by adding an extra monthly contribution.
                (Assuming "Avalanche" method: highest interest first).
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Extra Monthly Payment</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                        style={styles.input}
                        value={extraPayment}
                        onChangeText={setExtraPayment}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>
            </View>

            {/* Comparison Cards */}
            <View style={styles.comparisonRow}>
                {/* Status Quo */}
                <View style={[styles.card, styles.statusQuoCard]}>
                    <Text style={styles.cardTitle}>Current Path</Text>
                    <Text style={styles.cardSubtitle}>Min Payments Only</Text>

                    <View style={styles.statRow}>
                        <Calendar size={14} color={colors.textMuted} />
                        <Text style={styles.statText}>{statusQuo.months} months</Text>
                    </View>
                    <Text style={styles.dateText}>
                        Debt Free by {statusQuo.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={styles.interestText}>
                        Total Interest: <Text style={{ color: colors.danger }}>{formatMoney(statusQuo.totalInterest)}</Text>
                    </Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowContainer}>
                    <ArrowRight size={24} color={colors.primary} />
                </View>

                {/* Accelerated */}
                <View style={[styles.card, styles.acceleratedCard]}>
                    <Text style={styles.cardTitle}>Accelerated</Text>
                    <Text style={styles.cardSubtitle}>+ ${extraPayment || '0'}/mo</Text>

                    <View style={styles.statRow}>
                        <Calendar size={14} color={colors.primary} />
                        <Text style={[styles.statText, { color: colors.primary, fontWeight: 'bold' }]}>
                            {accelerated.months} months
                        </Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                        {accelerated.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>

                    {statusQuo.months > accelerated.months && (
                        <View style={styles.savedBadge}>
                            <Text style={styles.savedText}>
                                Save {formatMoney(statusQuo.totalInterest - accelerated.totalInterest)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    iconBadge: {
        backgroundColor: colors.primary + '20',
        padding: 8,
        borderRadius: borderRadius.md,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    description: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        lineHeight: 18,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.cardBackgroundLight,
        paddingHorizontal: spacing.md,
    },
    inputPrefix: {
        fontSize: 18,
        color: colors.textPrimary,
        fontWeight: 'bold',
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    comparisonRow: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBackgroundLight,
    },
    statusQuoCard: {
        opacity: 0.8,
    },
    acceleratedCard: {
        borderColor: colors.primary + '50',
        backgroundColor: colors.primary + '10',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    dateText: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: spacing.sm,
    },
    interestText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    arrowContainer: {
        alignItems: 'center',
        height: 24,
        marginVertical: -8,
        zIndex: 10,
    },
    savedBadge: {
        backgroundColor: colors.success + '20',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xs,
    },
    savedText: {
        fontSize: 12,
        color: colors.success,
        fontWeight: 'bold',
    },
});
