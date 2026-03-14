import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../utils/constants';

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, name, email, userRole }
 */
export const loginUser = (data) =>
  axiosInstance.post(ENDPOINTS.LOGIN, data);

/**
 * Register user
 * POST /api/auth/register
 * Body: { name, email, password, phoneNumber }
 * Returns: { message }
 */
export const registerUser = (data) =>
  axiosInstance.post(ENDPOINTS.REGISTER, data);

/**
 * Logout user
 * POST /api/auth/logout
 * Returns: { message }
 */
export const logoutUser = () =>
  axiosInstance.post(ENDPOINTS.LOGOUT);

/**
 * Update user profile picture
 * POST /api/user/profile/picture
 * Body: { profilePic: base64 | url | null }
 */
export const updateProfilePic = (profilePic) =>
  axiosInstance.post(ENDPOINTS.UPDATE_PROFILE_PIC, { profilePic });

/**
 * Update user profile info
 * POST /api/user/profile/update
 * Body: { name, phoneNumber }
 */
export const updateProfile = (data) =>
  axiosInstance.post(ENDPOINTS.UPDATE_PROFILE, data);

/**
 * Change user password
 * POST /api/user/password/change
 * Body: { currentPassword, newPassword }
 */
export const changePassword = (data) =>
  axiosInstance.post(ENDPOINTS.CHANGE_PASSWORD, data);