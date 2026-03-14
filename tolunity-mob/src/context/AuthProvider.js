import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import {
  storeToken,
  removeToken,
  storeUser,
  removeUser,
  getToken,
  getUser,
  clearStorage,
} from '../utils/storage';
import { globalEvent } from '../utils/EventEmitter';
import { useRouter } from 'expo-router';

export default function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for global auth logouts (e.g. from axios 401 interceptor)
  useEffect(() => {
    const unsubscribe = globalEvent.on('AUTH_LOGOUT', async () => {
      await logout();
      router.replace('/login');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Login: store token + user data
   * @param {Object} data - { token, name, email, userRole }
   */
  const login = async (data) => {
    await storeToken(data.token);
    await storeUser(data);
    setToken(data.token);
    setUser(data);
  };

  /**
   * Logout: clear storage and state
   */
  const logout = async () => {
    await clearStorage();
    setToken(null);
    setUser(null);
  };

  /**
   * Update User: Update partial/full user data without re-login
   */
  const updateUser = async (newData) => {
    const updatedUser = { ...user, ...newData };
    await storeUser(updatedUser);
    setUser(updatedUser);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}