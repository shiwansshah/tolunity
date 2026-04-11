import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../styles/theme';

export default function SurfaceCard({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  padded: {
    padding: SPACING.md,
  },
});
