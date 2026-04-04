import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../context/AlertContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { createAlert } from '../api/alertApi';
import { getApiErrorMessage } from '../api/apiError';

const ALERT_COLOR = '#DC2626';

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
      return Alert.alert('Permission Required', 'Media permission is required to attach photos or videos.');
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
      return Alert.alert('Validation', 'Title and description are required.');
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
    <TouchableOpacity
      style={[styles.card, item.isRead ? styles.cardRead : styles.cardUnread]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.85}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: `${ALERT_COLOR}20` }]}>
        <Ionicons name="alert-circle" size={22} color={ALERT_COLOR} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.typeTag, item.isRead && styles.typeTagRead]}>Emergency Alert</Text>
          <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={[styles.title, item.isRead && styles.titleRead]}>{item.title}</Text>
        <Text style={[styles.message, item.isRead && styles.messageRead]}>{item.description}</Text>
        <Text style={styles.creator}>Raised by {item.createdByName}</Text>
        {item.mediaList?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
            {item.mediaList.map((media) => (
              <View key={media.id} style={styles.mediaCard}>
                {media.mediaType === 'VIDEO' ? (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={20} color="#FFF" />
                    <Text style={styles.videoText}>Video</Text>
                  </View>
                ) : (
                  <Image source={{ uri: media.mediaUrl }} style={styles.mediaImage} />
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSubtitle}>Emergency broadcasts with optional photo or video evidence</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.raiseBtn}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.raiseBtnText}>Raise</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && alerts.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => refreshAlerts()}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No emergency alerts</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.topRow}>
              <Text style={styles.modalTitle}>Raise Emergency Alert</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Alert title"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the emergency clearly"
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {mediaAssets.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
                  {mediaAssets.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.mediaCard}>
                      {asset.type === 'video' ? (
                        <View style={styles.videoPlaceholder}>
                          <Ionicons name="videocam" size={20} color="#FFF" />
                          <Text style={styles.videoText}>Video</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: asset.uri }} style={styles.mediaImage} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.attachBtn} onPress={pickMedia}>
                <Ionicons name="images-outline" size={18} color={ALERT_COLOR} />
                <Text style={styles.attachBtnText}>Attach Photos / Videos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={submitAlert} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Send Alert Now</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2, maxWidth: 220 },
  unreadLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  markAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  markAllText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },
  raiseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: ALERT_COLOR,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  raiseBtnText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
    position: 'relative',
  },
  cardRead: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: ALERT_COLOR },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ALERT_COLOR,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  typeTag: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: ALERT_COLOR },
  typeTagRead: { color: COLORS.textMuted },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  titleRead: { color: COLORS.textSecondary },
  message: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  messageRead: { color: COLORS.textMuted },
  creator: { marginTop: 6, fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  mediaStrip: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  mediaCard: {
    width: 92,
    height: 92,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginRight: SPACING.sm,
    backgroundColor: '#000',
  },
  mediaImage: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ALERT_COLOR },
  videoText: { color: '#FFF', fontSize: FONTS.sizes.xs, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: ALERT_COLOR,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  attachBtnText: { color: ALERT_COLOR, fontWeight: '700' },
  submitBtn: {
    backgroundColor: ALERT_COLOR,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: FONTS.sizes.md },
});
