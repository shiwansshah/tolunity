import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { toggleLike, deletePost } from '../api/feedApi';
import CommentsModal from './CommentsModal';

/**
 * Premium PostCard component matching the UI design
 * Shows: author avatar, name, time, content, likes, comments, share
 */
export default function PostCard({ post, reload, currentUser }) {
  const router = useRouter();
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = React.useState(post.likesCount ?? 0);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount ?? 0);
  const [showComments, setShowComments] = React.useState(false);

  const isMyPost = currentUser?.name === post.authorUsername;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await toggleLike(post.postId);
      if (res.data?.likesCount !== undefined) {
        setLikesCount(res.data.likesCount);
        setIsLiked(res.data.liked);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      console.error('Like error:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.authorUsername}: ${post.content || 'Check out this post!'}`,
        title: 'TolUnity Community Post',
      });
    } catch (error) {
      console.error('Share error:', error);
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
                medias: post.medias ? JSON.stringify(post.medias) : '[]'
              } 
            });
          }, 150);
        }
      },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
    ]);
  };

  const confirmDelete = () => {
    setTimeout(() => {
      Alert.alert('Delete Post?', 'Are you sure you want to delete this post? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }, 150);
  };

  const executeDelete = async () => {
    try {
      await deletePost(post.postId);
      if (reload) reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete the post.');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    '#1E3FA0', '#E91E8C', '#FF6B35', '#2ECC71', '#9B59B6', '#F39C12',
  ];
  const colorIndex = post.authorUsername
    ? post.authorUsername.charCodeAt(0) % avatarColors.length
    : 0;

  return (
    <View style={styles.card}>
      {/* Author Row */}
      <View style={styles.authorRow}>
        {post.authorProfilePictureUrl ? (
          <Image
            source={{ uri: post.authorProfilePictureUrl }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: avatarColors[colorIndex] },
            ]}
          >
            <Text style={styles.avatarInitials}>{getInitials(post.authorUsername)}</Text>
          </View>
        )}

        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorUsername || 'Unknown'}</Text>
          <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
        </View>

        {isMyPost && (
          <TouchableOpacity onPress={showOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      {!!post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Media */}
      {post.medias && post.medias.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.medias.map((m, i) => {
            if (m.mediaType?.toUpperCase() === 'VIDEO') {
              return (
                <Video
                  key={i}
                  source={{ uri: m.mediaUrl }}
                  style={styles.mediaVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
              );
            }
            return (
              <Image
                key={i}
                source={{ uri: m.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            );
          })}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? COLORS.likePink : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              isLiked && { color: COLORS.likePink },
            ]}
          >
            {likesCount}
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity 
          style={styles.actionBtn} 
          activeOpacity={0.7}
          onPress={() => setShowComments(true)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={19}
            color={COLORS.textSecondary}
          />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={showComments}
        postId={post.postId}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  authorInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  authorName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  postTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  mediaContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  mediaVideo: {
    width: '100%',
    height: 250,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    backgroundColor: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
    paddingVertical: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
});