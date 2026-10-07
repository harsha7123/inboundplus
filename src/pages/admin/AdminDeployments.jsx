import { useEffect, useState } from "react";
import { PageHead, Panel } from "../../components/ui";
import { useOrgs } from "../../lib/useData";
import { DeploySection } from "./sections";

export default function AdminDeployments() {
  const orgs = useOrgs().rows;
  const [orgId, setOrgId] = useState("");
  useEffect(() => { if (!orgId && orgs[0]) setOrgId(orgs[0].id); }, [orgs, orgId]);
  return (
    <>
      <PageHead title="Deployments" sub="Publish releases for a client, then review history across all clients." />
      <Panel style={{ marginBottom: 20 }}>
        <label className="field" style={{ margin: 0, maxWidth: 360 }}><span>Client</span>
          <select className="input" value={orgId} onChange={(e) => setOrgId(e.target.value)}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      </Panel>
      {orgId && <DeploySection key={orgId} orgId={orgId} />}
      <div style={{ marginTop: 20 }}><DeploySection orgId={null} /></div>
    </>
  );
}
