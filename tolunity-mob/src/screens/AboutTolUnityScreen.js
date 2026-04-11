import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getApiErrorMessage } from '../api/apiError';
import { getAboutContent } from '../api/mobileContentApi';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

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
      <ScreenHeader title="About TolUnity" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchContent({ silent: true });
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          )}
        >
          <SurfaceCard style={styles.card}>
            <Text style={styles.title}>{content?.title || 'About TolUnity'}</Text>
            <Text style={styles.description}>
              {content?.description || 'TolUnity helps communities manage communication, payments, visitors, complaints, and emergency updates in one place.'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {mediaItems.length ? mediaItems.map((media, index) => (
              <View key={media.id || `${media.mediaType}-${index}`} style={styles.mediaCard}>
                {media.mediaType === 'VIDEO' ? (
                  <Video
                    source={{ uri: media.mediaUrl }}
                    style={styles.media}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping={false}
                  />
                ) : (
                  <Image source={{ uri: media.mediaUrl }} style={styles.media} />
                )}
              </View>
            )) : (
              <EmptyState
                title="No media available"
                description="Media for this page has not been added yet."
                icon={<Ionicons name="information-circle-outline" size={28} color={COLORS.textMuted} />}
              />
            )}
          </SurfaceCard>
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
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textPrimary,
  },
  description: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.md,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
  },
  mediaCard: {
    marginTop: SPACING.sm,
    overflow: 'hidden',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.black,
  },
  media: {
    width: '100%',
    height: 220,
  },
});
