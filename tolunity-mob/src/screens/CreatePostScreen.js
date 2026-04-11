import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { createPost } from '../api/feedApi';
import { getApiErrorMessage } from '../api/apiError';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.All,
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMediaAssets((currentAssets) => [...currentAssets, ...result.assets]);
    }
  };

  const removeMedia = (index) => {
    setMediaAssets((currentAssets) => currentAssets.filter((_, assetIndex) => assetIndex !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('Empty Post', 'Please write something or attach media before posting.');
      return;
    }

    setLoading(true);
    try {
      const mediaList = mediaAssets.map((asset) => {
        const isVideo = asset.type === 'video';
        const mediaType = isVideo ? 'video' : 'image';
        const fileSegments = asset.uri.split('.');
        const extension = fileSegments[fileSegments.length - 1];
        const base64Uri = asset.base64
          ? `data:${isVideo ? 'video' : 'image'}/${extension};base64,${asset.base64}`
          : asset.uri;

        return {
          mediaUrl: base64Uri,
          mediaType,
        };
      });

      await createPost({ content: content.trim(), mediaList });
      Alert.alert('Posted', 'Your post has been shared with the community.', [
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              router.back();
            }, 150);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Post Failed', getApiErrorMessage(error, 'Unable to create post. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader title="Create Post" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={styles.card}>
            <InputField
              label="Post"
              placeholder="Share something with your community"
              value={content}
              onChangeText={setContent}
              autoCapitalize="sentences"
              multiline
            />
            <Text style={styles.counter}>{content.length} / 500</Text>
          </SurfaceCard>

          {mediaAssets.length > 0 ? (
            <SurfaceCard style={styles.mediaCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mediaAssets.map((asset, index) => (
                  <View key={`${asset.uri}-${index}`} style={styles.mediaItem}>
                    <Image source={{ uri: asset.uri }} style={styles.mediaImage} />
                    {(asset.type === 'video' || asset.mediaType === 'VIDEO') ? (
                      <View style={styles.videoBadge}>
                        <Ionicons name="play" size={14} color={COLORS.textLight} />
                      </View>
                    ) : null}
                    <TouchableOpacity style={styles.removeButton} onPress={() => removeMedia(index)}>
                      <Ionicons name="close" size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </SurfaceCard>
          ) : null}

          <TouchableOpacity style={styles.attachRow} onPress={pickMedia} activeOpacity={0.8}>
            <Text style={styles.attachText}>Attach photo or video</Text>
          </TouchableOpacity>

          <SurfaceCard style={styles.guidance}>
            <Text style={styles.guidanceTitle}>Posting guidelines</Text>
            <Text style={styles.guidanceText}>Be respectful and keep updates relevant to the community.</Text>
            <Text style={styles.guidanceText}>Avoid spam and duplicate posts.</Text>
          </SurfaceCard>

          <Button title="Share Post" onPress={handlePost} loading={loading} style={styles.primaryAction} />
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
  counter: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  mediaCard: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  mediaItem: {
    marginRight: SPACING.xs,
  },
  mediaImage: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.black,
  },
  videoBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.overlaySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachRow: {
    minHeight: 48,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
  },
  attachText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  guidance: {
    marginBottom: SPACING.sm,
  },
  guidanceTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guidanceText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  primaryAction: {
    marginBottom: SPACING.xs,
  },
});
