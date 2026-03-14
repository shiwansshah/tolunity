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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { registerUser } from '../api/authApi';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState(''); // used as email display label
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: username.trim(), // username stored in phoneNumber for now
      });
      Alert.alert(
        'Account Created! 🎉',
        'Your account has been created successfully. Please sign in.',
        [{ 
          text: 'Sign In', 
          onPress: () => {
             setTimeout(() => {
               router.replace('/login');
             }, 150);
          } 
        }]
      );
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ email: err.response.data.error || 'Email is already registered!' });
      } else {
        const message =
          err.response?.data?.error || 'Registration failed. Please try again.';
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgLight} translucent={false} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>TolUnity</Text>
            <Text style={styles.tagline}>Community Management Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Join your community platform</Text>

            {/* Full Name */}
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: null }));
              }}
              iconName="person-outline"
              autoCapitalize="words"
              error={errors.fullName}
            />

            {/* Username */}
            <InputField
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (errors.username) setErrors((e) => ({ ...e, username: null }));
              }}
              iconName="at-outline"
              error={errors.username}
            />

            {/* Email */}
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: null }));
              }}
              iconName="mail-outline"
              keyboardType="email-address"
              error={errors.email}
            />

            {/* Password */}
            <InputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: null }));
              }}
              iconName="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />

            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: null }));
              }}
              iconName="lock-closed-outline"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Create Account Button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              iconName="person-add-outline"
              iconPosition="left"
              style={styles.createBtn}
            />

            {/* Or divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* Sign In Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}>Sign in here</Text>
              </TouchableOpacity>
            </View>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  createBtn: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  orText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
