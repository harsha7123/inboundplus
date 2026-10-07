/* Data layer shared by the client portal and the admin portal.
   - remote: Supabase tables + "client-files" storage bucket (see supabase/schema.sql)
   - local:  browser storage, used by the demo accounts (works without any backend)
   Both adapters expose the same async API. */

import { supabase } from "./supabase";
import { ONBOARDING_TEMPLATE } from "../data/agency";
import { SAMPLE_USERS, buildSampleAgency, isSampleOrg } from "../data/sampleAgency";
import { store } from "./utils";

export const BUCKET = "client-files";
export const DEMO_ORG = "demo-andes";
const SAMPLE_TABLES = ["onboarding_tasks", "agent_deployments", "files", "reports", "deployments", "projects", "requests", "messages"];
const LOCAL_FILE_LIMIT = 1.5 * 1024 * 1024; // demo mode keeps small files in the browser

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
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
  const S = buildSampleAgency();
  const idOf = (key) => (key === "andes" ? DEMO_ORG : `demo-${key}`);
  const db = { organizations: S.organizations.map(({ key, ...o }) => ({ id: idOf(key), ...o })), users: SAMPLE_USERS(idOf) };
  for (const t of SAMPLE_TABLES) db[t] = S[t].map(({ org, ...r }) => ({ id: uid(), org_id: idOf(org), path: null, ...r }));
  return db;
}

const local = {
  kind: "local",
  _db() { let db = store.get("db_v3", null); if (!db || !db.organizations) { db = seed(); store.set("db_v3", db); } return db; },
  _save(db, table) { store.set("db_v3", db); emit(table); },

  async listOrgs() { return [...this._db().organizations]; },
  async getOrg(id) { return this._db().organizations.find((o) => o.id === id) || null; },
  async createOrg(o) { const db = this._db(); const row = { id: uid(), status: "Onboarding", stage: "Signed", created_at: new Date().toISOString(), ...o }; db.organizations.unshift(row); this._save(db, "organizations"); return row; },
  async updateOrg(id, patch) { const db = this._db(); db.organizations = db.organizations.map((o) => (o.id === id ? { ...o, ...patch } : o)); this._save(db, "organizations"); },
  async removeOrg(id) {
    const db = this._db();
    db.organizations = db.organizations.filter((o) => o.id !== id);
    for (const t of SAMPLE_TABLES) db[t] = (db[t] || []).filter((r) => r.org_id !== id);
    db.users = db.users.map((u) => (u.org_id === id ? { ...u, org_id: null } : u));
    this._save(db, "*");
  },

  async list(table, orgId) {
    const rows = this._db()[table] || [];
    return (orgId ? rows.filter((r) => r.org_id === orgId) : [...rows]).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  async insert(table, row) { const db = this._db(); const r = { id: uid(), created_at: new Date().toISOString(), ...row }; db[table] = [r, ...(db[table] || [])]; this._save(db, table); return r; },
  async insertMany(table, rows) { const db = this._db(); const now = new Date().toISOString(); db[table] = [...rows.map((r) => ({ id: uid(), created_at: now, ...r })), ...(db[table] || [])]; this._save(db, table); },
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
    const org = { id: uid(), name: company || email, plan: "Ecommerce Growth Advisory", mrr: 3000, platform, stage: "Signed", status: "Onboarding", created_at: new Date().toISOString() };
    db.organizations.unshift(org);
    if (user) user.org_id = org.id;
    else db.users.unshift({ id: uid(), email, full_name: name, role: "client", org_id: org.id, created_at: org.created_at });
    this._save(db, "organizations");
    return org.id;
  },
  reset() { store.del("db_v3"); emit("*"); },
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
  async removeOrg(id) { must(await supabase.from("organizations").delete().eq("id", id)); emit("*"); },

  async list(table, orgId) {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    if (orgId) q = q.eq("org_id", orgId);
    return must(await q);
  },
  async insert(table, row) { const r = must(await supabase.from(table).insert(row).select().single()); emit(table); return r; },
  async insertMany(table, rows) { must(await supabase.from(table).insert(rows)); emit(table); },
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

/** Load the sample agency dataset (10 fictional clients) into the current backend. Returns the number of clients added. */
export async function loadSampleData(db, onProgress = () => {}) {
  const S = buildSampleAgency();
  if (db.kind === "local") { db.reset(); onProgress(1); return S.organizations.length; } // demo: restore the original demo dataset
  const ids = {};
  for (let i = 0; i < S.organizations.length; i++) {
    const { key, ...o } = S.organizations[i];
    ids[key] = (await db.createOrg(o)).id;
    onProgress((i + 1) / (S.organizations.length + SAMPLE_TABLES.length));
  }
  for (let i = 0; i < SAMPLE_TABLES.length; i++) {
    const t = SAMPLE_TABLES[i];
    if (S[t].length) await db.insertMany(t, S[t].map(({ org, ...r }) => ({ org_id: ids[org], ...r })));
    onProgress((S.organizations.length + i + 1) / (S.organizations.length + SAMPLE_TABLES.length));
  }
  return S.organizations.length;
}

/** Remove every sample client (website ending in ".example") and all of its data. */
export async function removeSampleData(db) {
  const orgs = (await db.listOrgs()).filter(isSampleOrg);
  for (const o of orgs) await db.removeOrg(o.id);
  return orgs.length;
}

/** Create the default onboarding checklist for a client. */
export async function createChecklist(db, orgId) {
  await db.insertMany("onboarding_tasks", ONBOARDING_TEMPLATE.map(([section, title], i) => ({ org_id: orgId, section, title, position: i, done: false })));
}

/** Pick the adapter for a session: real Supabase accounts use remote, demo/local accounts use local. */
export function dbFor(session) {
  return supabase && session && !session.demo && !session.local ? remote : local;
}
export const localDb = local;
