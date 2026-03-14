import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../utils/constants';

/**
 * Get paginated feed
 * GET /api/feed/getFeed?page=0&size=10
 * Returns paged FeedPostsResponse
 */
export const getFeed = (page = 0, size = 10) =>
  axiosInstance.get(ENDPOINTS.GET_FEED, { params: { page, size } });

/**
 * Create a post
 * POST /api/feed/createPost
 * Body: { content, mediaList: [] }
 */
export const createPost = (data) =>
  axiosInstance.post(ENDPOINTS.CREATE_POST, data);

/**
 * Edit a post
 * POST /api/feed/editPost/:postId
 * Body: { content, mediaList: [] }
 */
export const editPost = (postId, data) =>
  axiosInstance.post(ENDPOINTS.EDIT_POST(postId), data);

/**
 * Delete a post (soft delete)
 * POST /api/feed/deletePost/:postId
 */
export const deletePost = (postId) =>
  axiosInstance.post(ENDPOINTS.DELETE_POST(postId));

/**
 * Toggle like on a post
 * POST /api/feed/likePost/:postId
 * Returns: { liked, message, likesCount }
 */
export const toggleLike = (postId) =>
  axiosInstance.post(ENDPOINTS.LIKE_POST(postId));

/**
 * Add a comment to a post
 * POST /api/feed/comment/:postId
 * Body: { content }
 */
export const createComment = (postId, content) =>
  axiosInstance.post(ENDPOINTS.CREATE_COMMENT(postId), { content });

/**
 * Get all comments for a post
 * GET /api/feed/comments/:postId
 */
export const getPostComments = (postId) =>
  axiosInstance.get(ENDPOINTS.GET_COMMENTS(postId));