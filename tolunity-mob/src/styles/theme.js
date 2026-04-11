import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#1C4587',
  primaryDark: '#133260',
  primaryLight: '#2D5FB4',
  primaryGradientStart: '#1C4587',
  primaryGradientEnd: '#2B5AA6',
  secondary: '#6B7A99',
  accent: '#C6842E',

  bgLight: '#F4F7FB',
  bgCard: '#FFFFFF',
  bgInput: '#F9FBFD',
  bgInputBorder: '#D4DDE8',
  feedBg: '#F4F7FB',
  headerBg: '#1C4587',
  tabBarBg: '#FFFFFF',

  textPrimary: '#1F2D3D',
  textSecondary: '#526277',
  textMuted: '#7A889D',
  textLight: '#FFFFFF',

  cardBorder: '#D9E2EC',
  success: '#23845D',
  warning: '#B87A20',
  error: '#C4524B',
  info: '#2C6DB3',
  likePink: '#C94D78',
  commentBlue: '#2C6DB3',
  shareGray: '#7A889D',
  tabBarActive: '#1C4587',
  tabBarInactive: '#7A889D',
  fabRed: '#D14C44',

  surfacePrimary: '#EEF2FF',
  surfaceDanger: '#FDECEC',
  surfaceSuccess: '#E8FFF0',
  surfaceWarning: '#FFF7E6',
  surfaceMuted: '#F8FAFC',
  surfaceSoft: '#ECF1F7',
  surfaceBlue: '#F5F8FF',
  borderStrong: '#CBD7E4',
  overlay: 'rgba(0,0,0,0.45)',
  overlaySoft: 'rgba(31,45,61,0.12)',
  whiteMuted: 'rgba(255,255,255,0.78)',
  whiteBorder: 'rgba(255,255,255,0.16)',
  whiteOverlay: 'rgba(255,255,255,0.1)',
  black: '#000000',
};

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    display: 48,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
};

export const TYPOGRAPHY = StyleSheet.create({
  eyebrow: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textLight,
  },
  pageTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textPrimary,
    lineHeight: 38,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  body: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
});

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const SHADOWS = {
  none: {},
  card: {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
};

export const LAYOUT = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  surface: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
});

export const COMMON = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
