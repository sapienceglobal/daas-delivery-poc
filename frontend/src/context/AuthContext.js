'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token is stored only in the httpOnly cookie set by the server.
  // localStorage stores user profile display data only, never credentials.
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
        JSON.parse(storedUser);

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

  const login = useCallback(async (email, password, rememberMe = true) => {
    const data = await authAPI.login({ email, password, rememberMe });
    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.removeItem('marketplace_token');
    
    const cookieAge = rememberMe ? 'max-age=2592000;' : '';
    document.cookie = `user_role=${userData.role}; path=/; ${cookieAge} SameSite=Lax`;
    
    setUser(userData);
    return userData;
  }, []);

  const googleLogin = useCallback(async (credential, role = 'customer') => {
    const data = await authAPI.googleLogin({ credential, role });
    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.removeItem('marketplace_token');
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData);
    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    localStorage.removeItem('marketplace_token');
    document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
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
    token: null,
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
