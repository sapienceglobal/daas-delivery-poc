'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize from localStorage, then verify against the backend so stale
  // browser user data never becomes the source of truth.
  useEffect(() => {
    let cancelled = false;

    const clearAuthStorage = () => {
      localStorage.removeItem('marketplace_token');
      localStorage.removeItem('marketplace_user');
      document.cookie = "marketplace_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('marketplace_token');
      const storedUser = localStorage.getItem('marketplace_user');

      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        if (cancelled) return;

        setToken(storedToken);
        setUser(parsed);
        document.cookie = `marketplace_token=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `user_role=${parsed.role}; path=/; max-age=604800; SameSite=Lax`;

        const data = await authAPI.getMe();
        const userData = data.data;
        if (cancelled) return;

        localStorage.setItem('marketplace_user', JSON.stringify(userData));
        document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
        setUser(userData);
      } catch {
        if (cancelled) return;
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = data;

    localStorage.setItem('marketplace_token', newToken);
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    document.cookie = `marketplace_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const googleLogin = useCallback(async (credential, role = 'customer') => {
    const data = await authAPI.googleLogin({ credential, role });
    const { token: newToken, user: userData } = data;

    localStorage.setItem('marketplace_token', newToken);
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    document.cookie = `marketplace_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData);
    const { token: newToken, user: userData } = data;

    localStorage.setItem('marketplace_token', newToken);
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    document.cookie = `marketplace_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    document.cookie = "marketplace_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      const userData = data.data;
      localStorage.setItem('marketplace_user', JSON.stringify(userData));
      document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
      setUser(userData);
      return userData;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('marketplace_user', JSON.stringify(updated));
      document.cookie = `user_role=${updated.role}; path=/; max-age=604800; SameSite=Lax`;
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isMerchant: user?.role === 'merchant',
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
