import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { createComplaint, getComplaints, toggleComplaintUpvote } from '../api/complaintApi';
import { getApiErrorMessage } from '../api/apiError';

const CATEGORIES = ['Sanitation', 'Safety', 'Infrastructure', 'Noise', 'Water', 'Other'];
const STATUS_COLORS = {
  OPEN: { bg: '#FFF7E6', text: COLORS.warning },
  UNDER_REVIEW: { bg: '#EEF2FF', text: COLORS.primary },
  IN_PROGRESS: { bg: '#EEF2FF', text: COLORS.primary },
  RESOLVED: { bg: '#E8FFF0', text: COLORS.success },
  CLOSED: { bg: '#F5F7FB', text: COLORS.textMuted },
};

const formatStatus = (status) =>
  (status || 'OPEN')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

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

  const submitComplaint = async () => {
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
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.category} • by {item.createdByName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        {item.mediaList?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {item.mediaList.map((media) => (
              <View key={media.id} style={styles.mediaCard}>
                {media.mediaType === 'IMAGE' ? (
                  <Image source={{ uri: media.mediaUrl }} style={styles.mediaImage} />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={22} color="#FFF" />
                    <Text style={styles.videoText}>Video</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.rowBetween}>
          <TouchableOpacity style={[styles.voteBtn, item.upvotedByCurrentUser && styles.voteBtnActive]} onPress={() => upvote(item.id)}>
            <Ionicons name={item.upvotedByCurrentUser ? 'arrow-up-circle' : 'arrow-up-circle-outline'} size={18} color={item.upvotedByCurrentUser ? '#FFF' : COLORS.primary} />
            <Text style={[styles.voteText, item.upvotedByCurrentUser && styles.voteTextActive]}>{item.upvoteCount}</Text>
          </TouchableOpacity>
          <Text style={styles.cardMeta}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}</Text>
        </View>

        <View style={styles.followUpBox}>
          <Text style={styles.followUpTitle}>Follow up contact</Text>
          <Text style={styles.followUpText}>
            {item.followUpContact?.name} • {item.followUpContact?.phoneNumber}
          </Text>
          <Text style={styles.followUpText}>{item.followUpContact?.email}</Text>
          <Text style={styles.followUpText}>{item.resolutionNote || 'Awaiting admin review'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complaints</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderComplaint}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flag-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No complaints posted yet</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>File Complaint</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Complaint title"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.chips}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                    <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue"
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {mediaAssets.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                  {mediaAssets.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.mediaCard}>
                      {asset.type === 'video' ? (
                        <View style={styles.videoPlaceholder}>
                          <Ionicons name="videocam" size={22} color="#FFF" />
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
                <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                <Text style={styles.attachBtnText}>Attach Photos / Videos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={submitComplaint} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
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
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, ...SHADOWS.header },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: '800' },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  cardMeta: { marginTop: 4, color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  description: { marginTop: SPACING.md, marginBottom: SPACING.md, color: COLORS.textSecondary, lineHeight: 20 },
  statusBadge: { borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 5, marginLeft: SPACING.sm },
  statusText: { fontSize: 10, fontWeight: '800' },
  mediaCard: { width: 90, height: 90, borderRadius: RADIUS.md, overflow: 'hidden', marginRight: SPACING.sm, backgroundColor: '#000' },
  mediaImage: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  videoText: { color: '#FFF', fontSize: FONTS.sizes.xs, marginTop: 4 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 6, gap: SPACING.xs },
  voteBtnActive: { backgroundColor: COLORS.primary },
  voteText: { color: COLORS.primary, fontWeight: '800' },
  voteTextActive: { color: '#FFF' },
  followUpBox: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  followUpTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  followUpText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  fab: { position: 'absolute', right: SPACING.xl, bottom: SPACING.xl, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.fabRed, alignItems: 'center', justifyContent: 'center', ...SHADOWS.button },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xxl, maxHeight: '88%' },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.md },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: FONTS.sizes.xs },
  chipTextActive: { color: '#FFF' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, marginBottom: SPACING.md },
  attachBtnText: { color: COLORS.primary, fontWeight: '700' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: FONTS.sizes.md },
});
