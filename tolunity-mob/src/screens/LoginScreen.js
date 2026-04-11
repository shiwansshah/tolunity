import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import { loginUser } from '../api/authApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import SurfaceCard from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from '../styles/theme';

const logoImage = require('../../assets/images/logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Username / Email is required';
    }
    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email: email.trim(), password });
      await login(response.data, { rememberMe });
      router.replace('/(tabs)');
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors({
          email: getApiErrorMessage(error, 'Invalid credentials'),
          password: ' ',
        });
      } else {
        Alert.alert('Login Failed', getApiErrorMessage(error, 'Unable to connect. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgLight} translucent={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>TolUnity</Text>
            <Text style={styles.brandCopy}>
              Community management, billing, visitors, and alerts in one place.
            </Text>
          </View>

          <SurfaceCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={TYPOGRAPHY.eyebrow}>Sign In</Text>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>
                Use your account details to continue into the community workspace.
              </Text>
            </View>

            <InputField
              label="Username"
              placeholder="Enter your username"
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
            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: null }));
                }
              }}
              secureTextEntry
              error={errors.password}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((current) => !current)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]} />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button title="Sign In" onPress={handleLogin} loading={loading} />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Owner or tenant without an account?</Text>
              <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
                <Text style={styles.linkText}>Register here</Text>
              </TouchableOpacity>
            </View>
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
  brandBlock: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 56,
    height: 56,
  },
  brandName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.primary,
  },
  brandCopy: {
    marginTop: SPACING.xs,
    maxWidth: 320,
    fontSize: FONTS.sizes.sm,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    padding: SPACING.md,
  },
  cardHeader: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.bgCard,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
