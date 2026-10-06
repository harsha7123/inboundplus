/* Small shared helpers */

export const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n)));
export const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
export const pct = (a, b) => ((a - b) / b) * 100;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const initials = (n) =>
  String(n || "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "U";
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** localStorage wrapper that never throws (private mode, blocked storage). */
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("ip_" + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem("ip_" + key, JSON.stringify(val)); } catch { /* ignore */ } },
  del(key) { try { localStorage.removeItem("ip_" + key); } catch { /* ignore */ } },
};

/** Brand colours (from inboundplus.agency). */
export const C = {
  ink: "#0c1115", orange: "#f26b35", purple: "#5551d3", sky: "#008fff", peach: "#fdc9ad",
  green: "#16a34a", red: "#dc2626", amber: "#d97706", gray: "#94a3b8", grid: "#eef1f6",
};
export const PALETTE = [C.orange, C.purple, C.sky, C.ink, C.peach, C.gray];
export const PALETTE_HEX = [0xf26b35, 0x5551d3, 0x008fff, 0x0c1115, 0xfdc9ad, 0x94a3b8];
