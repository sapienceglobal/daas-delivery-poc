'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // M2: Token is stored only in httpOnly cookie (set by server).
  // localStorage stores user profile data only (never the token).
  // On init, we try to call /me. If the httpOnly cookie is valid, it works.
  // If not, we clear local state.
  useEffect(() => {
    let cancelled = false;

    const clearAuthStorage = () => {
      localStorage.removeItem('marketplace_user');
      localStorage.removeItem('marketplace_token');
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('marketplace_user');
      const storedToken = localStorage.getItem('marketplace_token');

      if (!storedUser) {
        // No cached user data — try /me in case httpOnly cookie is still valid
        try {
          const data = await authAPI.getMe();
          const userData = data.data;
          if (cancelled) return;
          localStorage.setItem('marketplace_user', JSON.stringify(userData));
          document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
          setUser(userData);
        } catch {
          // No valid session — user is logged out
        }
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        if (cancelled) return;

        // Optimistic: show cached user immediately
        setUser(parsed);
        if (storedToken) setToken(storedToken);
        document.cookie = `user_role=${parsed.role}; path=/; max-age=604800; SameSite=Lax`;

        // Verify against backend (httpOnly cookie is sent automatically)
        const data = await authAPI.getMe();
        const userData = data.data;
        if (cancelled) return;

        localStorage.setItem('marketplace_user', JSON.stringify(userData));
        document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
        setUser(userData);
      } catch {
        if (cancelled) return;
        clearAuthStorage();
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

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.setItem('marketplace_token', newToken);
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const googleLogin = useCallback(async (credential, role = 'customer') => {
    const data = await authAPI.googleLogin({ credential, role });
    const { token: newToken, user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.setItem('marketplace_token', newToken);
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData);
    const { token: newToken, user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.setItem('marketplace_token', newToken);
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
    localStorage.removeItem('marketplace_user');
    localStorage.removeItem('marketplace_token');
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      const userData = data.data;
      if (userData) {
        localStorage.setItem('marketplace_user', JSON.stringify(userData));
        document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
        setUser(userData);
      }
      return userData;
    } catch (err) {
      if (err?.status === 401 || err?.statusCode === 401 || String(err?.message).includes('401')) {
        logout();
      }
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
