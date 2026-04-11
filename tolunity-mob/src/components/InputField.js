import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

export default function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  iconName,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  rightElement,
  editable = true,
  multiline = false,
  numberOfLines,
  inputStyle,
}) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const secure = secureTextEntry && !passwordVisible;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error && styles.fieldError,
          multiline && styles.fieldMultiline,
        ]}
      >
        {iconName ? (
          <Ionicons
            name={iconName}
            size={18}
            color={focused ? COLORS.primary : COLORS.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((current) => !current)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : rightElement || null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  label: {
    marginBottom: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    borderRadius: RADIUS.md,
  },
  fieldFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgCard,
  },
  fieldError: {
    borderColor: COLORS.error,
  },
  fieldMultiline: {
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.xs,
    marginTop: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    lineHeight: 18,
  },
});
