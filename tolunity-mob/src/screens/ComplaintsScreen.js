import React, { useCallback, useEffect, useState } from 'react';
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
import { createComplaint, getComplaints, toggleComplaintUpvote } from '../api/complaintApi';
import { getApiErrorMessage } from '../api/apiError';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

const CATEGORIES = ['Sanitation', 'Safety', 'Infrastructure', 'Noise', 'Water', 'Other'];
const STATUS_COLORS = {
  OPEN: { bg: COLORS.surfaceWarning, text: COLORS.warning },
  UNDER_REVIEW: { bg: COLORS.surfacePrimary, text: COLORS.primary },
  IN_PROGRESS: { bg: COLORS.surfacePrimary, text: COLORS.primary },
  RESOLVED: { bg: COLORS.surfaceSuccess, text: COLORS.success },
  CLOSED: { bg: COLORS.surfaceMuted, text: COLORS.textMuted },
};

const formatStatus = (status) => (
  (status || 'OPEN')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);

export default function ComplaintsScreen() {
  const { refreshNotifications } = useNotifications();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [mediaAssets, setMediaAssets] = useState([]);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getComplaints();
      setComplaints(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load complaints.'));
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

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

  const submitComplaint = async () => {
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

      await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        mediaList,
      });

      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setMediaAssets([]);
      setModalVisible(false);
      await refreshNotifications({ silent: true });
      loadComplaints();
      Alert.alert('Complaint Submitted', 'Your complaint is now visible to the community and admin.');
    } catch (error) {
      Alert.alert('Submit Failed', getApiErrorMessage(error, 'Unable to submit complaint.'));
    } finally {
      setSaving(false);
    }
  };

  const upvote = async (complaintId) => {
    try {
      await toggleComplaintUpvote(complaintId);
      await refreshNotifications({ silent: true });
      loadComplaints();
    } catch (error) {
      Alert.alert('Upvote Failed', getApiErrorMessage(error, 'Unable to update upvote.'));
    }
  };

  const renderComplaint = ({ item }) => {
    const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS.OPEN;
    return (
      <SurfaceCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{`${item.category} | by ${item.createdByName}`}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        {item.mediaList?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
            {item.mediaList.map((media) => (
              <View key={media.id} style={styles.mediaItem}>
                {media.mediaType === 'IMAGE' ? (
                  <Image source={{ uri: media.mediaUrl }} style={styles.mediaImage} />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>Video</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.voteButton, item.upvotedByCurrentUser && styles.voteButtonActive]}
            onPress={() => upvote(item.id)}
          >
            <Text style={[styles.voteText, item.upvotedByCurrentUser && styles.voteTextActive]}>
              {item.upvoteCount} support
            </Text>
          </TouchableOpacity>
          <Text style={styles.cardMeta}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}</Text>
        </View>

        <View style={styles.followUp}>
          <Text style={styles.followUpTitle}>Follow up contact</Text>
          <Text style={styles.followUpText}>{item.followUpContact?.name || 'Awaiting assignment'}</Text>
          <Text style={styles.followUpText}>{item.followUpContact?.phoneNumber || ''}</Text>
          <Text style={styles.followUpText}>{item.followUpContact?.email || ''}</Text>
          <Text style={styles.followUpText}>{item.resolutionNote || 'Awaiting admin review'}</Text>
        </View>
      </SurfaceCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader
        title="Complaints"
        right={(
          <TouchableOpacity style={styles.headerAction} onPress={() => setModalVisible(true)}>
            <Text style={styles.headerActionText}>New</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderComplaint}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={(
            <EmptyState
              title="No complaints posted yet"
              description="Resident complaints and follow-up details will appear here."
              icon={<Ionicons name="flag-outline" size={32} color={COLORS.textMuted} />}
            />
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>File Complaint</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField
                label="Title"
                placeholder="Complaint title"
                value={title}
                onChangeText={setTitle}
              />
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, category === item && styles.chipActive]}
                    onPress={() => setCategory(item)}
                  >
                    <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <InputField
                label="Description"
                placeholder="Describe the issue"
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

              <Button title="Submit Complaint" onPress={submitComplaint} loading={saving} />
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
  card: {
    marginBottom: SPACING.xs,
    padding: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
  description: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  mediaStrip: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
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
    backgroundColor: COLORS.primary,
  },
  videoText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  voteButton: {
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
  },
  voteButtonActive: {
    backgroundColor: COLORS.primary,
  },
  voteText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  voteTextActive: {
    color: COLORS.textLight,
  },
  followUp: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  followUpTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
    marginBottom: 4,
  },
  followUpText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
  sectionLabel: {
    marginBottom: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.semibold,
  },
  chipTextActive: {
    color: COLORS.textLight,
  },
  attachButton: {
    minHeight: 48,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
});
