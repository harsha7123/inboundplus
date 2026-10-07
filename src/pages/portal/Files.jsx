import { useState } from "react";
import { FileGrid, Uploader } from "../../components/shared";
import { PageHead, Panel, Segmented } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { useDb, useTable } from "../../lib/useData";

export default function Files() {
  const { session } = useAuth();
  const db = useDb();
  const island = useIsland();
  const orgId = session.orgId || undefined;
  const { rows } = useTable("files", orgId);
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState(false);

  const setStatus = async (f, status) => {
    try {
      await db.update("files", f.id, { status });
      island.notify(status === "Approved" ? `Approved ${f.name}` : `Change request sent for ${f.name}`, { icon: status === "Approved" ? "check" : "chat" });
    } catch (e) { island.notify("Could not update: " + e.message, { icon: "x" }); }
  };
  const upload = async (files) => {
    if (!orgId) return island.notify("Your workspace is not set up yet", { icon: "x" });
    setBusy(true);
    const job = island.notify(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}…`, { icon: "upload", progress: true, persist: true });
    try {
      for (let i = 0; i < files.length; i++) {
        await db.upload("files", orgId, files[i], { status: "Shared", uploaded_by: session.name });
        job.update(null, ((i + 1) / files.length) * 100);
      }
      job.done(`${files.length} file${files.length > 1 ? "s" : ""} shared with InboundPlus`);
    } catch (e) { job.done("Upload failed: " + e.message); }
    setBusy(false);
  };

  const list = rows.filter((f) => filter === "All" || f.status === filter);
  return (
    <>
      <PageHead title="Files & approvals" sub="Share assets with the team and approve deliverables.">
        <Segmented value={filter} onChange={setFilter} options={["All", "Needs approval", "Approved"]} />
      </PageHead>
      <Panel>
        <Uploader onFiles={upload} busy={busy} />
        <FileGrid rows={list} onApprove={(f) => setStatus(f, "Approved")} onReject={(f) => setStatus(f, "Rejected")} />
      </Panel>
    </>
  );
}
