import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

export default function CommentModal({ visible, onClose, postId, commentsCount }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = {
        id: Date.now().toString(),
        author: 'You',
        text: comment.trim(),
        time: 'Just now',
      };
      setComments((prev) => [newComment, ...prev]);
      setComment('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{item.author[0]}</Text>
      </View>
      <View style={styles.commentBubble}>
        <Text style={styles.commentAuthor}>{item.author}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Comments ({commentsCount || comments.length})
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No comments yet. Be first!</Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment…"
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !comment.trim() && styles.sendBtnDisabled]}
              onPress={handleSubmit}
              disabled={!comment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: SPACING.md },
  commentItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.sm,
  },
  commentAvatarText: { color: '#FFF', fontWeight: '700', fontSize: FONTS.sizes.sm },
  commentBubble: {
    flex: 1, backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md, padding: SPACING.md,
  },
  commentAuthor: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  commentText: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyText: { marginTop: SPACING.sm, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md, gap: SPACING.sm,
  },
  input: {
    flex: 1, backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.bgInputBorder,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, maxHeight: 80,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
