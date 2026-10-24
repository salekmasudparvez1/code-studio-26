import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPermitted: boolean;
  isAdmin: boolean;
  auth0Domain: string;
  auth0ClientId: string;
  login: (userData: { email: string; name?: string; id?: string; picture?: string; password?: string }) => Promise<void>;
  loginWithAuth0: () => void;
  loginAsAdmin: () => Promise<void>;
  loginAsDemoUser: () => Promise<void>;
  loginAsPendingUser: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'codestudio_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth0Domain, setAuth0Domain] = useState<string>(() => {
    const raw = (import.meta.env.VITE_AUTH0_DOMAIN as string) || '';
    return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  });

  const [auth0ClientId, setAuth0ClientId] = useState<string>(() => {
    return (import.meta.env.VITE_AUTH0_CLIENT_ID as string) || '';
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Auth0 runtime config from backend if needed
  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cfg?.domain && !auth0Domain) setAuth0Domain(cfg.domain);
        if (cfg?.clientId && !auth0ClientId) setAuth0ClientId(cfg.clientId);
      })
      .catch(() => {});
  }, [auth0Domain, auth0ClientId]);

  // Sync user with PostgreSQL backend
  const syncWithBackend = useCallback(async (data: { email: string; name?: string; id?: string; picture?: string; password?: string }) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setUser(json.user);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.user));
          return json.user;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson?.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('password')) {
        throw err;
      }
      console.warn('Backend sync failed, using client state:', err);
    }

    // Fallback if backend is unreachable
    const isAdmin =
      data.email.toLowerCase() === 'smp23997@gmail.com' ||
      data.email.toLowerCase() === 'sakekmasudparvez@gmail.com';

    const fallbackUser: User = {
      id: data.id || `user_${Date.now()}`,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null,
      role: isAdmin ? 'ADMIN' : 'USER',
      status: isAdmin ? 'APPROVED' : 'PENDING',
    };
    setUser(fallbackUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setUser(json.user);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.user));
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user from backend:', err);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (userData: { email: string; name?: string; id?: string; picture?: string; password?: string }) => {
    setIsLoading(true);
    await syncWithBackend(userData);
    setIsLoading(false);
  };

  const loginWithAuth0 = () => {
    const domain = auth0Domain || 'dev-r2pn0p5oac54ej5y.us.auth0.com';
    const clientId = auth0ClientId || '9XNj49jmScArNeqmyTxxcS6Idvikx97M';

    if (domain && clientId) {
      const redirectUri = window.location.origin;
      const authUrl = `https://${domain}/authorize?client_id=${encodeURIComponent(
        clientId
      )}&response_type=token%20id_token&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=openid%20profile%20email&nonce=${Math.random().toString(36).substring(7)}`;

      window.location.href = authUrl;
    }
  };

  const loginAsAdmin = async () => {
    await login({
      email: 'smp23997@gmail.com',
      name: 'Salek Masud Parvez (Admin)',
      id: 'auth0|admin_smp',
      password: 'admin_parvez@25$J',
    });
  };

  const loginAsDemoUser = async () => {
    try {
      await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'developer.alex@gmail.com', status: 'APPROVED' }),
      });
    } catch {}

    await login({
      email: 'developer.alex@gmail.com',
      name: 'Alex Developer',
      id: 'auth0|user_alex',
    });

    try {
      await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'developer.alex@gmail.com', status: 'APPROVED' }),
      });
      await refreshUser();
    } catch {}
  };

  const loginAsPendingUser = async () => {
    await login({
      email: `new.learner_${Math.floor(Math.random() * 900 + 100)}@gmail.com`,
      name: 'New Developer',
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const isAuthenticated = !!user;
  const isPermitted = !!user && (user.status === 'APPROVED' || user.role === 'ADMIN');
  const isAdmin = !!user && user.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isPermitted,
        isAdmin,
        auth0Domain,
        auth0ClientId,
        login,
        loginWithAuth0,
        loginAsAdmin,
        loginAsDemoUser,
        loginAsPendingUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
