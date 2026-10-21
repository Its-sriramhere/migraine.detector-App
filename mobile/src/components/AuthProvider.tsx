import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "../hooks/useAuth";
import { clearToken, getToken } from "../services/api";
import { logout as apiLogout } from "../services/authService";
import { getMe } from "../services/userService";
import type { User } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await getMe());
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(refreshUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, signOut, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
