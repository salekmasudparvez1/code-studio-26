import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || "";

async function requestUser(path: string, body?: object) {
  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Authentication request failed.");
  }

  return data.user as User;
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    isAuthenticated: auth0Authenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncedSub = useRef<string | null>(null);
  const auth0Domain = (import.meta.env.VITE_AUTH0_DOMAIN as string) || "";
  const auth0ClientId = (import.meta.env.VITE_AUTH0_CLIENT_ID as string) || "";

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await requestUser("me");
      setUser(currentUser);
    } catch (error) {
      setUser(null);

      if (
        error instanceof Error &&
        !error.message.includes("Not authenticated")
      ) {
        console.error("Could not refresh user:", error);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const currentUser = await requestUser("login", {
        email,
        password,
      });
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const currentUser = await requestUser("signup", {
          name,
          email,
          password,
        });
        setUser(currentUser);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    await loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
      appState: { returnTo: window.location.pathname },
    });
  }, [loginWithRedirect]);

  // Exchange the verified Auth0 access token for an app session.
  useEffect(() => {
    if (auth0Loading) return;

    if (!auth0Authenticated || !auth0User?.sub) {
      syncedSub.current = null;
      return;
    }

    if (syncedSub.current === auth0User.sub) return;

    let cancelled = false;
    const sub = auth0User.sub;

    (async () => {
      setIsLoading(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: AUTH0_AUDIENCE },
        });

        const response = await fetch(`${API_URL}/api/auth/google/session`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Google authentication failed.");
        }

        if (!cancelled) {
          setUser(data.user);
          syncedSub.current = sub;
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Google session setup failed:", error);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    auth0Authenticated,
    auth0Loading,
    auth0User?.sub,
    getAccessTokenSilently,
  ]);

  // Restore an existing backend session on initial load.
  useEffect(() => {
    if (auth0Loading) return;

    if (auth0Authenticated) {
      // The Google exchange effect owns this loading state.
      return;
    }

    let cancelled = false;

    requestUser("me")
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth0Authenticated, auth0Loading]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      syncedSub.current = null;

      if (auth0Authenticated) {
        auth0Logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
      }
    }
  }, [auth0Authenticated, auth0Logout]);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";
  const isPermitted = !!user && (user.status === "APPROVED" || isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || auth0Loading,
        isAuthenticated,
        isPermitted,
        isAdmin,
        auth0Domain,
        auth0ClientId,
        login,
        signup,
        loginWithGoogle,
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
