import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  role: UserRole;
  status: UserStatus;
  requested_plan?: string;
  request_note?: string;
  session_token?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPermitted: boolean;
  isAdmin: boolean;
  auth0Domain: string;
  auth0ClientId: string;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  loginAsAdmin: () => Promise<User>;
  loginAsDemoUser: () => Promise<User>;
  loginAsPendingUser: () => Promise<User>;
  loginWithAuth0: () => void;
  loginWithGoogle: () => void;
  requestAccess: (plan?: string, note?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "codestudio_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "codestudio_auth_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth0Domain, setAuth0Domain] = useState<string>(() => {
    const raw = (import.meta.env.VITE_AUTH0_DOMAIN as string) || "";
    return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  });

  const [auth0ClientId, setAuth0ClientId] = useState<string>(() => {
    return (import.meta.env.VITE_AUTH0_CLIENT_ID as string) || "";
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Auth0 runtime config from backend if needed
  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cfg?.domain && !auth0Domain) setAuth0Domain(cfg.domain);
        if (cfg?.clientId && !auth0ClientId) setAuth0ClientId(cfg.clientId);
      })
      .catch(() => {});
  }, [auth0Domain, auth0ClientId]);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setUser(json.user);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(json.user));
        }
      }
    } catch (err) {
      console.warn("Failed to refresh user:", err);
    }
  }, [user?.email]);

  // Check for Auth0 response in URL hash or search params on mount
  useEffect(() => {
    // 1. Implicit Grant / Token in Hash: #access_token=...&id_token=...
    if (window.location.hash && (window.location.hash.includes("id_token=") || window.location.hash.includes("access_token="))) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const idToken = hashParams.get("id_token");

        if (idToken) {
          const base64Url = idToken.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);

          if (payload && payload.email) {
            setIsLoading(true);
            fetch("/api/auth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: payload.sub || `auth0|${Date.now()}`,
                email: payload.email,
                name: payload.name || payload.nickname || payload.email.split("@")[0],
                picture: payload.picture || null,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.user) {
                  setUser(data.user);
                  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
                  if (data.token) {
                    setToken(data.token);
                    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
                  }
                }
              })
              .catch((err) => console.error("Error syncing Auth0 profile with PostgreSQL:", err))
              .finally(() => {
                setIsLoading(false);
                window.history.replaceState({}, document.title, window.location.pathname);
              });
            return;
          }
        }
      } catch (err) {
        console.error("Failed to parse Auth0 hash token:", err);
      }
    }

    // 2. Sync on initial mount if already stored
    if (user?.email) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // 1. Direct Email & Password Login
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      if (!data.user) {
        throw new Error("Invalid response received from authentication server.");
      }

      setUser(data.user);
      if (data.token) {
        setToken(data.token);
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
      }
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Direct Sign Up
  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "Registration failed. Please check your inputs.");
        }

        if (!data.user) {
          throw new Error("Invalid response received from registration server.");
        }

        setUser(data.user);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
        }
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
        return data.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 3. Admin Authentication: Salek Masud Parvez
  const loginAsAdmin = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "smp23997@gmail.com",
          name: "Salek Masud Parvez",
          password: "admin_parvez@25$J",
          id: "auth0|admin_smp",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Admin authentication failed.");
      }

      setUser(data.user);
      if (data.token) {
        setToken(data.token);
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
      }
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Demo User Authentication
  const loginAsDemoUser = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "developer.alex@gmail.com", status: "APPROVED" }),
      }).catch(() => {});

      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "developer.alex@gmail.com",
          name: "Alex Developer",
          id: "auth0|user_alex",
        }),
      });

      const data = await res.json().catch(() => ({}));
      const u = data.user || {
        id: "auth0|user_alex",
        email: "developer.alex@gmail.com",
        name: "Alex Developer",
        role: "USER",
        status: "APPROVED",
      };

      setUser(u);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. Pending User Authentication
  const loginAsPendingUser = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      const demoEmail = "new.learner@gmail.com";
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: demoEmail,
          name: "New Developer",
          id: "auth0|user_pending",
        }),
      });

      const data = await res.json().catch(() => ({}));
      const u = data.user || {
        id: "auth0|user_pending",
        email: demoEmail,
        name: "New Developer",
        role: "USER",
        status: "PENDING",
      };

      setUser(u);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 6. Request Studio Package Access
  const requestAccess = useCallback(
    async (plan: string = "PRO", note?: string): Promise<{ success: boolean; message: string }> => {
      if (!user?.email) {
        throw new Error("Please log in before submitting a studio access request.");
      }

      const res = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan, note }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit access request.");
      }

      if (data.user) {
        setUser(data.user);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      }

      return {
        success: true,
        message:
          data.message ||
          "Your studio access request has been submitted to Administrator Salek Masud Parvez. Status: PENDING review.",
      };
    },
    [user?.email]
  );

  // 7. Auth0 Universal Login
  const loginWithAuth0 = useCallback(() => {
    const domain = auth0Domain || "dev-r2pn0p5oac54ej5y.us.auth0.com";
    const clientId = auth0ClientId || "9XNj49jmScArNeqmyTxxcS6Idvikx97M";

    if (domain && clientId) {
      const redirectUri = window.location.origin;
      const authUrl = `https://${domain}/authorize?client_id=${encodeURIComponent(
        clientId
      )}&response_type=token%20id_token&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=openid%20profile%20email&nonce=${Math.random().toString(36).substring(7)}`;

      window.location.href = authUrl;
    }
  }, [auth0Domain, auth0ClientId]);

  // 8. Auth0 Google OAuth Direct
  const loginWithGoogle = useCallback(() => {
    const domain = auth0Domain || "dev-r2pn0p5oac54ej5y.us.auth0.com";
    const clientId = auth0ClientId || "9XNj49jmScArNeqmyTxxcS6Idvikx97M";

    if (domain && clientId) {
      const redirectUri = window.location.origin;
      const authUrl = `https://${domain}/authorize?client_id=${encodeURIComponent(
        clientId
      )}&response_type=token%20id_token&connection=google-oauth2&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=openid%20profile%20email&nonce=${Math.random().toString(36).substring(7)}`;

      window.location.href = authUrl;
    }
  }, [auth0Domain, auth0ClientId]);

  // 9. Sign Out
  const logout = useCallback(() => {
    if (user?.email) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
  }, [user?.email]);

  const isAuthenticated = !!user;
  const isAdmin = !!user && user.role === "ADMIN";
  const isPermitted = !!user && (user.status === "APPROVED" || isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isPermitted,
        isAdmin,
        auth0Domain,
        auth0ClientId,
        login,
        signup,
        loginAsAdmin,
        loginAsDemoUser,
        loginAsPendingUser,
        loginWithAuth0,
        loginWithGoogle,
        requestAccess,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
