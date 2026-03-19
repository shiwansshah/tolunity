// API base URL - update this to match your local IP
export const API_BASE_URL = 'http://100.64.201.0:8080/api';

// API endpoints (matching backend controllers)
export const ENDPOINTS = {
  // Auth - /api/auth/*
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  UPDATE_PROFILE_PIC: '/user/profile/picture',
  UPDATE_PROFILE: '/user/profile/update',
  CHANGE_PASSWORD: '/user/password/change',

  // Feed - /api/feed/*
  GET_FEED: '/feed/getFeed',
  CREATE_POST: '/feed/createPost',
  EDIT_POST: (postId) => `/feed/editPost/${postId}`,
  DELETE_POST: (postId) => `/feed/deletePost/${postId}`,
  LIKE_POST: (postId) => `/feed/likePost/${postId}`,

  // Comments (future)
  CREATE_COMMENT: (postId) => `/feed/comment/${postId}`,
  GET_COMMENTS: (postId) => `/feed/comments/${postId}`,
  DELETE_COMMENT: (commentId) => `/feed/deleteComment/${commentId}`,
};

// AsyncStorage keys
export const STORAGE_KEYS = {
  TOKEN: 'tolunity_token',
  USER: 'tolunity_user',
  REMEMBER_ME: 'tolunity_remember_me',
};

// Feed pagination
export const FEED_PAGE_SIZE = 10;
