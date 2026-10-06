/* Supabase settings — Supabase dashboard → Project Settings → API.
   The anon (public) key is safe to ship in front-end code; access is controlled by Row Level Security.
   Leave both empty to run in local demo mode (accounts stored only in the browser). */
window.IP_CONFIG = {
  SUPABASE_URL: "https://pnagluwtfgnumtiykhzw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_UDWJYqWo-tKtPrlwpwynzw_9hysj8Wh", // publishable (public) key
  ALLOW_DEMO: true,       // show "Explore the demo client account" button
};
