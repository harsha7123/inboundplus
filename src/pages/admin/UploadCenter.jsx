import { useEffect, useState } from "react";
import { PageHead, Panel, Segmented } from "../../components/ui";
import { useOrgs } from "../../lib/useData";
import { FilesSection, ReportsSection } from "./sections";

export default function UploadCenter() {
  const orgs = useOrgs().rows;
  const [orgId, setOrgId] = useState("");
  const [kind, setKind] = useState("Files");
  useEffect(() => { if (!orgId && orgs[0]) setOrgId(orgs[0].id); }, [orgs, orgId]);

  return (
    <>
      <PageHead title="Upload center" sub="Send files and reports to any client. They appear instantly in that client's portal." />
      <Panel style={{ marginBottom: 20 }}>
        <div className="flex wrap-gap" style={{ gap: 14 }}>
          <label className="field" style={{ margin: 0, minWidth: 260, flex: 1 }}><span>Client</span>
            <select className="input" value={orgId} onChange={(e) => setOrgId(e.target.value)}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <div><span style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 6 }}>What are you sending?</span>
            <Segmented value={kind} onChange={setKind} options={["Files", "Report"]} /></div>
        </div>
      </Panel>
      {orgId && (kind === "Files" ? <FilesSection key={orgId} orgId={orgId} /> : <ReportsSection key={orgId} orgId={orgId} />)}
    </>
  );
}
