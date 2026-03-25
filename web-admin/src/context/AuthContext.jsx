import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './authContextObject';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');
      
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    
    // Ensure the logged in user actually has Admin privileges
    if (data.userRole !== 'ADMIN') {
        throw new Error('Access Denied. You are not an administrator.');
    }

    localStorage.setItem('admin_token', data.token);
    const adminUser = {
      name: data.name,
      email: data.email,
      role: data.userRole,
      userType: data.userType ?? null,
    };
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setUser(adminUser);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    window.location.assign('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
        {children}
    </AuthContext.Provider>
  );
};
