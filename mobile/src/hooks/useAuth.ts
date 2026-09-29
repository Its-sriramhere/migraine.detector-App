import { createContext, useCallback, useContext, useMemo } from "react";
import type { User } from "../types";

export interface AuthState {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User | null) => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {},
  setUser: () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useAuthActions() {
  const ctx = useContext(AuthContext);
  const refreshUser = useCallback(() => ctx.refreshUser(), [ctx]);
  const signOut = useCallback(() => ctx.signOut(), [ctx]);
  return useMemo(() => ({ refreshUser, signOut }), [refreshUser, signOut]);
}
