import { useState } from "react";
import Icon from "../../components/Icon";
import { Chips, PageHead, Tilt } from "../../components/ui";
import { AGENT_CATALOG } from "../../data/agency";
import { useTable } from "../../lib/useData";
import { AgentsSection } from "./agencySections";

const GROUPS = ["All", "Client stores", "InboundPlus delivery", "InboundPlus growth"];

export default function Agents() {
  const deployments = useTable("agent_deployments", null).rows;
  const [group, setGroup] = useState("All");
  const [req, setReq] = useState(null);
  const used = (key) => deployments.filter((d) => d.agent_key === key);

  return (
    <>
      <PageHead title="AI agents" sub="The InboundPlus agent catalogue and every deployment across clients." />
      <AgentsSection orgId={null} title="Deployments across clients" deployRequest={req} />
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Agent catalogue</h3>
        <Chips options={GROUPS} value={group} onChange={setGroup} align="flex-start" />
        <div className="grid g-3">
          {AGENT_CATALOG.filter((a) => group === "All" || a.group === group).map((a) => {
            const u = used(a.key);
            return (
              <Tilt key={a.key} className="panel agent-card">
                <div className="flex between"><span className="agent-ico lg"><Icon name={a.icon} size={20} /></span><span className="badge gray">{a.group}</span></div>
                <div><b>{a.name}</b><p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.summary}</p></div>
                <div className="flex between" style={{ marginTop: "auto" }}>
                  <small className="muted">{u.length ? `${u.filter((d) => d.status === "Live").length} live · ${u.length} client${u.length > 1 ? "s" : ""}` : "Not deployed yet"}</small>
                  <button className="btn btn-sm btn-primary" onClick={() => setReq({ key: a.key, n: Date.now() })}>Deploy</button>
                </div>
              </Tilt>
            );
          })}
        </div>
      </div>
    </>
  );
}
