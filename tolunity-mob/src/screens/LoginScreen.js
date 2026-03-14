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
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/authApi';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Username / Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginUser({ email: email.trim(), password });
      await login(res.data);
      router.replace('/(tabs)');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ 
          email: err.response.data.error || 'Invalid credentials', 
          password: ' ' 
        });
      } else {
        const message =
          err.response?.data?.error || 'Unable to connect. Please try again.';
        Alert.alert('Login Failed', message);
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>TolUnity</Text>
            <Text style={styles.tagline}>Community Management Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to continue to your community
            </Text>

            {/* Username / Email */}
            <InputField
              label="Username"
              placeholder="Enter your username"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: null }));
              }}
              iconName="person-outline"
              keyboardType="email-address"
              error={errors.email}
            />

            {/* Password */}
            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: null }));
              }}
              iconName="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />

            {/* Remember Me + Forgot Password */}
            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxActive,
                  ]}
                >
                  {rememberMe && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              iconName="arrow-forward"
              iconPosition="left"
              style={styles.signInBtn}
            />

            {/* Or divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Register here</Text>
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
    marginBottom: SPACING.xxxl,
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
    letterSpacing: 0.3,
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: COLORS.bgInputBorder,
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  forgotText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  signInBtn: {
    width: '100%',
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
});