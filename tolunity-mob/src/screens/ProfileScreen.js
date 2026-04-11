import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ListItem from '../components/ListItem';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { logoutUser, updateProfilePic } from '../api/authApi';
import { suppressAuthFailureAlerts } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Need permission to access gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      handleUpdateProfilePic(base64Data);
    }
  };

  const handleUpdateProfilePic = async (uri) => {
    try {
      await updateProfilePic(uri);
      await updateUser({ profilePic: uri });
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const confirmRemovePic = () => {
    Alert.alert('Remove Picture', 'Are you sure you want to remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => handleUpdateProfilePic(null) },
    ]);
  };

  const handleEditPic = () => {
    Alert.alert('Profile Picture', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change Picture', onPress: pickImage },
      user?.profilePic ? { text: 'Remove Picture', style: 'destructive', onPress: confirmRemovePic } : null,
    ].filter(Boolean));
  };

  const doLogout = () => {
    setTimeout(async () => {
      suppressAuthFailureAlerts();
      try {
        await logoutUser();
      } catch (error) {
        // Ignore backend logout failures and clear local state anyway.
      }
      await logout();
      router.replace('/login');
    }, 150);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const badgeLabel = user?.userType === 'OWNER'
    ? 'Owner'
    : user?.userType === 'TENANT'
      ? 'Tenant'
      : user?.userType === 'ADMIN'
        ? 'Admin'
        : user?.userType === 'SECURITY'
          ? 'Security'
          : null;

  const menuItems = [
    {
      label: 'Edit Profile',
      subtitle: 'Update your name and phone number',
      action: () => router.push('/edit-profile'),
    },
    {
      label: 'Change Password',
      subtitle: 'Manage your account security',
      action: () => router.push('/change-password'),
    },
    {
      label: 'About TolUnity',
      subtitle: 'Read more about the platform',
      action: () => router.push('/about-tolunity'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SurfaceCard style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleEditPic} activeOpacity={0.8}>
            {user?.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name || 'Community member'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <View style={styles.badgeRow}>
            {badgeLabel ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user?.userRole === 'ADMIN' ? 'Administrator' : 'Community User'}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <ListItem
              key={item.label}
              title={item.label}
              subtitle={item.subtitle}
              onPress={item.action}
              showDivider={index < menuItems.length - 1}
              trailing={<Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />}
            />
          ))}
        </SurfaceCard>

        <ButtonRow onPress={handleLogout} />

        <Text style={styles.version}>TolUnity v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ButtonRow({ onPress }) {
  return (
    <TouchableOpacity style={styles.logoutButton} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.logoutText}>Sign Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  avatarWrap: {
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  userEmail: {
    marginTop: 4,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  menuCard: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  logoutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.bgCard,
  },
  logoutText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: FONTS.weights.bold,
  },
  version: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
});
