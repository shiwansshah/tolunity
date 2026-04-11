import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

export default function Container({
  children,
  scroll = false,
  style,
  contentStyle,
  showsVerticalScrollIndicator = false,
  ...props
}) {
  if (scroll) {
    return (
      <ScrollView
        style={[styles.base, style]}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.base, styles.content, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
