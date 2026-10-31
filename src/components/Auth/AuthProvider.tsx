'use client';

import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** `true` until the session check on load finishes */
  loading: boolean;
  /** `credential` is the Google ID token from Google Identity Services */
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoginOpen: boolean;
  /** Opens the login modal; `onLogin` runs once the visitor signs in from it */
  openLogin: (onLogin?: () => void) => void;
  closeLogin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const onLoginRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // The session is an HttpOnly cookie set by the API; 401 means an anonymous visitor
    apiFetch<{ user: User }>('/me')
      .then(({ user: me }) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    loginWithGoogle: async (credential) => {
      const { user: apiUser } = await apiFetch<{ user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      setUser(apiUser);
      setIsLoginOpen(false);
      onLoginRef.current?.();
      onLoginRef.current = null;
    },
    logout: async () => {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch {
        // Log out locally even if the API could not be reached
      } finally {
        setUser(null);
      }
    },
    isLoginOpen,
    openLogin: (onLogin) => {
      onLoginRef.current = onLogin ?? null;
      setIsLoginOpen(true);
    },
    closeLogin: () => {
      onLoginRef.current = null;
      setIsLoginOpen(false);
    },
  }), [user, loading, isLoginOpen]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="pt-BR">
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');

  return context;
}
