import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const mountedRef = useRef(true);

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
    mountedRef.current = true;

    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        
        // Synchronously update session/user state only
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (!newSession?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // IMPORTANT: Defer Supabase API calls to avoid deadlock
        // per Supabase docs - don't make sync calls in onAuthStateChange
        setTimeout(async () => {
          if (!mountedRef.current) return;
          const admin = await checkAdminRole(newSession.user.id);
          if (mountedRef.current) {
            setIsAdmin(admin);
            setLoading(false);
          }
        }, 0);
      }
    );

    // 2. Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mountedRef.current) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const admin = await checkAdminRole(existingSession.user.id);
        if (mountedRef.current) setIsAdmin(admin);
      }
      if (mountedRef.current) setLoading(false);
    }).catch(() => {
      if (mountedRef.current) setLoading(false);
    });

    // 3. Safety timeout
    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 5000);

    return () => {
      mountedRef.current = false;
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
