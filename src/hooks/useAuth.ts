import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) {
        console.error("has_role RPC error:", error.message);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error("has_role exception:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialResolved = false;

    // 1. Set up auth state listener FIRST (per Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const admin = await checkAdminRole(newSession.user.id);
          if (mounted) setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
        if (mounted) {
          initialResolved = true;
          setLoading(false);
        }
      }
    );

    // 2. Then check for existing session (fallback)
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted || initialResolved) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const admin = await checkAdminRole(existingSession.user.id);
        if (mounted) setIsAdmin(admin);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted && !initialResolved) setLoading(false);
    });

    // 3. Safety timeout
    const timeout = setTimeout(() => {
      if (mounted && !initialResolved) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, isAdmin, signIn, signOut };
}
