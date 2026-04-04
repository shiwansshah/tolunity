import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

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

  const variantStyles = {
    primary: {
      container: styles.primaryContainer,
      text: styles.primaryText,
      icon: '#FFFFFF',
    },
    secondary: {
      container: styles.secondaryContainer,
      text: styles.secondaryText,
      icon: COLORS.primary,
    },
    outline: {
      container: styles.outlineContainer,
      text: styles.outlineText,
      icon: COLORS.primary,
    },
    ghost: {
      container: styles.ghostContainer,
      text: styles.ghostText,
      icon: COLORS.primary,
    },
  };

  const v = variantStyles[variant] || variantStyles.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        v.container,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.icon} size="small" />
      ) : (
        <View style={styles.content}>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={20}
              color={v.icon}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.text, v.text, textStyle]}>{title}</Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={20}
              color={v.icon}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
  disabled: {
    opacity: 0.55,
  },

  // Primary
  primaryContainer: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.button,
  },
  primaryText: {
    color: '#FFFFFF',
  },

  // Secondary
  secondaryContainer: {
    backgroundColor: '#EEF3F8',
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  secondaryText: {
    color: COLORS.primary,
  },

  // Outline
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD7E4',
  },
  outlineText: {
    color: COLORS.textPrimary,
  },

  // Ghost
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.primary,
  },
});
