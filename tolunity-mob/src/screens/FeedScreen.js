import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApiErrorMessage } from '../api/apiError';
import { getFeed } from '../api/feedApi';
import EmptyState from '../components/EmptyState';
import PostCard from '../components/PostCard';
import SurfaceCard from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../styles/theme';
import { FEED_PAGE_SIZE } from '../utils/constants';

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async (pageNum = 0, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError(null);
    } else if (pageNum === 0) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getFeed(pageNum, FEED_PAGE_SIZE);
      const data = response.data;
      const nextPosts = data.content || [];

      if (isRefresh || pageNum === 0) {
        setPosts(nextPosts);
        setPage(0);
      } else {
        setPosts((currentPosts) => [...currentPosts, ...nextPosts]);
      }

      setHasMore(!data.last);
    } catch (requestError) {
      console.error('Feed error:', requestError);
      setError(getApiErrorMessage(requestError, 'Failed to load feed. Pull down to retry.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed(0, true);
    }, [loadFeed]),
  );

  const onRefresh = () => {
    setPage(0);
    loadFeed(0, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(nextPage);
    }
  };

  const renderPost = ({ item }) => (
    <PostCard post={item} reload={onRefresh} currentUser={user} />
  );

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <SurfaceCard style={styles.hero}>
        <Text style={TYPOGRAPHY.eyebrow}>Community Feed</Text>
        <Text style={styles.heroTitle}>Neighborhood updates</Text>
        <Text style={styles.heroCopy}>
          {`See the latest posts, announcements, and shared moments${user?.name ? ` from ${user.name.split(' ')[0]}'s community` : ''}.`}
        </Text>
      </SurfaceCard>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) {
      return <View style={styles.footerSpace} />;
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.helperText}>Loading community feed</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Unable to load feed"
          description={error}
          icon={<Ionicons name="cloud-offline-outline" size={32} color={COLORS.textMuted} />}
        />
        <TouchableOpacity style={styles.retryButton} onPress={() => loadFeed(0)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.postId?.toString()}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={(
        <EmptyState
          title="No posts yet"
          description="Be the first to share something with your community."
          icon={<Ionicons name="newspaper-outline" size={32} color={COLORS.textMuted} />}
        />
      )}
      ListFooterComponent={renderFooter}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      )}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: SPACING.md,
  },
  headerWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  hero: {
    padding: SPACING.md,
  },
  heroTitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textPrimary,
  },
  heroCopy: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.feedBg,
  },
  helperText: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  footerLoader: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  footerSpace: {
    height: SPACING.sm,
  },
});
