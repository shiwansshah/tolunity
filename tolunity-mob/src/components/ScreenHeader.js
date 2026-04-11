import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SPACING } from '../styles/theme';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  left,
  right,
  dense = false,
}) {
  const leading = left ?? (onBack ? (
    <TouchableOpacity
      onPress={onBack}
      style={styles.iconButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  ) : <View style={styles.placeholder} />);

  return (
    <View style={[styles.header, dense && styles.headerDense]}>
      <View style={styles.side}>{leading}</View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.side}>{right || <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 72,
    ...SHADOWS.header,
  },
  headerDense: {
    minHeight: 64,
  },
  side: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.whiteMuted,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteOverlay,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
