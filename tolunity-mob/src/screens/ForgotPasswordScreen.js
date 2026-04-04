import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { requestPasswordReset, resetPasswordWithCode } from '../api/authApi';
import { getApiErrorMessage } from '../api/apiError';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const validateReset = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }
    if (!code.trim()) {
      nextErrors.code = 'Verification code is required';
    }
    if (!newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) {
      return;
    }

    setSending(true);
    try {
      await requestPasswordReset({ email: email.trim().toLowerCase() });
      setCodeSent(true);
      Alert.alert('Verification Code Sent', 'Check your email for the verification code.');
    } catch (error) {
      Alert.alert('Request Failed', getApiErrorMessage(error, 'Unable to send verification code.'));
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateReset()) {
      return;
    }

    setResetting(true);
    try {
      await resetPasswordWithCode({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      Alert.alert('Password Updated', 'Your password has been changed successfully.', [
        { text: 'Back to Login', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      Alert.alert('Reset Failed', getApiErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgLight} translucent={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a verification code, then set a new password.</Text>

            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((current) => ({ ...current, email: null }));
                }
              }}
              iconName="mail-outline"
              keyboardType="email-address"
              error={errors.email}
            />

            {!codeSent ? (
              <Button title="Send Verification Code" onPress={handleSendCode} loading={sending} />
            ) : (
              <>
                <InputField
                  label="Verification Code"
                  placeholder="Enter the 6-digit code"
                  value={code}
                  onChangeText={(value) => {
                    setCode(value.replace(/\D/g, '').slice(0, 6));
                    if (errors.code) {
                      setErrors((current) => ({ ...current, code: null }));
                    }
                  }}
                  iconName="key-outline"
                  keyboardType="number-pad"
                  error={errors.code}
                />

                <InputField
                  label="New Password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    if (errors.newPassword) {
                      setErrors((current) => ({ ...current, newPassword: null }));
                    }
                  }}
                  iconName="lock-closed-outline"
                  secureTextEntry
                  error={errors.newPassword}
                />

                <InputField
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (errors.confirmPassword) {
                      setErrors((current) => ({ ...current, confirmPassword: null }));
                    }
                  }}
                  iconName="lock-closed-outline"
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                <Button title="Reset Password" onPress={handleResetPassword} loading={resetting} style={styles.primaryBtn} />
                <Button title="Resend Code" onPress={handleSendCode} variant="outline" loading={sending} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    ...SHADOWS.card,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  backText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  primaryBtn: {
    marginBottom: SPACING.md,
  },
});
