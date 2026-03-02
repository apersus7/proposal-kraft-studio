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
    const isNetworkError = (err: any) => {
      const message = String(err?.message || '').toLowerCase();
      return (
        err?.name === 'AuthRetryableFetchError' ||
        err?.status === 0 ||
        message.includes('failed to fetch') ||
        message.includes('network')
      );
    };

    try {
      let { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // One quick retry for transient preview-network hiccups
      if (error && isNetworkError(error)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const retry = await supabase.auth.signInWithPassword({ email, password });
        error = retry.error;
      }

      if (error) {
        toast({
          title: "Sign in failed",
          description: isNetworkError(error)
            ? "Network issue detected. Please retry in a few seconds or use the published app URL."
            : error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: isNetworkError(error)
          ? "Network issue detected. Please retry in a few seconds or use the published app URL."
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