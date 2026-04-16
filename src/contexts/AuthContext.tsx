import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { setAuthToken, getAuthToken } from "@/lib/authToken";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (companyName: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Bumps when login/register succeeds so a stale /auth/me response from before sign-in cannot clear the new token. */
  const authEpochRef = useRef(0);

  const refreshUser = useCallback(async () => {
    const epoch = authEpochRef.current;
    try {
      const headers: HeadersInit = {};
      const t = getAuthToken();
      if (t) headers["Authorization"] = `Bearer ${t}`;
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers,
      });
      if (epoch !== authEpochRef.current) return;
      if (res.ok) {
        const data = (await res.json()) as { user?: AuthUser | null };
        const u = data.user ?? null;
        setUser(u);
        if (!u) setAuthToken(null);
      } else {
        setAuthToken(null);
        setUser(null);
      }
    } catch {
      if (epoch !== authEpochRef.current) return;
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
      authEpochRef.current += 1;
      setUser(data.user);
      if (data.token) setAuthToken(data.token); // fallback when cookies don't work
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const register = useCallback(
    async (companyName: string, email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, email, password }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.error || "Registration failed" };
        }
        authEpochRef.current += 1;
        setUser(data.user);
        if (data.token) setAuthToken(data.token); // fallback when cookies don't work
        return { ok: true };
      } catch (err) {
        return { ok: false, error: "Network error" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    authEpochRef.current += 1;
    setAuthToken(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
