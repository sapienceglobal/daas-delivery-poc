'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

// M6 FIX: Only cache non-sensitive display fields in localStorage.
// credentials are in httpOnly cookies (safe). Sensitive fields like
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
// they must never be accepted via client-side updateUser() calls.
const BLOCKED_UPDATE_FIELDS = ['role', 'isActive', 'isAdmin', 'restaurantId', 'password', 'salt'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // H3 FIX: backendVerified is true ONLY after /me successfully confirms the session.
  // role-restricted pages must check backendVerified before rendering sensitive content.
  const [backendVerified, setBackendVerified] = useState(false);

  // token is stored only in the httpOnly cookie set by the server.
  // localStorage stores a minimal display cache — never credentials.
  // on init, we ALWAYS call /me to verify the session with the backend.
  // the httpOnly cookie is sent automatically — JS cannot access or forge it.
  useEffect(() => {
    let cancelled = false;

    const clearAuthStorage = () => {
      localStorage.removeItem('marketplace_user');
      localStorage.removeItem('marketplace_token');
      localStorage.removeItem('marketplace_remember_me');
      localStorage.removeItem('marketplace_last_activity');
      // user_role cookie is a UX hint only — NEVER used for security decisions.
      // next.js middleware verifies the JWT directly (via jose), not this cookie.
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const initializeAuth = async () => {
      try {
        // always verify with backend — localStorage alone is never trusted for access control.
        const data = await authAPI.getMe();
        const userData = data.data;
        if (cancelled) return;

        // cache only safe fields — never cache addresses, cards, or cart data in localStorage.
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
    localStorage.setItem('marketplace_remember_me', rememberMe ? 'true' : 'false');
    
    if (!rememberMe) {
      sessionStorage.setItem('marketplace_tab_active', 'true');
    }

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
    localStorage.setItem('marketplace_remember_me', rememberMe ? 'true' : 'false');

    if (!rememberMe) {
      sessionStorage.setItem('marketplace_tab_active', 'true');
    }

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
    localStorage.setItem('marketplace_remember_me', 'true');
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
    // previously this function treated register() exactly like login() —
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
    localStorage.removeItem('marketplace_remember_me');
    localStorage.removeItem('marketplace_last_activity');
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
  // role, isActive, and restaurantId can ONLY change via a real backend response.
  const updateUser = useCallback((updates) => {
    const safeUpdates = { ...updates };
    for (const blocked of BLOCKED_UPDATE_FIELDS) {
      delete safeUpdates[blocked];
    }

    setUser(prev => {
      const updated = { ...prev, ...safeUpdates };
      localStorage.setItem('marketplace_user', JSON.stringify(toSafeCacheObject(updated)));
      // do NOT update user_role cookie from client-side updateUser — role changes only via backend.
      return updated;
    });
  }, []);

  // M7 FIX: Industry Standard Inactivity Logout for Merchants
  // Banks and enterprise apps enforce inactivity logouts to circumvent the browser's
  // "Continue where you left off" feature which forcefully restores session cookies.
  useEffect(() => {
    let activityInterval;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      const now = Date.now();
      const last = parseInt(localStorage.getItem('marketplace_last_activity') || '0', 10);
      if (now - last > 5000) {
        localStorage.setItem('marketplace_last_activity', now.toString());
      }
    };

    if (backendVerified && localStorage.getItem('marketplace_remember_me') === 'false' && user?.role !== 'customer') {
      localStorage.setItem('marketplace_last_activity', Date.now().toString());
      events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
      
      activityInterval = setInterval(() => {
        const lastActivity = parseInt(localStorage.getItem('marketplace_last_activity') || '0', 10);
        if (Date.now() - lastActivity > 30 * 60 * 1000) { // 30 minutes
          logout();
          alert('You have been securely logged out due to 30 minutes of inactivity.');
          window.location.href = '/login';
        }
      }, 60000);
    }

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (activityInterval) clearInterval(activityInterval);
    };
  }, [backendVerified, logout, user?.role]);

  // M8 FIX: Strict Logout on Tab/Browser Close (Cross-tab validation)
  // This applies to ALL roles (merchants and customers) if rememberMe is false.
  // It guarantees instant logout if all tabs are closed, defeating Chrome's session restore.
  useEffect(() => {
    if (!backendVerified || localStorage.getItem('marketplace_remember_me') !== 'false') return;

    // Answer pings from other tabs
    const handleStorage = (e) => {
      if (e.key === 'session_ping') {
        localStorage.setItem('session_pong', Date.now().toString());
      }
    };
    window.addEventListener('storage', handleStorage);

    // Check if this tab is authorized
    if (!sessionStorage.getItem('marketplace_tab_active')) {
      let isSharedSession = false;
      const listenPong = (e) => {
        if (e.key === 'session_pong') isSharedSession = true;
      };
      window.addEventListener('storage', listenPong);
      
      // Ping other tabs
      localStorage.setItem('session_ping', Date.now().toString());
      
      const timer = setTimeout(() => {
        window.removeEventListener('storage', listenPong);
        if (isSharedSession) {
          // Another tab is open, authorize this tab
          sessionStorage.setItem('marketplace_tab_active', 'true');
        } else {
          // No other tabs responded. Check if it was a page refresh.
          const navType = performance.getEntriesByType('navigation')[0]?.type;
          if (navType === 'reload' || navType === 'back_forward') {
            sessionStorage.setItem('marketplace_tab_active', 'true');
          } else {
            // Fresh launch, no other tabs open -> Strict logout!
            logout();
          }
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('storage', handleStorage);
      };
    }

    return () => window.removeEventListener('storage', handleStorage);
  }, [backendVerified, user?.role, logout]);

  const value = {
    user,
    token: null,
    loading,
    backendVerified, // H3: pages gate sensitive rendering on this flag
    // all role flags require BOTH user data AND backend verification
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