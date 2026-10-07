/* Client health score (0-100) from delivery signals, as used in agency retention dashboards.
   Bands: Healthy ≥ 75, Watch 50-74, At risk < 50. */

const DAY = 864e5;
const older = (iso, days) => iso && Date.now() - new Date(iso).getTime() > days * DAY;

export function clientHealth(org, { files = [], requests = [], messages = [], tasks = [] }) {
  const reasons = [];
  let score = 100;

  const stale = files.filter((f) => f.status === "Needs approval" && older(f.created_at, 3));
  if (stale.length) { score -= Math.min(30, 15 * stale.length); reasons.push(`${stale.length} approval${stale.length > 1 ? "s" : ""} waiting > 3 days`); }

  const slow = requests.filter((r) => r.status !== "Done" && older(r.created_at, 5));
  if (slow.length) { score -= Math.min(30, 10 * slow.length); reasons.push(`${slow.length} request${slow.length > 1 ? "s" : ""} open > 5 days`); }

  const lastAgency = messages.filter((m) => m.sender_role === "agency").map((m) => m.created_at).sort().pop();
  const lastClient = messages.filter((m) => m.sender_role === "client").map((m) => m.created_at).sort().pop();
  if (lastClient && (!lastAgency || lastAgency < lastClient) && older(lastClient, 1)) { score -= 15; reasons.push("Client message waiting for a reply"); }
  if (!lastAgency || older(lastAgency, 14)) { score -= 10; reasons.push("No contact from the team in 14+ days"); }

  if (org.stage && org.stage !== "Live" && older(org.created_at, 30)) { score -= 15; reasons.push(`Onboarding still at “${org.stage}” after 30+ days`); }
  if (tasks.length && org.stage === "Live" && tasks.some((t) => !t.done)) { score -= 5; reasons.push("Onboarding checklist not finished"); }
  if (org.status === "Paused") { score -= 25; reasons.push("Account paused"); }
  const toRenewal = org.renewal_date ? new Date(org.renewal_date) - Date.now() : Infinity;
  if (toRenewal > 0 && toRenewal < 30 * DAY) reasons.push("Renewal within 30 days");

  score = Math.max(0, Math.min(100, score));
  const band = score >= 75 ? "Healthy" : score >= 50 ? "Watch" : "At risk";
  return { score, band, reasons };
}

export const HEALTH_TONE = { Healthy: "green", Watch: "amber", "At risk": "red" };
