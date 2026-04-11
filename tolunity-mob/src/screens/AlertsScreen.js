import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAlert } from '../api/alertApi';
import { getApiErrorMessage } from '../api/apiError';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { useAlerts } from '../context/AlertContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

const ALERT_COLOR = COLORS.error;

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export default function AlertsScreen() {
  const {
    alerts,
    unreadCount,
    loading,
    refreshAlerts,
    markAsRead,
    markAllAsRead,
  } = useAlerts();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [mediaAssets, setMediaAssets] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Media permission is required to attach photos or videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setMediaAssets((current) => [...current, ...result.assets]);
    }
  };

  const submitAlert = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Title and description are required.');
      return;
    }

    setSaving(true);
    try {
      const mediaList = mediaAssets.map((asset) => {
        const extension = asset.uri.split('.').pop();
        const isVideo = asset.type === 'video';
        return {
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          mediaUrl: asset.base64
            ? `data:${isVideo ? 'video' : 'image'}/${extension};base64,${asset.base64}`
            : asset.uri,
        };
      });

      await createAlert({
        title: title.trim(),
        description: description.trim(),
        mediaList,
      });

      setTitle('');
      setDescription('');
      setMediaAssets([]);
      setModalVisible(false);
      await refreshAlerts({ silent: true });
      Alert.alert('Alert Sent', 'Your emergency alert has been broadcast to the community.');
    } catch (error) {
      Alert.alert('Send Failed', getApiErrorMessage(error, 'Unable to send the emergency alert.'));
    } finally {
      setSaving(false);
    }
  };

  const renderAlert = ({ item }) => (
    <SurfaceCard style={[styles.card, !item.isRead && styles.cardUnread]}>
      <TouchableOpacity onPress={() => markAsRead(item.id)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.typeTag}>Emergency alert</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.message}>{item.description}</Text>
        <Text style={styles.creator}>Raised by {item.createdByName}</Text>

        {item.mediaList?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
            {item.mediaList.map((media) => (
              <View key={media.id} style={styles.mediaItem}>
                {media.mediaType === 'VIDEO' ? (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>Video</Text>
                  </View>
                ) : (
                  <Image source={{ uri: media.mediaUrl }} style={styles.mediaImage} />
                )}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </TouchableOpacity>
    </SurfaceCard>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader
        title="Alerts"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'Emergency broadcasts'}
        right={(
          <TouchableOpacity style={styles.headerAction} onPress={() => setModalVisible(true)}>
            <Text style={styles.headerActionText}>New</Text>
          </TouchableOpacity>
        )}
      />

      {loading && alerts.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAlert}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => refreshAlerts()}
          ListHeaderComponent={unreadCount > 0 ? (
            <TouchableOpacity style={styles.markAll} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          ) : null}
          ListEmptyComponent={(
            <EmptyState
              title="No emergency alerts"
              description="Emergency broadcasts with optional photo or video evidence will appear here."
              icon={<Ionicons name="alert-circle-outline" size={32} color={COLORS.textMuted} />}
            />
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Raise Alert</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField
                label="Title"
                placeholder="Alert title"
                value={title}
                onChangeText={setTitle}
              />
              <InputField
                label="Description"
                placeholder="Describe the emergency clearly"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {mediaAssets.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
                  {mediaAssets.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.mediaItem}>
                      {asset.type === 'video' ? (
                        <View style={styles.videoPlaceholder}>
                          <Text style={styles.videoText}>Video</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: asset.uri }} style={styles.mediaImage} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              <TouchableOpacity style={styles.attachButton} onPress={pickMedia}>
                <Text style={styles.attachButtonText}>Attach photo or video</Text>
              </TouchableOpacity>

              <Button title="Send Alert" onPress={submitAlert} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  headerAction: {
    minWidth: 64,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  markAll: {
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  card: {
    marginBottom: SPACING.xs,
  },
  cardUnread: {
    borderColor: ALERT_COLOR,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
    padding: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  cardTitleGroup: {
    flex: 1,
  },
  typeTag: {
    fontSize: FONTS.sizes.xs,
    color: ALERT_COLOR,
    fontWeight: FONTS.weights.bold,
  },
  cardTitle: {
    marginTop: 4,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  message: {
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  creator: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  mediaStrip: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  mediaItem: {
    width: 96,
    height: 96,
    marginRight: SPACING.xs,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.black,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ALERT_COLOR,
  },
  videoText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sheetTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButton: {
    minHeight: 48,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ALERT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: {
    fontSize: FONTS.sizes.sm,
    color: ALERT_COLOR,
    fontWeight: FONTS.weights.semibold,
  },
});
