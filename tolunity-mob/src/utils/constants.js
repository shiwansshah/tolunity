import { appConfig } from '../config/appConfig';

export const API_BASE_URL = appConfig.apiBaseUrl;

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  UPDATE_PROFILE_PIC: '/user/profile/picture',
  UPDATE_PROFILE: '/user/profile/update',
  CHANGE_PASSWORD: '/user/password/change',
  GET_FEED: '/feed/getFeed',
  CREATE_POST: '/feed/createPost',
  EDIT_POST: (postId) => `/feed/editPost/${postId}`,
  DELETE_POST: (postId) => `/feed/deletePost/${postId}`,
  LIKE_POST: (postId) => `/feed/likePost/${postId}`,
  CREATE_COMMENT: (postId) => `/feed/comment/${postId}`,
  GET_COMMENTS: (postId) => `/feed/comments/${postId}`,
  DELETE_COMMENT: (commentId) => `/feed/deleteComment/${commentId}`,
};

export const STORAGE_KEYS = {
  TOKEN: 'tolunity_token',
  USER: 'tolunity_user',
  REMEMBER_ME: 'tolunity_remember_me',
};

export const FEED_PAGE_SIZE = appConfig.feedPageSize;
