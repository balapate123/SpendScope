// Theme constants for SpendScope dark mode
export const colors = {
  // Backgrounds
  background: '#0f0f1a',
  cardBackground: '#1a1a2e',
  cardBackgroundLight: '#252542',

  // Primary colors
  primary: '#6366f1',
  primaryLight: '#818cf8',

  // Status colors
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Category colors
  categoryFood: '#3b82f6',
  categoryTransport: '#8b5cf6',
  categoryShopping: '#ec4899',
  categoryBills: '#10b981',
  categoryOther: '#6b7280',

  // Chart colors
  chartPurple: '#8b5cf6',
  chartBlue: '#3b82f6',
  chartGreen: '#10b981',
  chartPink: '#ec4899',
  chartGray: '#6b7280',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const categoryIcons: Record<string, { color: string; icon: string }> = {
  'Food': { color: colors.categoryFood, icon: 'utensils' },
  'Dining': { color: colors.categoryFood, icon: 'utensils' },
  'Transport': { color: colors.categoryTransport, icon: 'car' },
  'Shopping': { color: colors.categoryShopping, icon: 'shopping-bag' },
  'Bills': { color: colors.categoryBills, icon: 'file-text' },
  'Other': { color: colors.categoryOther, icon: 'more-horizontal' },
  'Salary': { color: colors.success, icon: 'briefcase' },
};
