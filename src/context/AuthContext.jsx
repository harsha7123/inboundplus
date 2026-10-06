import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { initials, store } from "../lib/utils";

/* Auth: Supabase when configured, otherwise local demo mode.
   A "demo" session (sample client) is always available via demo(). */

const AuthCtx = createContext(null);

function fromUser(u) {
  const m = u.user_metadata || {};
  const name = m.full_name || m.name || u.email.split("@")[0];
  return { id: u.id, email: u.email, name, initials: initials(name), company: m.company || "Your company", platform: m.platform || "", goal: m.goal || "", isNew: !m.onboarded };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const local = store.get("session", null);
    if (local && (local.demo || !supabase)) { setSession(local); return; }
    if (!supabase) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? fromUser(data.session.user) : null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (store.get("session", null)?.demo) return;
      setSession(s ? fromUser(s.user) : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const base = () => window.location.origin;

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      const u = store.get("users", {})[email.toLowerCase()];
      const name = u ? u.name : email.split("@")[0].replace(/[._]/g, " ");
      const s = { email, name, initials: initials(name), company: u?.company || "Your company", platform: u?.platform || "", local: true };
      store.set("session", s); setSession(s); return s;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    store.del("session");
    const s = fromUser(data.user); setSession(s); return s;
  }, []);

  /** Returns { session } or { confirm: true } when email confirmation is required. */
  const signUp = useCallback(async ({ email, password, name, company, platform, goal, site }) => {
    if (!supabase) {
      const users = store.get("users", {});
      users[email.toLowerCase()] = { name, company, platform, goal, site };
      store.set("users", users);
      const s = { email, name, initials: initials(name), company, platform, isNew: true, local: true };
      store.set("session", s); setSession(s); return { session: s };
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, company, platform, goal, website: site }, emailRedirectTo: base() + "/portal" },
    });
    if (error) throw error;
    store.del("session");
    if (data.session) { const s = fromUser(data.user); setSession(s); return { session: s }; }
    return { confirm: true };
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: base() + "/login?mode=reset" });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovery(false);
  }, []);

  const updateProfile = useCallback(async ({ name, company }) => {
    const cur = store.get("session", null);
    if (supabase && !cur?.demo) {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, company, onboarded: true } });
      if (error) throw error;
    } else if (cur) store.set("session", { ...cur, name, company, initials: initials(name) });
    setSession((s) => ({ ...s, name, company, initials: initials(name), isNew: false }));
  }, []);

  const demo = useCallback((company) => {
    const s = { email: "demo@andesoutdoor.example", name: "Carla Mendoza", initials: "CM", company, platform: "Shopify", demo: true };
    store.set("session", s); setSession(s);
  }, []);

  const signOut = useCallback(async () => {
    const wasDemo = store.get("session", null)?.demo;
    store.del("session");
    if (supabase && !wasDemo) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    session, loading: session === undefined, enabled: !!supabase, recovery,
    signIn, signUp, resetPassword, updatePassword, updateProfile, demo, signOut,
  }), [session, recovery, signIn, signUp, resetPassword, updatePassword, updateProfile, demo, signOut]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
