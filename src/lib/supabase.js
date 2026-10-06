import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Supabase client, or null when env vars are missing (app then runs in local demo mode). */
export const supabase = url && key ? createClient(url, key) : null;
export const ALLOW_DEMO = import.meta.env.VITE_ALLOW_DEMO !== "false";
