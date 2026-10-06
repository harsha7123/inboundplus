import { createContext, useCallback, useContext, useEffect, useState } from "react";
import D from "../data";
import { store } from "../lib/utils";

/* Client-portal working state (tasks, files, messages…), persisted in localStorage.
   Swap this for Supabase tables when moving to real data. */

const initial = () => ({
  tasks: D.tasks, files: D.files, threads: D.threads, agents: D.agents, deployments: D.deployments,
  reports: D.reports, survey: D.survey.results, requests: [], team: null, readNotifs: false,
  integrations: { GA4: true, Shopify: true, HubSpot: true, "Meta Ads": true, "Google Ads": true, "Search Console": true, WhatsApp: false, "SAP Business One": false },
  notifs: { weekly: true, deploy: true, approvals: true, invoices: false },
});

const PortalCtx = createContext(null);

export function PortalProvider({ children }) {
  const [state, setState] = useState(() => ({ ...initial(), ...store.get("state", {}) }));
  useEffect(() => { store.set("state", state); }, [state]);
  /** update("files", files => [...]) or update({ key: value }) */
  const update = useCallback((key, fn) => {
    setState((s) => (typeof key === "object" ? { ...s, ...key } : { ...s, [key]: typeof fn === "function" ? fn(s[key]) : fn }));
  }, []);
  return <PortalCtx.Provider value={{ state, update }}>{children}</PortalCtx.Provider>;
}

export const usePortal = () => useContext(PortalCtx);
