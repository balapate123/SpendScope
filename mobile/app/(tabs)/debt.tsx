import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { Plus, X, ChevronDown, ChevronUp, Edit3, Trash2, TrendingDown, BarChart3, Check, AlertTriangle, Sparkles } from 'lucide-react-native';
import axios from 'axios';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Debt {
    id: string;
    name: string;
    principal: number;
    rate: number;
    minPayment: number;
}

interface PayoffResult {
    months: number;
    totalInterest: number;
    payoffDate: Date;
    milestones: { name: string; month: number; date: Date }[];
    monthlyData: { month: number; balance: number }[];
}

type PaymentStrategy = 'minimum' | 'custom' | 'maximum';

export default function DebtManager() {
    const { user, updateUser, isAuthenticated } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);

    // Financial Power state
    const [financialPowerExpanded, setFinancialPowerExpanded] = useState(false);
    const [monthlyIncome, setMonthlyIncome] = useState('5000');
    const [livingCosts, setLivingCosts] = useState('2500');

    // Payment Strategy
    const [paymentStrategy, setPaymentStrategy] = useState<PaymentStrategy>('custom');
    const [customExtra, setCustomExtra] = useState(500);

    // Chart toggle
    const [chartType, setChartType] = useState<'balance' | 'cost'>('balance');

    // Modals
    const [showAddDebtModal, setShowAddDebtModal] = useState(false);
    const [showEditDebtModal, setShowEditDebtModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    // Debt form
    const [debtName, setDebtName] = useState('');
    const [debtPrincipal, setDebtPrincipal] = useState('');
    const [debtRate, setDebtRate] = useState('');
    const [debtMinPayment, setDebtMinPayment] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetchDebts();
        }
        if (user?.monthlyIncome) {
            setMonthlyIncome(user.monthlyIncome.toString());
        }
    }, [user, isAuthenticated]);

    const fetchDebts = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get(`${API_URL}/debts`);
            setDebts(res.data);
        } catch (e) {
            // Silently handle
        }
    };

    // Calculations
    const income = parseFloat(monthlyIncome) || 0;
    const living = parseFloat(livingCosts) || 0;
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const disposableIncome = Math.max(0, income - living - totalMinPayment);
    const freedomGap = income > 0 ? Math.round((disposableIncome / income) * 100) : 0;
    const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);

    // Calculate extra payment based on strategy
    const extraPayment = useMemo(() => {
        switch (paymentStrategy) {
            case 'minimum': return 0;
            case 'maximum': return disposableIncome;
            case 'custom': return Math.min(customExtra, disposableIncome);
        }
    }, [paymentStrategy, customExtra, disposableIncome]);

    const totalMonthlyPayment = totalMinPayment + extraPayment;

    // Payoff calculation
    const calculatePayoff = (extra: number): PayoffResult => {
        if (debts.length === 0) {
            return { months: 0, totalInterest: 0, payoffDate: new Date(), milestones: [], monthlyData: [] };
        }

        let currentDebts = debts.map(d => ({ ...d, originalName: d.name }));
        let totalInterest = 0;
        let months = 0;
        const totalBudget = totalMinPayment + extra;
        const milestones: { name: string; month: number; date: Date }[] = [];
        const monthlyData: { month: number; balance: number }[] = [];

        // Record initial state
        monthlyData.push({ month: 0, balance: currentDebts.reduce((s, d) => s + d.principal, 0) });

        // Avalanche: Sort by highest rate
        currentDebts.sort((a, b) => b.rate - a.rate);

        while (currentDebts.some(d => d.principal > 0.01) && months < 600) {
            months++;
            let monthBudget = totalBudget;

            // Charge interest
            currentDebts.forEach(d => {
                if (d.principal > 0) {
                    const interest = (d.principal * (d.rate / 100)) / 12;
                    d.principal += interest;
                    totalInterest += interest;
                }
            });

            // Pay minimums
            currentDebts.forEach(d => {
                if (d.principal > 0) {
                    let payment = Math.min(d.minPayment, d.principal);
                    d.principal -= payment;
                    monthBudget -= payment;

                    // Check if paid off
                    if (d.principal <= 0.01 && d.principal >= -0.01) {
                        d.principal = 0;
                        const payoffDate = new Date();
                        payoffDate.setMonth(payoffDate.getMonth() + months);
                        milestones.push({ name: d.name, month: months, date: payoffDate });
                    }
                }
            });

            // Apply leftover to highest rate (Avalanche)
            const activeDebts = currentDebts.filter(d => d.principal > 0).sort((a, b) => b.rate - a.rate);
            for (let debt of activeDebts) {
                if (monthBudget <= 0) break;
                let payment = Math.min(monthBudget, debt.principal);
                debt.principal -= payment;
                monthBudget -= payment;

                if (debt.principal <= 0.01) {
                    debt.principal = 0;
                    const payoffDate = new Date();
                    payoffDate.setMonth(payoffDate.getMonth() + months);
                    if (!milestones.find(m => m.name === debt.name)) {
                        milestones.push({ name: debt.name, month: months, date: payoffDate });
                    }
                }
            }

            // Record monthly balance
            const totalBalance = currentDebts.reduce((s, d) => s + Math.max(0, d.principal), 0);
            monthlyData.push({ month: months, balance: totalBalance });
        }

        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + months);

        return { months, totalInterest, payoffDate, milestones, monthlyData };
    };

    const currentPlan = useMemo(() => calculatePayoff(extraPayment), [debts, extraPayment, totalMinPayment]);
    const minimumPlan = useMemo(() => calculatePayoff(0), [debts, totalMinPayment]);
    const interestSaved = minimumPlan.totalInterest - currentPlan.totalInterest;

    // Chart data
    const chartData = useMemo(() => {
        if (chartType === 'balance') {
            // Sample every few months to avoid too many points
            const step = Math.max(1, Math.floor(currentPlan.monthlyData.length / 12));
            return currentPlan.monthlyData
                .filter((_, i) => i % step === 0 || i === currentPlan.monthlyData.length - 1)
                .map(d => ({
                    value: Math.round(d.balance),
                    label: d.month === 0 ? 'Now' : `M${d.month}`,
                    labelTextStyle: { color: colors.textMuted, fontSize: 10 },
                }));
        } else {
            // Cost impact comparison
            return [
                { value: Math.round(minimumPlan.totalInterest), label: 'Slow Path', frontColor: colors.danger },
                { value: Math.round(currentPlan.totalInterest), label: 'Your Plan', frontColor: colors.success },
            ];
        }
    }, [chartType, currentPlan, minimumPlan]);

    // CRUD operations
    const addDebt = async () => {
        try {
            const principal = parseFloat(debtPrincipal);
            const rate = parseFloat(debtRate) || 0;
            const minPayment = parseFloat(debtMinPayment) || Math.ceil(principal * 0.02);

            if (!debtName || isNaN(principal)) {
                Alert.alert('Error', 'Please fill in required fields');
                return;
            }

            await axios.post(`${API_URL}/debts`, { name: debtName, principal, rate, minPayment });
            resetForm();
            setShowAddDebtModal(false);
            fetchDebts();
        } catch (e) {
            Alert.alert('Error', 'Failed to add debt');
        }
    };

    const updateDebt = async () => {
        if (!editingDebt) return;
        try {
            const principal = parseFloat(debtPrincipal);
            const rate = parseFloat(debtRate) || 0;
            const minPayment = parseFloat(debtMinPayment) || Math.ceil(principal * 0.02);

            if (!debtName || isNaN(principal)) {
                Alert.alert('Error', 'Please fill in required fields');
                return;
            }

            await axios.patch(`${API_URL}/debts/${editingDebt.id}`, { name: debtName, principal, rate, minPayment });
            resetForm();
            setShowEditDebtModal(false);
            setEditingDebt(null);
            fetchDebts();
        } catch (e) {
            Alert.alert('Error', 'Failed to update debt');
        }
    };

    const deleteDebt = async (id: string) => {
        Alert.alert('Delete Debt', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/debts/${id}`);
                        fetchDebts();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                },
            },
        ]);
    };

    const openEditModal = (debt: Debt) => {
        setEditingDebt(debt);
        setDebtName(debt.name);
        setDebtPrincipal(debt.principal.toString());
        setDebtRate(debt.rate.toString());
        setDebtMinPayment(debt.minPayment.toString());
        setShowEditDebtModal(true);
    };

    const resetForm = () => {
        setDebtName('');
        setDebtPrincipal('');
        setDebtRate('');
        setDebtMinPayment('');
    };

    const updateIncome = async () => {
        try {
            const incomeVal = parseFloat(monthlyIncome);
            if (!isNaN(incomeVal)) {
                await axios.patch(`${API_URL}/users/me`, { monthlyIncome: incomeVal });
                updateUser({ monthlyIncome: incomeVal });
            }
        } catch (e) {
            console.error('Failed to update income');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Debt Manager</Text>
                        <Text style={styles.subtitle}>Analyze. Plan. Destroy.</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddDebtModal(true)}>
                        <Plus size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Financial Power Dropdown */}
                <TouchableOpacity
                    style={styles.financialPowerHeader}
                    onPress={() => setFinancialPowerExpanded(!financialPowerExpanded)}
                >
                    <View style={styles.financialPowerRow}>
                        <Text style={styles.financialPowerIcon}>⫶</Text>
                        <Text style={styles.financialPowerTitle}>Financial Power</Text>
                    </View>
                    {financialPowerExpanded ?
                        <ChevronUp size={20} color={colors.textMuted} /> :
                        <ChevronDown size={20} color={colors.textMuted} />
                    }
                </TouchableOpacity>

                {financialPowerExpanded && (
                    <View style={styles.financialPowerContent}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>INCOME (NET) ⓘ</Text>
                                <View style={styles.dollarInput}>
                                    <Text style={styles.dollarSign}>$</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        value={monthlyIncome}
                                        onChangeText={setMonthlyIncome}
                                        onBlur={updateIncome}
                                        keyboardType="numeric"
                                        placeholder="5000"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>LIVING COSTS ⓘ</Text>
                                <View style={styles.dollarInput}>
                                    <Text style={styles.dollarSign}>$</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        value={livingCosts}
                                        onChangeText={setLivingCosts}
                                        keyboardType="numeric"
                                        placeholder="2500"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                                <Text style={styles.inputHint}>Rent, Food, Transport (No Debt)</Text>
                            </View>
                        </View>

                        {/* Cash Flow Visualization */}
                        <Text style={styles.cashFlowLabel}>CASH FLOW VISUALIZATION</Text>
                        <View style={styles.cashFlowBar}>
                            <View style={[styles.cashFlowSegment, { flex: living, backgroundColor: colors.primary }]} />
                            <View style={[styles.cashFlowSegment, { flex: totalMinPayment || 1, backgroundColor: colors.warning }]} />
                            <View style={[styles.cashFlowSegment, { flex: disposableIncome || 1, backgroundColor: colors.success }]} />
                        </View>
                        <View style={styles.cashFlowLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                                <Text style={styles.legendText}>Living ${living.toLocaleString()}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                                <Text style={styles.legendText}>Debt Min ${totalMinPayment}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                                <Text style={styles.legendText}>Disposable ${disposableIncome.toLocaleString()}</Text>
                            </View>
                        </View>
                        <Text style={styles.freedomGap}>FREEDOM GAP: {freedomGap}%</Text>
                    </View>
                )}

                {/* Payment Strategy Selector */}
                <Text style={styles.sectionLabel}>SELECT PAYMENT STRATEGY</Text>
                <View style={styles.strategyRow}>
                    {(['minimum', 'custom', 'maximum'] as PaymentStrategy[]).map((strategy) => (
                        <TouchableOpacity
                            key={strategy}
                            style={[styles.strategyButton, paymentStrategy === strategy && styles.strategyButtonActive]}
                            onPress={() => setPaymentStrategy(strategy)}
                        >
                            <Text style={[styles.strategyText, paymentStrategy === strategy && styles.strategyTextActive]}>
                                {strategy === 'minimum' ? 'Minimums Only' : strategy === 'custom' ? 'Custom Amount' : 'Max Speed'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Total Monthly Payment Card */}
                <View style={styles.paymentCard}>
                    <View style={styles.paymentCardHeader}>
                        <View>
                            <Text style={styles.paymentCardLabel}>TOTAL MONTHLY PAYMENT</Text>
                            <Text style={styles.paymentCardSubtitle}>The actual amount leaving your bank</Text>
                        </View>
                        {paymentStrategy === 'custom' && <Text style={styles.adjustingBadge}>Adjusting...</Text>}
                    </View>

                    <Text style={styles.paymentAmount}>${totalMonthlyPayment.toLocaleString()} <Text style={styles.paymentSuffix}>/month</Text></Text>

                    {paymentStrategy === 'minimum' && (
                        <View style={styles.warningRow}>
                            <AlertTriangle size={14} color={colors.warning} />
                            <Text style={styles.warningText}>Warning: Paying only minimums maximizes interest costs.</Text>
                        </View>
                    )}

                    {paymentStrategy === 'maximum' && (
                        <View style={styles.successRow}>
                            <Sparkles size={14} color={colors.success} />
                            <Text style={styles.successText}>You are using 100% of your disposable income (${disposableIncome}) to crush debt.</Text>
                        </View>
                    )}

                    {paymentStrategy === 'custom' && (
                        <>
                            <View style={styles.sliderLabels}>
                                <Text style={styles.sliderBaseLabel}>Base Minimums: ${totalMinPayment}</Text>
                                <Text style={styles.sliderExtraLabel}>+${extraPayment} Extra</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={disposableIncome}
                                value={customExtra}
                                onValueChange={(val) => setCustomExtra(Math.round(val))}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.cardBackgroundLight}
                                thumbTintColor={colors.primary}
                            />
                            <Text style={styles.sliderHint}>Slide to increase your extra payment</Text>
                        </>
                    )}

                    {/* Interest to pay */}
                    <View style={styles.interestRow}>
                        <Text style={styles.interestLabel}>Total Interest You'll Pay:</Text>
                        <Text style={[styles.interestValue, { color: currentPlan.totalInterest > 1000 ? colors.warning : colors.success }]}>
                            ${Math.round(currentPlan.totalInterest).toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Projection Chart */}
                <View style={styles.projectionCard}>
                    <View style={styles.projectionHeader}>
                        <View>
                            <Text style={styles.projectionLabel}>PROJECTION</Text>
                            <Text style={styles.projectionTitle}>{chartType === 'balance' ? 'Balance Over Time' : 'Cost Impact'}</Text>
                        </View>
                        <View style={styles.chartToggle}>
                            <TouchableOpacity
                                style={[styles.chartToggleBtn, chartType === 'balance' && styles.chartToggleBtnActive]}
                                onPress={() => setChartType('balance')}
                            >
                                <TrendingDown size={16} color={chartType === 'balance' ? colors.textPrimary : colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.chartToggleBtn, chartType === 'cost' && styles.chartToggleBtnActive]}
                                onPress={() => setChartType('cost')}
                            >
                                <BarChart3 size={16} color={chartType === 'cost' ? colors.textPrimary : colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.chartContainer}>
                        {chartType === 'balance' ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={true}
                                contentContainerStyle={{ paddingRight: 20 }}
                            >
                                <LineChart
                                    data={chartData}
                                    color={colors.primary}
                                    thickness={3}
                                    dataPointsColor={colors.textPrimary}
                                    dataPointsRadius={6}
                                    spacing={60}
                                    initialSpacing={40}
                                    endSpacing={40}
                                    xAxisThickness={0}
                                    yAxisThickness={0}
                                    yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                                    noOfSections={4}
                                    maxValue={totalDebt * 1.1}
                                    backgroundColor={colors.cardBackground}
                                    hideRules
                                    curved
                                    areaChart
                                    startFillColor={colors.primary}
                                    endFillColor={colors.cardBackground}
                                    startOpacity={0.4}
                                    endOpacity={0.1}
                                    height={150}
                                    width={Math.max(SCREEN_WIDTH - 80, chartData.length * 60)}
                                    isAnimated
                                    animationDuration={500}
                                    pointerConfig={{
                                        pointerStripHeight: 150,
                                        pointerStripColor: colors.primary + '60',
                                        pointerStripWidth: 2,
                                        pointerColor: colors.primary,
                                        radius: 8,
                                        pointerLabelWidth: 100,
                                        pointerLabelHeight: 70,
                                        activatePointersOnLongPress: false,
                                        autoAdjustPointerLabelPosition: true,
                                        persistPointer: true,
                                        shiftPointerLabelX: -50,
                                        shiftPointerLabelY: -80,
                                        pointerLabelComponent: (items: any) => {
                                            return (
                                                <View style={{
                                                    backgroundColor: colors.cardBackgroundLight,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.primary,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 4,
                                                    elevation: 5,
                                                }}>
                                                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>Balance</Text>
                                                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                                                        ${items[0]?.value?.toLocaleString()}
                                                    </Text>
                                                </View>
                                            );
                                        },
                                    }}
                                />
                            </ScrollView>
                        ) : (
                            <View style={styles.costComparisonContainer}>
                                <View style={styles.costBar}>
                                    <Text style={styles.costBarLabel}>Slow Path</Text>
                                    <View style={[styles.costBarFill, { width: '100%', backgroundColor: colors.danger }]}>
                                        <Text style={styles.costBarValue}>${Math.round(minimumPlan.totalInterest).toLocaleString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.costBar}>
                                    <View style={styles.costBarLabelRow}>
                                        <Text style={styles.costBarLabel}>Your Plan</Text>
                                        {currentPlan.totalInterest < minimumPlan.totalInterest * 0.2 && (
                                            <Text style={[styles.costBarValue, { color: colors.success, marginLeft: 8 }]}>
                                                ${Math.round(currentPlan.totalInterest).toLocaleString()}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={[styles.costBarFill, {
                                        width: `${Math.max(15, (currentPlan.totalInterest / minimumPlan.totalInterest) * 100)}%`,
                                        backgroundColor: colors.success,
                                        minWidth: 60,
                                    }]}>
                                        {currentPlan.totalInterest >= minimumPlan.totalInterest * 0.2 && (
                                            <Text style={styles.costBarValue}>${Math.round(currentPlan.totalInterest).toLocaleString()}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.projectionStats}>
                        <View>
                            <Text style={styles.projectionStatLabel}>Interest Saved</Text>
                            <Text style={[styles.projectionStatValue, { color: colors.success }]}>${Math.round(interestSaved).toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.projectionStatLabel}>Freedom Date</Text>
                            <Text style={styles.projectionStatValue}>
                                {currentPlan.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Milestones */}
                <Text style={styles.sectionTitle}>MILESTONES</Text>
                {currentPlan.milestones.map((milestone, index) => (
                    <TouchableOpacity key={index} style={styles.milestoneCard} onPress={() => {
                        const debt = debts.find(d => d.name === milestone.name);
                        if (debt) openEditModal(debt);
                    }}>
                        <View style={styles.milestoneLeft}>
                            <View style={styles.milestoneCheck}>
                                <Check size={16} color={colors.success} />
                            </View>
                            <View>
                                <Text style={styles.milestoneName}>{milestone.name}</Text>
                                <Text style={styles.milestoneSubtext}>Paid off ${debts.find(d => d.name === milestone.name)?.principal.toLocaleString() || '0'}</Text>
                            </View>
                        </View>
                        <Text style={styles.milestoneDate}>
                            {milestone.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* Debt Free Card */}
                {currentPlan.months > 0 && (
                    <View style={styles.debtFreeCard}>
                        <View style={styles.debtFreeIcon}>
                            <Sparkles size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.debtFreeTitle}>Debt Free</Text>
                            <Text style={styles.debtFreeSubtext}>
                                Estimated: {currentPlan.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                )}

                {debts.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No debts added yet 🎉</Text>
                        <Text style={styles.emptySubtext}>You're debt-free! Add debts to start planning.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Debt Modal */}
            <Modal visible={showAddDebtModal} transparent animationType="slide" onRequestClose={() => setShowAddDebtModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Debt</Text>
                            <TouchableOpacity onPress={() => { resetForm(); setShowAddDebtModal(false); }}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.modalInput} placeholder="Debt Name (e.g. Chase Card)" placeholderTextColor={colors.textMuted} value={debtName} onChangeText={setDebtName} />
                        <TextInput style={styles.modalInput} placeholder="Balance ($)" placeholderTextColor={colors.textMuted} value={debtPrincipal} onChangeText={setDebtPrincipal} keyboardType="numeric" />
                        <TextInput style={styles.modalInput} placeholder="APR % (e.g. 19.99)" placeholderTextColor={colors.textMuted} value={debtRate} onChangeText={setDebtRate} keyboardType="decimal-pad" />
                        <TextInput style={styles.modalInput} placeholder="Min Payment (optional)" placeholderTextColor={colors.textMuted} value={debtMinPayment} onChangeText={setDebtMinPayment} keyboardType="numeric" />

                        <TouchableOpacity style={styles.saveButton} onPress={addDebt}>
                            <Text style={styles.saveButtonText}>Add Debt</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Debt Modal */}
            <Modal visible={showEditDebtModal} transparent animationType="slide" onRequestClose={() => setShowEditDebtModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Debt</Text>
                            <TouchableOpacity onPress={() => { resetForm(); setShowEditDebtModal(false); setEditingDebt(null); }}>
                                <X color={colors.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.modalInput} placeholder="Debt Name" placeholderTextColor={colors.textMuted} value={debtName} onChangeText={setDebtName} />
                        <TextInput style={styles.modalInput} placeholder="Balance ($)" placeholderTextColor={colors.textMuted} value={debtPrincipal} onChangeText={setDebtPrincipal} keyboardType="numeric" />
                        <TextInput style={styles.modalInput} placeholder="APR %" placeholderTextColor={colors.textMuted} value={debtRate} onChangeText={setDebtRate} keyboardType="decimal-pad" />
                        <TextInput style={styles.modalInput} placeholder="Min Payment" placeholderTextColor={colors.textMuted} value={debtMinPayment} onChangeText={setDebtMinPayment} keyboardType="numeric" />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => {
                                if (editingDebt) deleteDebt(editingDebt.id);
                                setShowEditDebtModal(false);
                                setEditingDebt(null);
                                resetForm();
                            }}>
                                <Trash2 size={18} color={colors.danger} />
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={updateDebt}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    addButton: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.full },

    // Financial Power
    financialPowerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardBackground, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
    financialPowerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    financialPowerIcon: { color: colors.primary, fontSize: 18 },
    financialPowerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
    financialPowerContent: { backgroundColor: colors.cardBackground, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    inputRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: spacing.xs },
    dollarInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackgroundLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm },
    dollarSign: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
    inputField: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', padding: spacing.sm },
    inputHint: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    cashFlowLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: spacing.sm },
    cashFlowBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
    cashFlowSegment: { height: '100%' },
    cashFlowLegend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: colors.textMuted },
    freedomGap: { fontSize: 11, color: colors.success, fontWeight: '600', textAlign: 'right' },

    // Payment Strategy
    sectionLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
    strategyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    strategyButton: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.cardBackground, alignItems: 'center' },
    strategyButtonActive: { backgroundColor: colors.primary },
    strategyText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    strategyTextActive: { color: colors.textPrimary },

    // Payment Card
    paymentCard: { backgroundColor: colors.primary + '15', borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primary + '30' },
    paymentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    paymentCardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
    paymentCardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    adjustingBadge: { fontSize: 11, color: colors.primary, fontWeight: '600' },
    paymentAmount: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary },
    paymentSuffix: { fontSize: 16, fontWeight: 'normal', color: colors.textSecondary },
    warningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.warning + '20', padding: spacing.sm, borderRadius: borderRadius.md },
    warningText: { fontSize: 12, color: colors.warning, flex: 1 },
    successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.success + '20', padding: spacing.sm, borderRadius: borderRadius.md },
    successText: { fontSize: 12, color: colors.success, flex: 1 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
    sliderBaseLabel: { fontSize: 12, color: colors.textMuted },
    sliderExtraLabel: { fontSize: 12, color: colors.primary, fontWeight: 'bold' },
    slider: { width: '100%', height: 40 },
    sliderHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    interestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBackgroundLight },
    interestLabel: { fontSize: 13, color: colors.textMuted },
    interestValue: { fontSize: 16, fontWeight: 'bold' },

    // Projection
    projectionCard: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
    projectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    projectionLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
    projectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    chartToggle: { flexDirection: 'row', backgroundColor: colors.cardBackgroundLight, borderRadius: borderRadius.md, padding: 2 },
    chartToggleBtn: { padding: spacing.sm, borderRadius: borderRadius.sm },
    chartToggleBtnActive: { backgroundColor: colors.primary },
    chartContainer: { marginVertical: spacing.md, alignItems: 'center' },
    costComparisonContainer: { width: '100%', gap: spacing.md },
    costBar: { gap: spacing.xs },
    costBarLabel: { fontSize: 12, color: colors.textMuted },
    costBarLabelRow: { flexDirection: 'row', alignItems: 'center' },
    costBarFill: { height: 32, borderRadius: borderRadius.md, justifyContent: 'center', paddingHorizontal: spacing.md },
    costBarValue: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    projectionStats: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBackgroundLight },
    projectionStatLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
    projectionStatValue: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

    // Milestones
    sectionTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
    milestoneCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardBackground, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
    milestoneLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    milestoneCheck: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center' },
    milestoneName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textDecorationLine: 'line-through', textDecorationColor: colors.textMuted },
    milestoneSubtext: { fontSize: 12, color: colors.textMuted },
    milestoneDate: { fontSize: 13, color: colors.textMuted },
    debtFreeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: borderRadius.xl, marginTop: spacing.sm, marginBottom: spacing.lg, backgroundColor: colors.primary, },
    debtFreeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    debtFreeTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    debtFreeSubtext: { fontSize: 13, color: colors.primaryLight },

    // Empty State
    emptyState: { backgroundColor: colors.cardBackground, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg },
    emptyText: { fontSize: 16, color: colors.textSecondary },
    emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.cardBackground, padding: spacing.lg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
    modalInput: { backgroundColor: colors.cardBackgroundLight, padding: spacing.md, borderRadius: borderRadius.md, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.md },
    modalButtonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
    deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.danger },
    deleteButtonText: { color: colors.danger, fontWeight: '600' },
    saveButton: { flex: 2, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    saveButtonText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
});
