import React from 'react';
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { deletePost, toggleLike } from '../api/feedApi';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';
import CommentsModal from './CommentsModal';

const AVATAR_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.info,
  COLORS.warning,
  COLORS.success,
];

export default function PostCard({ post, reload, currentUser }) {
  const router = useRouter();
  const { refreshNotifications } = useNotifications();
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [liked, setLiked] = React.useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = React.useState(post.likesCount ?? 0);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount ?? 0);
  const [showComments, setShowComments] = React.useState(false);

  const isMyPost = currentUser?.name === post.authorUsername;
  const avatarColorIndex = post.authorUsername
    ? post.authorUsername.charCodeAt(0) % AVATAR_COLORS.length
    : 0;

  const handleLike = async () => {
    if (likeLoading) {
      return;
    }

    const previousLiked = liked;
    setLikeLoading(true);
    setLiked(!previousLiked);
    setLikesCount((current) => (previousLiked ? current - 1 : current + 1));

    try {
      const response = await toggleLike(post.postId);
      if (response.data?.likesCount !== undefined) {
        setLikesCount(response.data.likesCount);
        setLiked(response.data.liked);
      }
      await refreshNotifications({ silent: true });
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount((current) => (previousLiked ? current + 1 : current - 1));
      console.error('Like error:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.authorUsername}: ${post.content || 'Check out this post.'}`,
        title: 'TolUnity Community Post',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const executeDelete = async () => {
    try {
      await deletePost(post.postId);
      reload?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete the post.');
    }
  };

  const showOptions = () => {
    Alert.alert('Post Options', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit Post',
        onPress: () => {
          setTimeout(() => {
            router.push({
              pathname: '/edit-post',
              params: {
                postId: post.postId,
                content: post.content || '',
                medias: post.medias ? JSON.stringify(post.medias) : '[]',
              },
            });
          }, 150);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTimeout(() => {
            Alert.alert('Delete Post?', 'Are you sure you want to delete this post? This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: executeDelete },
            ]);
          }, 150);
        },
      },
    ]);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {post.authorProfilePictureUrl ? (
            <Image source={{ uri: post.authorProfilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: AVATAR_COLORS[avatarColorIndex] }]}>
              <Text style={styles.avatarText}>{getInitials(post.authorUsername)}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.authorUsername || 'Unknown'}</Text>
            <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
        {isMyPost ? (
          <TouchableOpacity onPress={showOptions} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {post.medias?.length ? (
        <View style={styles.mediaStack}>
          {post.medias.map((media, index) => (
            media.mediaType?.toUpperCase() === 'VIDEO' ? (
              <Video
                key={`${media.mediaUrl}-${index}`}
                source={{ uri: media.mediaUrl }}
                style={styles.mediaVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            ) : (
              <Image
                key={`${media.mediaUrl}-${index}`}
                source={{ uri: media.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? COLORS.likePink : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, liked && styles.actionTextLiked]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={showComments}
        postId={post.postId}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount((current) => current + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  authorInfo: {
    flex: 1,
    marginLeft: SPACING.xs,
  },
  authorName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  postTime: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  mediaStack: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  mediaImage: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.black,
  },
  mediaVideo: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.black,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: SPACING.xs,
  },
  actionText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.semibold,
  },
  actionTextLiked: {
    color: COLORS.likePink,
  },
});
