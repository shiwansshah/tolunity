import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { logoutUser, updateProfilePic } from '../api/authApi';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [updatingPic, setUpdatingPic] = React.useState(false);

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
    setUpdatingPic(true);
    try {
      await updateProfilePic(uri);
      await updateUser({ profilePic: uri });
      Alert.alert('Success', 'Profile picture updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUpdatingPic(false);
    }
  };

  const confirmRemovePic = () => {
    Alert.alert('Remove Picture', 'Are you sure you want to remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => handleUpdateProfilePic(null) }
    ]);
  };

  const handleEditPic = () => {
    Alert.alert('Profile Picture', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change Picture', onPress: pickImage },
      user?.profilePic ? { text: 'Remove Picture', style: 'destructive', onPress: confirmRemovePic } : null
    ].filter(Boolean));
  };

  const doLogout = () => {
    // Timeout added to let Mobile Alert animations finish before blocking UI thread & routing
    setTimeout(async () => {
      try {
        await logoutUser();
      } catch (e) {
        // Silent catch: if backend logout fails (session already dead/expired), 
        // we still proceed to clear local state and redirect to login.
      }
      await logout();
      router.replace('/login');
    }, 150);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { 
      icon: 'person-outline', 
      label: 'Edit Profile', 
      action: () => router.push('/edit-profile') 
    },
    { 
      icon: 'lock-open-outline', 
      label: 'Change Password', 
      action: () => router.push('/change-password') 
    },
    { icon: 'notifications-outline', label: 'Notifications', action: null },
    { icon: 'lock-closed-outline', label: 'Privacy & Security', action: null },
    { icon: 'help-circle-outline', label: 'Help & Support', action: null },
    { icon: 'information-circle-outline', label: 'About TolUnity', action: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user?.profilePic ? (
                  <Image source={{ uri: user.profilePic }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(user?.name)}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8} onPress={handleEditPic}>
                <Ionicons name="pencil" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user?.name || 'Community Member'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name={user?.userRole === 'ROLE_ADMIN' ? 'shield-checkmark' : 'people'}
                size={12}
                color={COLORS.primary}
              />
              <Text style={styles.roleText}>
                {user?.userRole === 'ROLE_ADMIN' ? 'Administrator' : 'Community Member'}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* App version */}
          <Text style={styles.version}>TolUnity v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.lg,
    ...SHADOWS.header,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: '#FFF',
  },
  profileCard: {
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: '#FFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  roleText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  logoutText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
});
