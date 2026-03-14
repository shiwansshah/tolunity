import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

// ─── Token ───────────────────────────────────────────────────────────────────

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const storeUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

// ─── Remember Me ──────────────────────────────────────────────────────────────

export const storeRememberMe = async (value) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(value));
  } catch (error) {
    console.error('Error storing remember me:', error);
  }
};

export const getRememberMe = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return val ? JSON.parse(val) : false;
  } catch (error) {
    return false;
  }
};

// ─── Clear All ────────────────────────────────────────────────────────────────

export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.REMEMBER_ME,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};