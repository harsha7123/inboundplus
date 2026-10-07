import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEMO_ORG, localDb } from "../lib/db";
import { initials, store } from "../lib/utils";

/* Auth: Supabase when configured, otherwise local demo mode.
   session = { id, email, name, initials, company, role: "admin" | "client", orgId, demo?, local? }
   Demo sessions (client or admin) always run on local sample data. */

const AuthCtx = createContext(null);

async function fromUser(u) {
  const m = u.user_metadata || {};
  let profile = null;
  try {
    const { data } = await supabase.from("profiles").select("role, org_id, full_name, company").eq("id", u.id).maybeSingle();
    profile = data;
  } catch { /* profiles table not created yet */ }
  const name = profile?.full_name || m.full_name || m.name || u.email.split("@")[0];
  return {
    id: u.id, email: u.email, name, initials: initials(name),
    company: profile?.company || m.company || "Your company", platform: m.platform || "", goal: m.goal || "",
    role: profile?.role === "admin" ? "admin" : "client", orgId: profile?.org_id || null, isNew: !m.onboarded,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const local = store.get("session", null);
    if (local && (local.demo || !supabase)) { setSession(local); return; }
    if (!supabase) { setSession(null); return; }
    let live = true;
    supabase.auth.getSession().then(async ({ data }) => { const s = data.session ? await fromUser(data.session.user) : null; if (live) setSession(s); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (store.get("session", null)?.demo) return;
      if (event === "SIGNED_OUT") setSession(null);
      else if (s && (event === "SIGNED_IN" || event === "USER_UPDATED")) setTimeout(() => fromUser(s.user).then((x) => live && setSession(x)), 0);
    });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);

  const base = () => window.location.origin;

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      const users = await localDb.listUsers();
      const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
      const name = u?.full_name || email.split("@")[0].replace(/[._]/g, " ");
      const role = u?.role === "admin" ? "admin" : "client";
      const orgId = role === "admin" ? null : u?.org_id || (await localDb.ensureLocalClient({ email, name, company: "Your company" }));
      const s = { email, name, initials: initials(name), company: "Your company", role, orgId, local: true };
      store.set("session", s); setSession(s); return s;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    store.del("session");
    const s = await fromUser(data.user); setSession(s); return s;
  }, []);

  /** Returns { session } or { confirm: true } when email confirmation is required. */
  const signUp = useCallback(async ({ email, password, name, company, platform, goal, site }) => {
    if (!supabase) {
      const orgId = await localDb.ensureLocalClient({ email, name, company, platform });
      const s = { email, name, initials: initials(name), company, platform, role: "client", orgId, isNew: true, local: true };
      store.set("session", s); setSession(s); return { session: s };
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, company, platform, goal, website: site }, emailRedirectTo: base() + "/portal" },
    });
    if (error) throw error;
    store.del("session");
    if (data.session) { const s = await fromUser(data.user); setSession(s); return { session: s }; }
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
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, company, onboarded: true } });
      if (error) throw error;
      if (u?.user) await supabase.from("profiles").update({ full_name: name, company }).eq("id", u.user.id);
    } else if (cur) store.set("session", { ...cur, name, company, initials: initials(name) });
    setSession((s) => ({ ...s, name, company, initials: initials(name), isNew: false }));
  }, []);

  /** Demo accounts: kind = "client" | "admin". */
  const demo = useCallback((kind = "client") => {
    const s = kind === "admin"
      ? { email: "team@inboundplus.example", name: "InboundPlus Admin", initials: "IP", company: "InboundPlus", role: "admin", orgId: null, demo: true }
      : { email: "demo@andesoutdoor.example", name: "Carla Mendoza", initials: "CM", company: "Andes Outdoor Co.", platform: "Shopify", role: "client", orgId: DEMO_ORG, demo: true };
    store.set("session", s); setSession(s); return s;
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
export const homeFor = (s) => (s?.role === "admin" ? "/admin" : "/portal");
