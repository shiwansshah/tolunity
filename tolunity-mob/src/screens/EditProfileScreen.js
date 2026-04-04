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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/authApi';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

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
        { text: 'OK', onPress: () => router.back() }
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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
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
              iconName="person-outline"
              error={errors.name}
            />

            <InputField
              label="Phone Number"
              placeholder="98XXXXXXXX"
              value={phone}
              onChangeText={handlePhoneChange}
              iconName="call-outline"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>Use a 10-digit number that starts with 98 or 97. Email cannot be changed as it is linked to your identity.</Text>
            </View>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            iconName="checkmark-outline"
            style={styles.saveBtn}
          />

          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  flex: { flex: 1 },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#FFF' },
  content: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.xl, ...SHADOWS.card,
  },
  saveBtn: { marginBottom: SPACING.md },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
