/* Auth layer: Supabase when configured (assets/js/config.js), otherwise local demo mode. */
(function () {
  const cfg = window.IP_CONFIG || {};
  const sb = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const initials = (n) => String(n || "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "U";
  const base = () => location.href.replace(/[^/]*([?#].*)?$/, "");

  function fromUser(u) {
    const m = u.user_metadata || {};
    const name = m.full_name || m.name || u.email.split("@")[0];
    return { id: u.id, email: u.email, name, initials: initials(name), company: m.company || "Your company", platform: m.platform || "", goal: m.goal || "", isNew: !m.onboarded };
  }

  IP.auth = {
    enabled: !!sb,
    client: sb,
    initials,

    /* Returns the portal session object, or null when signed out. */
    async current() {
      const local = IP.store.get("session", null);
      if (local && local.demo) return local;
      if (!sb) return local;
      const { data } = await sb.auth.getSession();
      return data.session ? fromUser(data.session.user) : null;
    },

    async signIn(email, password) {
      if (!sb) {
        const u = IP.store.get("users", {})[email.toLowerCase()];
        const name = u ? u.name : email.split("@")[0].replace(/[._]/g, " ");
        const s = { email, name, initials: initials(name), company: u ? u.company : "Your company", platform: u ? u.platform : "", local: true };
        IP.store.set("session", s);
        return s;
      }
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      IP.store.del("session");
      return fromUser(data.user);
    },

    /* Returns { session } when signed in immediately, or { confirm: true } when email confirmation is required. */
    async signUp({ email, password, name, company, platform, goal, site }) {
      if (!sb) {
        const users = IP.store.get("users", {});
        users[email.toLowerCase()] = { name, company, platform, goal, site };
        IP.store.set("users", users);
        const s = { email, name, initials: initials(name), company, platform, isNew: true, local: true };
        IP.store.set("session", s);
        return { session: s };
      }
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name, company, platform, goal, website: site }, emailRedirectTo: base() + "portal.html" },
      });
      if (error) throw error;
      IP.store.del("session");
      return data.session ? { session: fromUser(data.user) } : { confirm: true };
    },

    async resetPassword(email) {
      if (!sb) return;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: base() + "login.html?mode=reset" });
      if (error) throw error;
    },

    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
    },

    async updateProfile(fields) {
      const s = IP.store.get("session", null);
      if (sb && !(s && s.demo)) {
        const { error } = await sb.auth.updateUser({ data: { full_name: fields.name, company: fields.company, onboarded: true } });
        if (error) throw error;
      } else if (s) {
        IP.store.set("session", Object.assign(s, fields, { initials: initials(fields.name) }));
      }
    },

    demo(company) {
      const s = { email: "demo@andesoutdoor.example", name: "Carla Mendoza", initials: "CM", company, platform: "Shopify", demo: true };
      IP.store.set("session", s);
      return s;
    },

    async signOut() {
      IP.store.del("session");
      if (sb) await sb.auth.signOut();
    },
  };
})();
