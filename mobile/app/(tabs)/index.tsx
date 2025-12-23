import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Modal, StyleSheet, Platform, Dimensions } from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { colors, spacing, borderRadius } from '../../constants/Theme';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, X, BarChart2, Activity, ChevronRight, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Alert } from 'react-native';
import { addTransactionEmitter } from '../../utils/addTransactionEmitter';
import { useFocusEffect, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Predefined categories
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export default function Dashboard() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [selectedChartPoint, setSelectedChartPoint] = useState<{ label: string, value: number } | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'Month' | 'Year'>('Month');

  // Transaction form state
  const [txAmount, setTxAmount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txDate, setTxDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const [txRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`),
        axios.get(`${API_URL}/users/me`)
      ]);
      setTransactions(txRes.data);
      updateUser(userRes.data);
    } catch (e) {
      // Silently handle errors when not authenticated
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh when screen gains focus - this updates the chart
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Subscribe to FAB events
  useEffect(() => {
    const unsubscribe = addTransactionEmitter.subscribe(() => {
      setShowAddTransactionModal(true);
    });
    return unsubscribe;
  }, []);

  const handleAddTransaction = async () => {
    try {
      const amount = parseFloat(txAmount);
      if (isNaN(amount) || !txMerchant) {
        Alert.alert('Error', 'Please fill in amount and merchant');
        return;
      }

      // Use device's current date
      const now = new Date();

      await axios.post(`${API_URL}/transactions`, {
        amount,
        merchant: txMerchant,
        category: txCategory || 'Other',
        type: txType,
        date: txDate.toISOString(),
      });

      // Reset form and close modal
      setTxAmount('');
      setTxMerchant('');
      setTxCategory('');
      setTxType('expense');
      setTxDate(new Date());
      setShowAddTransactionModal(false);

      await fetchData();
    } catch (e) {
      console.error('Failed to add transaction', e);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  // Generate chart data based on chartPeriod
  const getChartData = () => {
    const today = new Date();
    let dataPoints: { date: Date; label: string }[] = [];

    if (chartPeriod === 'Month') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        dataPoints.push({ date, label: dayName });
      }
    } else {
      // Year: 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), i, 1);
        dataPoints.push({ date, label: date.toLocaleString('default', { month: 'short' }) });
      }
    }

    return dataPoints.map(({ date, label }) => {
      const start = new Date(date);
      const end = new Date(date);

      if (chartPeriod === 'Year') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
      } else {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      const total = transactions
        .filter(t => {
          const txDate = new Date(t.date);
          return t.type === 'expense' && txDate >= start && txDate <= end;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const roundedTotal = Math.round(total);
      return {
        value: roundedTotal,
        label,
        frontColor: colors.chartPurple,
        labelTextStyle: { color: colors.textSecondary, fontSize: 11 },
        onPress: () => setSelectedChartPoint({ label, value: roundedTotal }),
      };
    });
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Food': colors.categoryFood,
      'Dining': colors.categoryFood,
      'Transport': colors.categoryTransport,
      'Shopping': colors.categoryShopping,
      'Bills': colors.categoryBills,
      'Salary': colors.success,
      'Other': colors.categoryOther,
    };
    return categoryColors[category] || colors.categoryOther;
  };

  const categories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const chartData = getChartData();

  // Calculate total spent for the selected period
  const totalSpentForPeriod = chartData.reduce((sum, d) => sum + d.value, 0);
  const periodLabel = chartPeriod === 'Month' ? 'Last 7 Days' : 'This Year';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || (user?.email || '').split('@')[0]}</Text>
        </View>

        {/* Auto-Capture Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Auto-Capture (Android)</Text>
          </View>
        </View>

        {/* Total Spent Summary */}
        <View style={styles.totalSpentCard}>
          <Text style={styles.totalSpentLabel}>TOTAL SPENT • {periodLabel}</Text>
          <Text style={styles.totalSpentValue}>${totalSpentForPeriod.toLocaleString()}</Text>
        </View>

        {/* Trend Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Text style={styles.chartTitle}>Trend</Text>
              <View style={styles.chartIconBadge}>
                {chartType === 'bar' ? (
                  <BarChart2 size={14} color={colors.textSecondary} />
                ) : (
                  <Activity size={14} color={colors.textSecondary} />
                )}
              </View>
            </View>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodButton, chartPeriod === 'Month' && styles.periodButtonActive]}
                onPress={() => setChartPeriod('Month')}
              >
                <Text style={chartPeriod === 'Month' ? styles.periodButtonTextActive : styles.periodButtonText}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, chartPeriod === 'Year' && styles.periodButtonActive]}
                onPress={() => setChartPeriod('Year')}
              >
                <Text style={chartPeriod === 'Year' ? styles.periodButtonTextActive : styles.periodButtonText}>Year</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chart Type Toggle + Selected Value Display */}
          <View style={styles.chartTypeRow}>
            <View style={styles.chartToggleButtons}>
              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeButtonActive]}
                onPress={() => { setChartType('bar'); setSelectedChartPoint(null); }}
              >
                <BarChart2 size={18} color={chartType === 'bar' ? colors.textPrimary : colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeButtonActive]}
                onPress={() => { setChartType('line'); setSelectedChartPoint(null); }}
              >
                <Activity size={18} color={chartType === 'line' ? colors.textPrimary : colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedChartPoint && (
              <View style={styles.selectedValueDisplay}>
                <Text style={styles.selectedValueDay}>{selectedChartPoint.label}</Text>
                <Text style={styles.selectedValueAmount}>${selectedChartPoint.value}</Text>
              </View>
            )}
          </View>

          <View style={styles.chartContainer}>
            {chartType === 'bar' ? (
              <BarChart
                key={`bar-${chartPeriod}`}
                data={chartData}
                barWidth={chartPeriod === 'Year' ? 28 : 36}
                spacing={chartPeriod === 'Year' ? 24 : 30}
                initialSpacing={20}
                endSpacing={20}
                roundedTop
                roundedBottom
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                noOfSections={4}
                maxValue={(() => {
                  const maxVal = Math.max(...chartData.map((d: any) => d.value));
                  return maxVal > 0 ? Math.ceil(maxVal * 1.25) : 100;
                })()}
                backgroundColor={colors.cardBackground}
                hideRules
                isAnimated
                animationDuration={500}
                barBorderRadius={6}
                showValuesAsTopLabel
                topLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                <LineChart
                  key={`line-${chartPeriod}`}
                  data={chartData}
                  color={colors.chartPurple}
                  thickness={3}
                  hideDataPoints={false}
                  dataPointsColor={colors.chartPurple}
                  dataPointsRadius={5}
                  spacing={chartPeriod === 'Year' ? 60 : 70}
                  initialSpacing={20}
                  endSpacing={40}
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  noOfSections={4}
                  maxValue={(() => {
                    const maxVal = Math.max(...chartData.map((d: any) => d.value));
                    return maxVal > 0 ? Math.ceil(maxVal * 1.25) : 100;
                  })()}
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
                  pointerConfig={{
                    pointerStripHeight: 160,
                    pointerStripColor: 'rgba(150,150,150,0.6)',
                    pointerStripWidth: 2,
                    pointerColor: colors.chartPurple,
                    radius: 8,
                    pointerLabelWidth: 0,
                    pointerLabelHeight: 0,
                    pointerLabelComponent: (items: any) => {
                      // Update state instead of rendering tooltip
                      if (items[0]) {
                        setTimeout(() => setSelectedChartPoint({ label: items[0].label, value: items[0].value }), 0);
                      }
                      return null;
                    },
                  }}
                />
              </ScrollView>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/transactions')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recentTransactions.map((tx: any) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(tx.category) + '20' }]}>
                  {tx.type === 'income' ? (
                    <ArrowUpRight size={20} color={colors.success} />
                  ) : (
                    <ArrowDownLeft size={20} color={colors.danger} />
                  )}
                </View>
                <View>
                  <Text style={styles.merchantName}>{tx.merchant}</Text>
                  <Text style={styles.categoryName}>{tx.category}</Text>
                </View>
              </View>
              <Text style={[styles.amount, tx.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
            </View>
          ))}

          {recentTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first transaction</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddTransactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddTransactionModal(false)}>
                <X color={colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, txType === 'expense' && styles.typeButtonActiveRed]}
                onPress={() => { setTxType('expense'); setTxCategory(''); }}
              >
                <Text style={[styles.typeButtonText, txType === 'expense' && styles.typeButtonTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, txType === 'income' && styles.typeButtonActiveGreen]}
                onPress={() => { setTxType('income'); setTxCategory(''); }}
              >
                <Text style={[styles.typeButtonText, txType === 'income' && styles.typeButtonTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              placeholderTextColor={colors.textMuted}
              value={txAmount}
              onChangeText={setTxAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Merchant / Description"
              placeholderTextColor={colors.textMuted}
              value={txMerchant}
              onChangeText={setTxMerchant}
            />

            {/* Date Picker */}
            <Text style={styles.categoryLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={18} color={colors.textMuted} />
              <Text style={styles.dateButtonText}>
                {txDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={txDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setTxDate(selectedDate);
                }}
                maximumDate={new Date()}
                themeVariant="dark"
              />
            )}

            {/* Category Presets */}
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, txCategory === cat && styles.categoryChipActive]}
                  onPress={() => setTxCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, txCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addButton, txType === 'income' && styles.addButtonGreen]}
              onPress={handleAddTransaction}
            >
              <Text style={styles.addButtonText}>Add {txType === 'income' ? 'Income' : 'Expense'}</Text>
            </TouchableOpacity>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 4,
  },
  badgeContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  totalSpentCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  totalSpentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryLight,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  totalSpentValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  chartIconBadge: {
    backgroundColor: colors.cardBackgroundLight,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  periodButtonTextActive: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  chartTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTypeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.cardBackgroundLight,
  },
  chartTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  chartToggleButtons: {
    flexDirection: 'row',
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
  chartContainer: {
    marginTop: spacing.sm,
    overflow: 'hidden',
    minHeight: 200,
  },
  tooltip: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBackgroundLight,
  },
  tooltipPointer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBackgroundLight,
    marginLeft: -50,
    marginTop: 10,
  },
  barTooltip: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
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
  activitySection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    backgroundColor: colors.cardBackground,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
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
    paddingBottom: 90,
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
  typeToggle: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackgroundLight,
    alignItems: 'center',
  },
  typeButtonActiveRed: {
    backgroundColor: colors.danger,
  },
  typeButtonActiveGreen: {
    backgroundColor: colors.success,
  },
  typeButtonText: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeButtonTextActive: {
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
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: borderRadius.full,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addButtonGreen: {
    backgroundColor: colors.success,
  },
  addButtonText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dateButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
