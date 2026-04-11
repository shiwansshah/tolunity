import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../api/authApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePhone = (value) => /^(98|97)\d{8}$/.test(value);

  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errors.phone) {
      setErrors((current) => ({ ...current, phone: null }));
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.name = 'Name cannot be empty';
    }
    if (!trimmedPhone) {
      nextErrors.phone = 'Phone number is required';
    } else if (!validatePhone(trimmedPhone)) {
      nextErrors.phone = 'Phone number must be 10 digits and start with 98 or 97';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name: trimmedName, phoneNumber: trimmedPhone });
      await updateUser({ name: trimmedName, phoneNumber: trimmedPhone });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader title="Edit Profile" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={styles.card}>
            <InputField
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: null }));
                }
              }}
              autoCapitalize="words"
              error={errors.name}
            />
            <InputField
              label="Phone Number"
              placeholder="98XXXXXXXX"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Use a 10-digit number that starts with 98 or 97. Email cannot be changed here.
              </Text>
            </View>
          </SurfaceCard>

          <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.primaryAction} />
          <Button title="Cancel" onPress={() => router.back()} variant="outline" />
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  note: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  noteText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  primaryAction: {
    marginBottom: SPACING.xs,
  },
});
