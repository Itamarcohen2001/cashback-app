import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppUser } from "@/lib/types";
import * as auth from "@/lib/auth";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
    const unsub = auth.onAuthChange((u) => setUser(u));
    return unsub;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        await auth.signIn(email, password);
        setUser(await auth.getCurrentUser());
      },
      async signUp(email, password, fullName) {
        await auth.signUp(email, password, fullName);
        setUser(await auth.getCurrentUser());
      },
      async signInWithGoogle() {
        await auth.signInWithGoogle();
        setUser(await auth.getCurrentUser());
      },
      async signOut() {
        await auth.signOut();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
