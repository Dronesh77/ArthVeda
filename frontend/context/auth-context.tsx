import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';

import { postJsonAuth } from '@/lib/api';
import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
      if (!next) return;
      void (async () => {
        try {
          const token = await next.getIdToken();
          await postJsonAuth('/auth/sync', {}, token);
        } catch {
          // Sync failures should not block local auth state.
        }
      })();
    });
    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout: async () => {
        await signOut(auth);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
