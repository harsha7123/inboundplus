import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dbFor, onChange } from "./db";

/** The data adapter for the signed-in user (Supabase or local demo). */
export function useDb() {
  const { session } = useAuth();
  return dbFor(session);
}

/** Generic async loader that re-runs when any of `tables` change. */
function useLoader(load, tables, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const run = useCallback(() => {
    let live = true;
    load().then((d) => live && (setData(d), setError(null))).catch((e) => live && (setError(e), setData((x) => x ?? [])));
    return () => { live = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => run(), [run]);
  useEffect(() => onChange((t) => { if (t === "*" || tables.includes(t)) run(); }), [run]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, rows: data || [], loading: data === null, error, reload: run };
}

/** Rows of one table, optionally for one organization (null = all, admin only). */
export function useTable(table, orgId) {
  const db = useDb();
  return useLoader(() => (orgId === undefined ? Promise.resolve([]) : db.list(table, orgId)), [table], [db, table, orgId]);
}

export function useOrgs() {
  const db = useDb();
  return useLoader(() => db.listOrgs(), ["organizations"], [db]);
}

export function useUsers() {
  const db = useDb();
  return useLoader(() => db.listUsers(), ["users", "organizations"], [db]);
}

/* Date helpers for rows */
export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
export function ago(s) {
  if (!s) return "";
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : d < 7 ? `${d} days ago` : fmtDate(s);
}
