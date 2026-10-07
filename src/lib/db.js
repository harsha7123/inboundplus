/* Data layer shared by the client portal and the admin portal.
   - remote: Supabase tables + "client-files" storage bucket (see supabase/schema.sql)
   - local:  browser storage, used by the demo accounts (works without any backend)
   Both adapters expose the same async API. */

import { supabase } from "./supabase";
import D from "../data";
import { store } from "./utils";

export const BUCKET = "client-files";
export const DEMO_ORG = "demo-andes";
const LOCAL_FILE_LIMIT = 1.5 * 1024 * 1024; // demo mode keeps small files in the browser

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const iso = (daysAgo = 0, h = 10) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, 0, 0, 0); return d.toISOString(); };
export const fileKind = (name) => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ext === "pdf" ? "pdf" : ["xls", "xlsx", "csv"].includes(ext) ? "xls" : ["mp4", "mov", "webm"].includes(ext) ? "mp4"
    : ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) ? "img" : ["doc", "docx", "txt", "md"].includes(ext) ? "doc" : "fig";
};
export const fileSize = (bytes) => (bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB");

/* ---------- change notifications (so every open view refreshes after a write) ---------- */
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (table) => listeners.forEach((fn) => fn(table));

/* =====================================================================
   LOCAL ADAPTER (demo)
   ===================================================================== */
function seed() {
  const A = DEMO_ORG, B = "demo-pacifico", C = "demo-ruta";
  return {
    organizations: [
      { id: A, name: "Andes Outdoor Co.", plan: "Commerce Growth Partner", platform: "Shopify", website: "andesoutdoor.example", status: "Active", created_at: iso(120) },
      { id: B, name: "Casa Pacífico Home", plan: "Ecommerce Growth Advisory", platform: "WooCommerce", website: "casapacifico.example", status: "Active", created_at: iso(60) },
      { id: C, name: "Ruta Bikes Perú", plan: "Ecommerce Growth Blueprint", platform: "VTEX", website: "rutabikes.example", status: "Onboarding", created_at: iso(9) },
    ],
    users: [
      { id: "u-admin", email: "team@inboundplus.example", full_name: "InboundPlus Admin", role: "admin", org_id: null, created_at: iso(200) },
      { id: "u-carla", email: "demo@andesoutdoor.example", full_name: "Carla Mendoza", role: "client", org_id: A, created_at: iso(120) },
      { id: "u-diego", email: "diego@andesoutdoor.example", full_name: "Diego Paredes", role: "client", org_id: A, created_at: iso(100) },
      { id: "u-sofia", email: "sofia@casapacifico.example", full_name: "Sofía Rivas", role: "client", org_id: B, created_at: iso(60) },
      { id: "u-mateo", email: "mateo@rutabikes.example", full_name: "Mateo Quispe", role: "client", org_id: C, created_at: iso(9) },
    ],
    files: [
      ...D.files.map((f, i) => ({ id: uid(), org_id: A, name: f.name, size: f.size, kind: f.type, path: null, status: f.status, uploaded_by: f.by, created_at: iso(i * 3 + 1) })),
      { id: uid(), org_id: B, name: "Home_Collection_Banner.fig", size: "6.1 MB", kind: "fig", status: "Needs approval", uploaded_by: "Creative team", created_at: iso(2) },
      { id: uid(), org_id: C, name: "Onboarding_Checklist.pdf", size: "220 KB", kind: "pdf", status: "Shared", uploaded_by: "InboundPlus", created_at: iso(8) },
    ],
    reports: [
      ...D.reports.map((r, i) => ({ id: uid(), org_id: A, name: r.name, type: r.type, summary: null, path: null, created_at: iso([3, 5, 18, 32, 45][i] ?? i * 10) })),
      { id: uid(), org_id: B, name: "September 2026 Performance Report", type: "Monthly", summary: "Organic sessions +12%, ROAS 3.9×.", created_at: iso(4) },
    ],
    deployments: [
      ...D.deployments.map((d, i) => ({ id: uid(), org_id: A, app: d.app, env: d.env, version: d.version, status: d.status, notes: d.notes, by_name: d.by, created_at: iso([0, 1, 3, 4, 7][i] ?? i, 9 + i) })),
      { id: uid(), org_id: B, app: "Storefront (WooCommerce)", env: "Production", version: "v1.6.0", status: "success", notes: "New home collection pages", by_name: "Web team", created_at: iso(2) },
    ],
    projects: [
      ...D.projects.map((p, i) => ({ id: uid(), org_id: A, name: p.name, type: p.type, progress: p.progress, status: p.status, due: p.due, created_at: iso(40 - i * 5) })),
      { id: uid(), org_id: B, name: "SEO content sprint – Home & Deco", type: "SEO", progress: 35, status: "On track", due: "Nov 20, 2026", created_at: iso(20) },
      { id: uid(), org_id: C, name: "Ecommerce Growth Blueprint", type: "Strategy", progress: 15, status: "On track", due: "Oct 30, 2026", created_at: iso(8) },
    ],
    requests: [
      { id: uid(), org_id: A, title: "Black Friday landing page", type: "E-commerce", notes: "Need it live by Nov 20.", status: "In review", created_by: "Carla Mendoza", created_at: iso(1) },
      { id: uid(), org_id: B, title: "Add WhatsApp chat to the store", type: "AI Agent", notes: "", status: "New", created_by: "Sofía Rivas", created_at: iso(0, 8) },
    ],
    messages: [
      { id: uid(), org_id: A, sender_role: "agency", sender_name: "Lucía Ramos", body: "Hi! The September report is ready in Reports. Revenue is up 18% vs August 🎉", created_at: iso(0, 9) },
      { id: uid(), org_id: A, sender_role: "agency", sender_name: "Lucía Ramos", body: "Could you also approve the new homepage hero in Files when you have a minute?", created_at: iso(0, 9) },
      { id: uid(), org_id: B, sender_role: "client", sender_name: "Sofía Rivas", body: "Hello team, can we review the banner tomorrow?", created_at: iso(0, 8) },
    ],
  };
}

const local = {
  kind: "local",
  _db() { let db = store.get("db", null); if (!db || !db.organizations) { db = seed(); store.set("db", db); } return db; },
  _save(db, table) { store.set("db", db); emit(table); },

  async listOrgs() { return [...this._db().organizations]; },
  async getOrg(id) { return this._db().organizations.find((o) => o.id === id) || null; },
  async createOrg(o) { const db = this._db(); const row = { id: uid(), status: "Active", created_at: new Date().toISOString(), ...o }; db.organizations.unshift(row); this._save(db, "organizations"); return row; },
  async updateOrg(id, patch) { const db = this._db(); db.organizations = db.organizations.map((o) => (o.id === id ? { ...o, ...patch } : o)); this._save(db, "organizations"); },

  async list(table, orgId) {
    const rows = this._db()[table] || [];
    return (orgId ? rows.filter((r) => r.org_id === orgId) : [...rows]).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  async insert(table, row) { const db = this._db(); const r = { id: uid(), created_at: new Date().toISOString(), ...row }; db[table] = [r, ...(db[table] || [])]; this._save(db, table); return r; },
  async update(table, id, patch) { const db = this._db(); db[table] = db[table].map((r) => (r.id === id ? { ...r, ...patch } : r)); this._save(db, table); },
  async remove(table, id) { const db = this._db(); db[table] = db[table].filter((r) => r.id !== id); this._save(db, table); },

  /** Upload a file; table = "files" | "reports". extra = other columns. */
  async upload(table, orgId, file, extra = {}) {
    let data_url = null;
    if (file.size <= LOCAL_FILE_LIMIT) data_url = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
    const base = table === "files" ? { name: file.name, size: fileSize(file.size), kind: fileKind(file.name) } : {};
    return this.insert(table, { org_id: orgId, path: data_url ? "local" : null, data_url, ...base, ...extra });
  },
  async fileUrl(row) { return row.data_url || null; },

  async listUsers() { return [...this._db().users]; },
  async updateUser(id, patch) { const db = this._db(); db.users = db.users.map((u) => (u.id === id ? { ...u, ...patch } : u)); this._save(db, "users"); },
  /** Register a locally-created client account (demo mode sign-up). */
  async ensureLocalClient({ email, name, company, platform }) {
    const db = this._db();
    let user = db.users.find((u) => u.email === email);
    if (user?.org_id) return user.org_id;
    const org = { id: uid(), name: company || email, plan: "Ecommerce Growth Advisory", platform, status: "Onboarding", created_at: new Date().toISOString() };
    db.organizations.unshift(org);
    if (user) user.org_id = org.id;
    else db.users.unshift({ id: uid(), email, full_name: name, role: "client", org_id: org.id, created_at: org.created_at });
    this._save(db, "organizations");
    return org.id;
  },
  reset() { store.del("db"); emit("*"); },
};

/* =====================================================================
   REMOTE ADAPTER (Supabase)
   ===================================================================== */
const must = ({ data, error }) => { if (error) throw error; return data; };

const remote = {
  kind: "remote",
  async listOrgs() { return must(await supabase.from("organizations").select("*").order("created_at", { ascending: false })); },
  async getOrg(id) { return must(await supabase.from("organizations").select("*").eq("id", id).maybeSingle()); },
  async createOrg(o) { const r = must(await supabase.from("organizations").insert(o).select().single()); emit("organizations"); return r; },
  async updateOrg(id, patch) { must(await supabase.from("organizations").update(patch).eq("id", id)); emit("organizations"); },

  async list(table, orgId) {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    if (orgId) q = q.eq("org_id", orgId);
    return must(await q);
  },
  async insert(table, row) { const r = must(await supabase.from(table).insert(row).select().single()); emit(table); return r; },
  async update(table, id, patch) { must(await supabase.from(table).update(patch).eq("id", id)); emit(table); },
  async remove(table, id) {
    const row = must(await supabase.from(table).select("path").eq("id", id).maybeSingle());
    must(await supabase.from(table).delete().eq("id", id));
    if (row?.path) await supabase.storage.from(BUCKET).remove([row.path]);
    emit(table);
  },

  async upload(table, orgId, file, extra = {}) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${orgId}/${uid()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw error;
    const base = table === "files" ? { name: file.name, size: fileSize(file.size), kind: fileKind(file.name) } : {};
    return this.insert(table, { org_id: orgId, path, ...base, ...extra });
  },
  async fileUrl(row) {
    if (!row.path) return null;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  },

  async listUsers() { return must(await supabase.from("profiles").select("*").order("created_at", { ascending: false })); },
  async updateUser(id, patch) { must(await supabase.from("profiles").update(patch).eq("id", id)); emit("users"); },
};

/** Pick the adapter for a session: real Supabase accounts use remote, demo/local accounts use local. */
export function dbFor(session) {
  return supabase && session && !session.demo && !session.local ? remote : local;
}
export const localDb = local;
