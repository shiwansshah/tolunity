import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { getAboutContent } from '../api/mobileContentApi';
import { getApiErrorMessage } from '../api/apiError';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function AboutTolUnityScreen() {
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async (options = {}) => {
    const silent = options.silent ?? false;

    if (!silent) {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await getAboutContent();
      setContent(response.data || null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load About TolUnity.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const mediaItems = Array.isArray(content?.mediaItems) ? content.mediaItems : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About TolUnity</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchContent({ silent: true });
          }} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{content?.title || 'About TolUnity'}</Text>
            <Text style={styles.description}>
              {content?.description || 'TolUnity helps communities manage communication, payments, visitors, complaints, and emergency updates in one place.'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {mediaItems.map((media, index) => (
              <View key={media.id || `${media.mediaType}-${index}`} style={styles.mediaCard}>
                {media.mediaType === 'VIDEO' ? (
                  <Video
                    source={{ uri: media.mediaUrl }}
                    style={styles.mediaVideo}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping={false}
                  />
                ) : (
                  <Image source={{ uri: media.mediaUrl }} style={styles.mediaImage} />
                )}
              </View>
            ))}

            {mediaItems.length === 0 && (
              <View style={styles.emptyMedia}>
                <Ionicons name="information-circle-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyMediaText}>No media has been added yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.md,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  mediaCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: SPACING.md,
  },
  mediaImage: {
    width: '100%',
    height: 220,
  },
  mediaVideo: {
    width: '100%',
    height: 220,
  },
  emptyMedia: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
  },
  emptyMediaText: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
});
