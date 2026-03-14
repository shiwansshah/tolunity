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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createPost } from '../api/feedApi';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function CreatePostScreen() {
  const router = useRouter();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);

  const pickMedia = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.All,
      allowsMultipleSelection: true,
      base64: true, // We need base64 to send the media directly
      quality: 0.7,
    });

    if (!result.canceled) {
      setMediaAssets((prev) => [...prev, ...result.assets]);
    }
  };

  const removeMedia = (index) => {
    setMediaAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('Empty Post', 'Please write something or attach media before posting.');
      return;
    }

    setLoading(true);
    try {
      // Structure the mediaList for backend DTO
      const mediaList = mediaAssets.map((asset) => {
        // Prepare base64 data URI
        const isVideo = asset.type === 'video';
        const mediaType = isVideo ? 'video' : 'image';
        
        let fileExtArr = asset.uri.split('.');
        const ext = fileExtArr[fileExtArr.length - 1];
        
        // Example base64 string building (if the backend expects a URL but we only have strings)
        // A proper multipart/form-data upload is preferred for production, but this fits the JSON spec.
        const base64Uri = asset.base64 ? `data:${isVideo ? 'video' : 'image'}/${ext};base64,${asset.base64}` : asset.uri;

        return {
          mediaUrl: base64Uri,
          mediaType: mediaType,
        };
      });

      await createPost({ content: content.trim(), mediaList });
      Alert.alert('Posted! 🎉', 'Your post has been shared with the community.', [
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
        'Post Failed',
        err.response?.data?.error || 'Unable to create post. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
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
            {/* Post Content */}
            <View style={styles.card}>
              <Text style={styles.label}>What's on your mind?</Text>
              <InputField
                placeholder="Share something with your community…"
                value={content}
                onChangeText={setContent}
                iconName="create-outline"
                autoCapitalize="sentences"
              />

              {/* Character counter */}
              <Text style={[
                styles.charCount,
                content.length > 480 && styles.charCountWarning,
              ]}>
                {content.length} / 500
              </Text>
            </View>

            {/* Media Preview Section */}
            {mediaAssets.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mediaAssets.map((asset, index) => (
                    <View key={index} style={styles.mediaWrapper}>
                      <Image source={{ uri: asset.uri }} style={styles.mediaThumbnail} />
                      {asset.type === 'video' && (
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
              <Text style={styles.attachText}>Attach Photo/Video</Text>
            </TouchableOpacity>

            {/* Post Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>
                <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />{' '}
                Community Guidelines
              </Text>
              <Text style={styles.tipItem}>• Be respectful and constructive</Text>
              <Text style={styles.tipItem}>• Share relevant community updates</Text>
              <Text style={styles.tipItem}>• No spam or irrelevant content</Text>
            </View>

            {/* Buttons */}
            <Button
              title="Share with Community"
              onPress={handlePost}
              loading={loading}
              iconName="send-outline"
              iconPosition="right"
              style={styles.postBtn}
            />

            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  flex: { flex: 1 },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  label: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  charCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: -SPACING.sm,
  },
  charCountWarning: {
    color: COLORS.warning,
  },
  tipsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  tipsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tipItem: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  postBtn: {
    marginBottom: SPACING.md,
  },
  cancelBtn: {},
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