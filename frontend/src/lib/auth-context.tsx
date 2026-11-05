"use client";

/**
 * SkinSafe Auth Context.
 * Wraps the application with Supabase session state.
 * Core chemistry analysis remains accessible to unauthenticated users.
 * Provides configuration status to avoid silently hiding login features.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: false,
  authError: null,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Load active session from storage
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn("[SkinSafe Auth] Session error:", error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.warn("[SkinSafe Auth] getSession error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Subscribe to future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      setAuthError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (!supabase) {
      setAuthError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
      );
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to initiate Google sign-in.");
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign out.");
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        authError,
        isConfigured: configured,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
