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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { editPost } from '../api/feedApi';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = params.postId;
  const initialContent = params.content || '';
  
  let initialMedias = [];
  try {
    initialMedias = params.medias ? JSON.parse(params.medias) : [];
  } catch (e) {
    console.error("Failed parsing medias", e);
  }

  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [mediaAssets, setMediaAssets] = useState(initialMedias);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Need permission to access gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.All,
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMediaAssets((prev) => [...prev, ...result.assets]);
    }
  };

  const removeMedia = (index) => {
    setMediaAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('Empty Post', 'Post content or media cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const mediaList = mediaAssets.map((asset) => {
        // If it was already a URL from the backend, keep it
        if (asset.mediaUrl) return asset;

        // If it's a new asset from picker
        const isVideo = asset.type === 'video';
        const mediaType = isVideo ? 'video' : 'image';
        
        let fileExtArr = asset.uri.split('.');
        const ext = fileExtArr[fileExtArr.length - 1];
        
        const base64Uri = asset.base64 ? `data:${isVideo ? 'video' : 'image'}/${ext};base64,${asset.base64}` : asset.uri;

        return {
          mediaUrl: base64Uri,
          mediaType: mediaType,
        };
      });

      await editPost(postId, { content: content.trim(), mediaList });
      Alert.alert('Updated! ✅', 'Your post has been updated.', [
        { 
          text: 'OK', 
          onPress: () => {
            setTimeout(() => {
              router.back();
            }, 150);
          }
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Update Failed',
        err.response?.data?.error || 'Unable to update post.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.label}>Edit your post</Text>
              <InputField
                placeholder="What's on your mind?"
                value={content}
                onChangeText={setContent}
                iconName="create-outline"
                autoCapitalize="sentences"
              />
            </View>

            {/* Media Preview Section */}
            {mediaAssets.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mediaAssets.map((asset, index) => (
                    <View key={index} style={styles.mediaWrapper}>
                      <Image source={{ uri: asset.uri || asset.mediaUrl }} style={styles.mediaThumbnail} />
                      {(asset.type === 'video' || asset.mediaType === 'VIDEO') && (
                        <View style={styles.playIconOverlay}>
                          <Ionicons name="play" size={24} color="#FFF" />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.removeMediaBtn}
                        onPress={() => removeMedia(index)}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Media Attachment Action */}
            <TouchableOpacity style={styles.attachBtn} onPress={pickMedia} activeOpacity={0.8}>
              <View style={styles.attachIconWrap}>
                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.attachText}>Add Photo/Video</Text>
            </TouchableOpacity>

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              iconName="checkmark-outline"
              iconPosition="left"
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#FFF' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  label: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  saveBtn: { marginBottom: SPACING.md },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.cardBorder,
  },
  attachIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  attachText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mediaPreviewContainer: {
    marginBottom: SPACING.md,
  },
  mediaWrapper: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: '#000',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 38,
    left: 38,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});