import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword } from '../api/authApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, SPACING } from '../styles/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader title="Change Password" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={styles.card}>
            <InputField
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <InputField
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </SurfaceCard>

          <Button title="Update Password" onPress={handleChangePassword} loading={loading} style={styles.primaryAction} />
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
  primaryAction: {
    marginBottom: SPACING.xs,
  },
});
