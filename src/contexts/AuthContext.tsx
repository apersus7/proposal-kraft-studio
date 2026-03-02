import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Timeout: stop blocking the UI after 3 seconds even if auth is stuck
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      // If getSession fails (e.g. stale refresh token, network down), stop loading
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name || ''
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "Please check your email for the confirmation link."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const isFetchFailure = (err: any) => {
      const msg = String(err?.message || '').toLowerCase();
      return (
        msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('network') ||
        msg.includes('timed out') ||
        err?.status === 0
      );
    };

    const withTimeout = async <T,>(promise: Promise<T>, ms = 9000): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), ms)
        ),
      ]);
    };

    const clearLocalAuthArtifacts = () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      if (!projectId) return;
      const prefix = `sb-${projectId}-`;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) localStorage.removeItem(key);
      });
    };

    try {
      await withTimeout(supabase.auth.signOut({ scope: 'local' }), 1200).catch(() => undefined);
      clearLocalAuthArtifacts();

      const initialResult = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        9000
      );
      let signInError: any = initialResult.error;

      // Fallback: direct auth endpoint call, then set session manually
      if (signInError && isFetchFailure(signInError)) {
        const authUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`;
        const authRes = await withTimeout(
          fetch(authUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ email, password }),
          }),
          9000
        );

        if (authRes.ok) {
          const tokenData = await authRes.json();
          const access_token = tokenData?.access_token as string | undefined;
          const refresh_token = tokenData?.refresh_token as string | undefined;

          if (access_token && refresh_token) {
            const setSessionResult = await withTimeout(
              supabase.auth.setSession({ access_token, refresh_token }),
              6000
            );
            signInError = setSessionResult.error;
          } else {
            signInError = new Error('Missing session tokens in auth response');
          }
        } else {
          const authError = await authRes.json().catch(() => ({}));
          signInError = new Error(authError?.msg || authError?.error_description || authError?.error || 'Sign in failed');
        }
      }

      if (signInError) {
        toast({
          title: "Sign in failed",
          description: isFetchFailure(signInError)
            ? "Temporary sign-in connection issue. Please try again."
            : signInError.message,
          variant: "destructive"
        });
        return { error: signInError };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: isFetchFailure(error)
          ? "Temporary sign-in connection issue. Please try again."
          : error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear state immediately to prevent race conditions
      setUser(null);
      setSession(null);
      
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
    {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};