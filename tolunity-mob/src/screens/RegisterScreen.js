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
import { registerUser } from '../api/authApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from '../styles/theme';

const USER_TYPES = [
  {
    key: 'OWNER',
    label: 'Owner',
    desc: 'I own a property in this community',
  },
  {
    key: 'TENANT',
    label: 'Tenant',
    desc: 'I rent a property in this community',
  },
];

const logoImage = require('../../assets/images/logo.png');

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!username.trim()) nextErrors.username = 'Username is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Invalid email format';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (!userType) nextErrors.userType = 'Please select your account type';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: username.trim(),
        userType2: userType,
      });
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please sign in.',
        [{
          text: 'Sign In',
          onPress: () => {
            setTimeout(() => {
              router.replace('/login');
            }, 150);
          },
        }],
      );
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ email: error.response.data.error || 'Email is already registered' });
      } else {
        const message = error.response?.data?.error || 'Registration failed. Please try again.';
        Alert.alert('Registration Failed', message);
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
            <Text style={styles.brandCopy}>Create a resident account for your community space.</Text>
          </View>

          <SurfaceCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={TYPOGRAPHY.eyebrow}>Register</Text>
              <Text style={styles.cardTitle}>Create account</Text>
              <Text style={styles.cardSubtitle}>
                Self-registration is available for owners and tenants only.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Account type</Text>
            <View style={styles.typeGrid}>
              {USER_TYPES.map((type) => {
                const selected = userType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeCard, selected && styles.typeCardSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setUserType(type.key);
                      if (errors.userType) {
                        setErrors((current) => ({ ...current, userType: null }));
                      }
                    }}
                  >
                    <Text style={[styles.typeTitle, selected && styles.typeTitleSelected]}>{type.label}</Text>
                    <Text style={styles.typeCopy}>{type.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.userType ? <Text style={styles.errorText}>{errors.userType}</Text> : null}

            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                if (errors.fullName) setErrors((current) => ({ ...current, fullName: null }));
              }}
              autoCapitalize="words"
              error={errors.fullName}
            />
            <InputField
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                if (errors.username) setErrors((current) => ({ ...current, username: null }));
              }}
              error={errors.username}
            />
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) setErrors((current) => ({ ...current, email: null }));
              }}
              keyboardType="email-address"
              error={errors.email}
            />
            <InputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((current) => ({ ...current, password: null }));
              }}
              secureTextEntry
              error={errors.password}
            />
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
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

            <Button title="Create Account" onPress={handleRegister} loading={loading} />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
                <Text style={styles.linkText}>Sign in here</Text>
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
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  typeCard: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    backgroundColor: COLORS.bgInput,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfacePrimary,
  },
  typeTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  typeTitleSelected: {
    color: COLORS.primary,
  },
  typeCopy: {
    marginTop: 4,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    marginBottom: SPACING.sm,
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
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
  linkText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
});
