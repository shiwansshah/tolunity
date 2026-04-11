import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../styles/theme';

const VARIANTS = {
  primary: {
    container: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    text: { color: COLORS.textLight },
    icon: COLORS.textLight,
  },
  secondary: {
    container: {
      backgroundColor: COLORS.surfaceSoft,
      borderColor: COLORS.cardBorder,
    },
    text: { color: COLORS.textPrimary },
    icon: COLORS.textPrimary,
  },
  outline: {
    container: {
      backgroundColor: COLORS.bgCard,
      borderColor: COLORS.bgInputBorder,
    },
    text: { color: COLORS.textPrimary },
    icon: COLORS.textPrimary,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    text: { color: COLORS.primary },
    icon: COLORS.primary,
  },
  danger: {
    container: {
      backgroundColor: COLORS.error,
      borderColor: COLORS.error,
    },
    text: { color: COLORS.textLight },
    icon: COLORS.textLight,
  },
};

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  iconName,
  iconPosition = 'left',
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;
  const currentVariant = VARIANTS[variant] || VARIANTS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        currentVariant.container,
        variant === 'primary' && SHADOWS.button,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={currentVariant.icon} size="small" />
      ) : (
        <View style={styles.content}>
          {iconName && iconPosition === 'left' ? (
            <Ionicons name={iconName} size={18} color={currentVariant.icon} style={styles.iconLeft} />
          ) : null}
          <Text style={[styles.text, currentVariant.text, textStyle]}>{title}</Text>
          {iconName && iconPosition === 'right' ? (
            <Ionicons name={iconName} size={18} color={currentVariant.icon} style={styles.iconRight} />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
  disabled: {
    opacity: 0.55,
  },
});
