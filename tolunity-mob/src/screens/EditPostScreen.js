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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getApiErrorMessage } from '../api/apiError';
import { editPost } from '../api/feedApi';
import Button from '../components/Button';
import Container from '../components/Container';
import InputField from '../components/InputField';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

export default function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = params.postId;
  const initialContent = params.content || '';

  let initialMedias = [];
  try {
    initialMedias = params.medias ? JSON.parse(params.medias) : [];
  } catch (error) {
    console.error('Failed parsing medias', error);
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
      setMediaAssets((currentAssets) => [...currentAssets, ...result.assets]);
    }
  };

  const removeMedia = (index) => {
    setMediaAssets((currentAssets) => currentAssets.filter((_, assetIndex) => assetIndex !== index));
  };

  const handleSave = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('Empty Post', 'Post content or media cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const mediaList = mediaAssets.map((asset) => {
        if (asset.mediaUrl) {
          return asset;
        }

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

      await editPost(postId, { content: content.trim(), mediaList });
      Alert.alert('Updated', 'Your post has been updated.', [
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
      Alert.alert('Update Failed', getApiErrorMessage(error, 'Unable to update post.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader title="Edit Post" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container scroll contentStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={styles.card}>
            <InputField
              label="Post"
              placeholder="Update your post"
              value={content}
              onChangeText={setContent}
              autoCapitalize="sentences"
              multiline
            />
          </SurfaceCard>

          {mediaAssets.length > 0 ? (
            <SurfaceCard style={styles.mediaCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mediaAssets.map((asset, index) => (
                  <View key={`${asset.uri || asset.mediaUrl}-${index}`} style={styles.mediaItem}>
                    <Image source={{ uri: asset.uri || asset.mediaUrl }} style={styles.mediaImage} />
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
            <Text style={styles.attachText}>Add photo or video</Text>
          </TouchableOpacity>

          <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.primaryAction} />
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
  primaryAction: {
    marginBottom: SPACING.xs,
  },
});
