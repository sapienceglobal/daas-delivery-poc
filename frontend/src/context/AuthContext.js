'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

// M6 FIX: Only cache non-sensitive display fields in localStorage.
// Credentials are in httpOnly cookies (safe). Sensitive fields like
// savedAddresses, savedCards, savedCart are fetched fresh from the server when needed.
const SAFE_CACHE_FIELDS = [
  '_id', 'name', 'email', 'role', 'avatar', 'phone',
  'restaurantId', 'loyaltyPoints', 'referralCode', 'isVerified', 'notificationPreferences'
];

const toSafeCacheObject = (user) => {
  if (!user) return null;
  const safe = {};
  for (const key of SAFE_CACHE_FIELDS) {
    if (user[key] !== undefined) safe[key] = user[key];
  }
  return safe;
};

// M4 FIX: These fields can ONLY change via a verified backend response.
// They must never be accepted via client-side updateUser() calls.
const BLOCKED_UPDATE_FIELDS = ['role', 'isActive', 'isAdmin', 'restaurantId', 'password', 'salt'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // H3 FIX: backendVerified is true ONLY after /me successfully confirms the session.
  // Role-restricted pages must check backendVerified before rendering sensitive content.
  const [backendVerified, setBackendVerified] = useState(false);

  // Token is stored only in the httpOnly cookie set by the server.
  // localStorage stores a minimal display cache — never credentials.
  // On init, we ALWAYS call /me to verify the session with the backend.
  // The httpOnly cookie is sent automatically — JS cannot access or forge it.
  useEffect(() => {
    let cancelled = false;

    const clearAuthStorage = () => {
      localStorage.removeItem('marketplace_user');
      localStorage.removeItem('marketplace_token');
      // user_role cookie is a UX hint only — NEVER used for security decisions.
      // Next.js middleware verifies the JWT directly (via jose), not this cookie.
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const initializeAuth = async () => {
      try {
        // Always verify with backend — localStorage alone is never trusted for access control.
        const data = await authAPI.getMe();
        const userData = data.data;
        if (cancelled) return;

        // Cache only safe fields — never cache addresses, cards, or cart data in localStorage.
        localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(userData)));
        // user_role cookie is a UX hint for smooth navigation only.
        document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
        setUser(userData);
        setBackendVerified(true);
      } catch {
        if (cancelled) return;
        clearAuthStorage();
        setUser(null);
        setBackendVerified(false);
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
    
    if (data.requires2fa) {
      return data;
    }

    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(userData)));
    localStorage.removeItem('marketplace_token');

    const cookieAge = rememberMe ? 'max-age=2592000;' : '';
    document.cookie = `user_role=${userData.role}; path=/; ${cookieAge} SameSite=Lax`;

    setUser(userData);
    setBackendVerified(true);
    return userData;
  }, []);

  const verify2FA = useCallback(async (tempToken, token, rememberMe = true) => {
    const data = await authAPI.verify2FA({ tempToken, token, rememberMe });
    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(userData)));
    localStorage.removeItem('marketplace_token');

    const cookieAge = rememberMe ? 'max-age=2592000;' : '';
    document.cookie = `user_role=${userData.role}; path=/; ${cookieAge} SameSite=Lax`;

    setUser(userData);
    setBackendVerified(true);
    return userData;
  }, []);

  const socialLogin = useCallback(async (provider, token, role = 'customer') => {
    const data = await authAPI.socialLogin({ provider, token, role });
    const { user: userData } = data;

    localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(userData)));
    localStorage.removeItem('marketplace_token');
    document.cookie = `user_role=${userData.role}; path=/; max-age=2592000; SameSite=Lax`;

    setUser(userData);
    setBackendVerified(true);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    // FIX: registration no longer authenticates the browser. The backend's
    // /api/auth/register now only creates an unverified account and emails
    // an OTP — it doesn't set a session cookie or return a `user` object
    // anymore, so none of the old setUser/setBackendVerified/localStorage
    // side effects apply here. The session only gets established later,
    // when the caller navigates to the OTP screen and verifyOtp()
    // succeeds — that flow does a full page reload to /customer, which
    // re-runs the /me check above and populates real auth state then.
    //
    // Previously this function treated register() exactly like login() —
    // caching the user and marking backendVerified true immediately —
    // which is what let people reach authenticated pages without ever
    // completing OTP verification.
    return authAPI.register(formData); // { success, message, email }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout API errors — cookie is cleared client-side regardless
    }
    localStorage.removeItem('marketplace_user');
    localStorage.removeItem('marketplace_token');
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    setBackendVerified(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      const userData = data.data;
      if (userData) {
        localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(userData)));
        document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
        setUser(userData);
        setBackendVerified(true);
      }
      return userData;
    } catch (err) {
      if (err?.status === 401 || err?.statusCode === 401 || String(err?.message).includes('401')) {
        logout();
      }
      return null;
    }
  }, [logout]);

  // M4 FIX: updateUser strips security-sensitive fields before applying any update.
  // Role, isActive, and restaurantId can ONLY change via a real backend response.
  const updateUser = useCallback((updates) => {
    const safeUpdates = { ...updates };
    for (const blocked of BLOCKED_UPDATE_FIELDS) {
      delete safeUpdates[blocked];
    }

    setUser(prev => {
      const updated = { ...prev, ...safeUpdates };
      localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(updated)));
      // Do NOT update user_role cookie from client-side updateUser — role changes only via backend.
      return updated;
    });
  }, []);

  const value = {
    user,
    token: null,
    loading,
    backendVerified, // H3: pages gate sensitive rendering on this flag
    // All role flags require BOTH user data AND backend verification
    isAuthenticated: !!user && backendVerified,
    isCustomer: user?.role === 'customer' && backendVerified,
    isMerchant: user?.role === 'merchant' && backendVerified,
    isAdmin: user?.role === 'admin' && backendVerified,
    isDriver: user?.role === 'driver' && backendVerified,
    login,
    verify2FA,
    socialLogin,
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