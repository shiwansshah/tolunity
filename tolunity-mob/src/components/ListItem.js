import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../styles/theme';

export default function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  style,
  showDivider = false,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.item, showDivider && styles.itemDivider, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  leading: {
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  trailing: {
    marginLeft: SPACING.sm,
  },
});
