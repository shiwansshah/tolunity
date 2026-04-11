import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '../api/apiError';
import { requestPasswordReset, resetPasswordWithCode } from '../api/authApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../styles/theme';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgLight} translucent={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={styles.card}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backRow} activeOpacity={0.7}>
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>

            <View style={styles.intro}>
              <Text style={TYPOGRAPHY.pageTitle}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email to receive a verification code, then choose a new password.
              </Text>
            </View>

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
                  secureTextEntry
                  error={errors.confirmPassword}
                />
                <Button title="Reset Password" onPress={handleResetPassword} loading={resetting} style={styles.primaryAction} />
                <Button title="Resend Code" onPress={handleSendCode} variant="outline" loading={sending} />
              </>
            )}
          </SurfaceCard>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  card: {
    padding: SPACING.md,
  },
  backRow: {
    marginBottom: SPACING.sm,
  },
  backText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  intro: {
    marginBottom: SPACING.md,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  primaryAction: {
    marginBottom: SPACING.xs,
  },
});
