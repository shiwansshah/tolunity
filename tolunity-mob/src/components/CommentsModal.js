import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createComment, getPostComments } from '../api/feedApi';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';
import EmptyState from './EmptyState';

export default function CommentsModal({
  visible,
  postId,
  onClose,
  onCommentAdded,
}) {
  const { refreshNotifications } = useNotifications();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await getPostComments(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await createComment(postId, newComment.trim());
      setNewComment('');
      await loadComments();
      await refreshNotifications({ silent: true });
      onCommentAdded?.();
    } catch (error) {
      console.error('Create comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      {item.userProfilePic ? (
        <Image source={{ uri: item.userProfilePic }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.time}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.commentId.toString()}
              renderItem={renderComment}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={(
                <EmptyState
                  title="No comments yet"
                  description="Be the first to respond to this post."
                />
              )}
            />
          )}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment"
              placeholderTextColor={COLORS.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !newComment.trim()}
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.textLight} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.textLight} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    height: '82%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBorder,
    alignSelf: 'center',
    marginTop: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  commentBody: {
    flex: 1,
    marginLeft: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  commentText: {
    marginTop: 4,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.bgCard,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 112,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bgInputBorder,
    backgroundColor: COLORS.bgInput,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
    marginLeft: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});
