// Professional Education-Focused Theme
export const colors = {
  // Primary palette - Deep Blue (Trust, Intelligence, Professionalism)
  primary: '#1E3A8A', // Deep Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  
  // Secondary palette - Teal (Growth, Learning, Progress)
  secondary: '#0D9488',
  secondaryLight: '#14B8A6',
  secondaryDark: '#0F766E',
  
  // Accent - Amber (Achievement, Success)
  accent: '#D97706',
  accentLight: '#F59E0B',
  accentDark: '#B45309',
  
  // Backgrounds
  background: '#F8FAFC', // Very light blue-gray
  backgroundSecondary: '#F1F5F9',
  backgroundTertiary: '#E2E8F0',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textDisabled: '#94A3B8',
  
  // Status colors
  success: '#059669',
  successLight: '#10B981',
  warning: '#D97706',
  warningLight: '#F59E0B',
  error: '#DC2626',
  errorLight: '#EF4444',
  info: '#0284C7',
  infoLight: '#0EA5E9',
  
  // Test types (Professional colors)
  eq: '#7C3AED', // Purple - Emotional Intelligence
  iq: '#2563EB', // Blue - Cognitive Intelligence
  physical: '#DC2626', // Red - Physical Health
  
  // UI Elements
  white: '#FFFFFF',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  divider: '#E2E8F0',
  shadow: 'rgba(15, 23, 42, 0.1)',
  overlay: 'rgba(15, 23, 42, 0.5)',
  
  // Chart colors
  chart1: '#3B82F6',
  chart2: '#8B5CF6',
  chart3: '#EC4899',
  chart4: '#F59E0B',
  chart5: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const typography = {
  // Display
  display: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  // Body
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  // Labels
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  // Special
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Card styles
export const card = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  ...shadows.sm,
};

export const cardElevated = {
  backgroundColor: colors.surfaceElevated,
  borderRadius: borderRadius.lg,
  ...shadows.md,
};

// Icon sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
};

// Button styles
export const button = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

// Input styles
export const input = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: borderRadius.md,
  ...shadows.xs,
};

// Badge styles
export const badge = {
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
};
