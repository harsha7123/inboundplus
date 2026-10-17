/* "Continue with Google / Microsoft" buttons.
   Asks Supabase which providers are enabled, so a button only works once that provider is set up
   (Supabase → Authentication → Sign In / Providers). See AUTH_SETUP.md. */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useIsland } from "../context/IslandContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
    <path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

// Microsoft can be re-enabled by adding { id: "azure", label: "Microsoft", Logo: MicrosoftLogo } (see AUTH_SETUP.md).
const PROVIDERS = [
  { id: "google", label: "Google", Logo: GoogleLogo },
];

export default function SocialLogin({ action = "Continue" }) {
  const auth = useAuth();
  const island = useIsland();
  const [enabled, setEnabled] = useState({});
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!auth.enabled || !SUPABASE_URL) return;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
      .then((r) => r.json()).then((s) => setEnabled(s.external || {})).catch(() => {});
  }, [auth.enabled]);

  const go = async (p) => {
    if (!auth.enabled) return island.notify("Demo mode: social login needs Supabase", { icon: "x" });
    if (!enabled[p.id]) return island.notify(`${p.label} login isn't set up yet (see AUTH_SETUP.md)`, { icon: "x" });
    setBusy(p.id);
    try { await auth.signInWithProvider(p.id); }
    catch (e) { island.notify(e.message, { icon: "x" }); setBusy(null); }
  };

  return (
    <div className="social-login">
      {PROVIDERS.map((p) => (
        <button key={p.id} type="button" className={`btn btn-ghost social-btn ${enabled[p.id] ? "" : "off"}`} onClick={() => go(p)} disabled={busy === p.id}
          title={enabled[p.id] ? `${action} with ${p.label}` : `${p.label} login not set up yet`}>
          <p.Logo />{busy === p.id ? "Redirecting…" : `${action} with ${p.label}`}
        </button>
      ))}
      <div className="divider">or use email</div>
    </div>
  );
}
