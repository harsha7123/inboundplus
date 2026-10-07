import { useMemo } from "react";
import { clientHealth } from "./health";
import { useOrgs, useTable } from "./useData";

/** Everything the agency dashboards need, with per-client health and stats. */
export function useAgency() {
  const orgs = useOrgs();
  const files = useTable("files", null).rows;
  const requests = useTable("requests", null).rows;
  const messages = useTable("messages", null).rows;
  const tasks = useTable("onboarding_tasks", null).rows;
  const agents = useTable("agent_deployments", null).rows;
  const deployments = useTable("deployments", null).rows;

  const clients = useMemo(() => orgs.rows.map((o) => {
    const by = (rows) => rows.filter((r) => r.org_id === o.id);
    const t = by(tasks);
    const data = { files: by(files), requests: by(requests), messages: by(messages), tasks: t };
    return {
      ...o,
      mrr: Number(o.mrr) || 0,
      health: clientHealth(o, data),
      onboarding: t.length ? Math.round((t.filter((x) => x.done).length / t.length) * 100) : null,
      agentsLive: by(agents).filter((a) => a.status === "Live").length,
      agentsTotal: by(agents).length,
      openRequests: data.requests.filter((r) => r.status !== "Done").length,
      pendingApprovals: data.files.filter((f) => f.status === "Needs approval").length,
    };
  }), [orgs.rows, files, requests, messages, tasks, agents]);

  return { loading: orgs.loading, clients, files, requests, messages, tasks, agents, deployments };
}
