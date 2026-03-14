import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getFeed } from '../api/feedApi';
import PostCard from '../components/PostCard';
import { COLORS, FONTS, SPACING, SHADOWS } from '../styles/theme';

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
      const res = await getFeed(pageNum, 10);
      const data = res.data;
      const newPosts = data.content || [];

      if (isRefresh || pageNum === 0) {
        setPosts(newPosts);
        setPage(0);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(!data.last);
    } catch (err) {
      console.error('Feed error:', err);
      setError('Failed to load feed. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed(0, true);
    }, [loadFeed])
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
    <PostCard
      post={item}
      reload={onRefresh}
      currentUser={user}
    />
  );

  const renderHeader = () => (
    <View style={styles.feedHeader}>
      <Text style={styles.feedHeaderTitle}>Community Feed</Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to share something with your community!
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: SPACING.xxl }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS.primary} size="small" />
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => loadFeed(0)}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading community feed…</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId?.toString()}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  feedHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  feedHeaderTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.feedBg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
    backgroundColor: COLORS.feedBg,
  },
  errorText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 50,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});