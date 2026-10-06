import { useRef, useState } from "react";
import Icon from "../../components/Icon";
import { PageHead, Panel, Segmented, StatusBadge, Tilt } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";

const kind = (name) => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ext === "pdf" ? "pdf" : ["xls", "xlsx", "csv"].includes(ext) ? "xls" : ["mp4", "mov"].includes(ext) ? "mp4" : "fig";
};

/* Demo: uploads only record file metadata. For production, upload to Supabase Storage. */
export default function Files() {
  const { state, update } = usePortal();
  const island = useIsland();
  const [filter, setFilter] = useState("All");
  const [over, setOver] = useState(false);
  const input = useRef(null);

  const setStatus = (name, status) => {
    update("files", (fs) => fs.map((f) => (f.name === name ? { ...f, status } : f)));
    island.notify(status === "Approved" ? `Approved ${name}` : `Change request sent for ${name}`, { icon: status === "Approved" ? "check" : "chat" });
  };
  const add = (files) => {
    const list = [...files];
    if (!list.length) return;
    update("files", (fs) => [...list.map((f) => ({ name: f.name, type: kind(f.name), size: (f.size / 1048576).toFixed(1) + " MB", by: "You", status: "Shared" })), ...fs]);
    island.notify(`${list.length} file${list.length > 1 ? "s" : ""} shared with the team`, { icon: "upload" });
  };

  const list = state.files.filter((f) => filter === "All" || f.status === filter);
  return (
    <>
      <PageHead title="Files & approvals" sub="Share assets with the team and approve deliverables.">
        <Segmented value={filter} onChange={setFilter} options={["All", "Needs approval", "Approved"]} />
      </PageHead>
      <Panel>
        <div className={`dropzone ${over ? "over" : ""}`} onClick={() => input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
          <Icon name="upload" size={28} style={{ display: "block", margin: "0 auto 8px" }} />Drop files here or click to upload
          <input ref={input} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>
        <div className="file-grid">
          {list.length ? list.map((f) => (
            <Tilt key={f.name} className="file-card fade-in">
              <div className="flex between"><div className={`file-ico ${f.type}`}>{f.type.toUpperCase()}</div><StatusBadge s={f.status} /></div>
              <b style={{ fontSize: 14, wordBreak: "break-all" }}>{f.name}</b>
              <small className="muted">{f.size} · {f.by}</small>
              {f.status === "Needs approval" && (
                <div className="flex">
                  <button className="btn btn-sm btn-success" onClick={() => setStatus(f.name, "Approved")}><Icon name="check" size={14} /> Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setStatus(f.name, "Rejected")}>Request changes</button>
                </div>
              )}
            </Tilt>
          )) : <div className="empty">Nothing here.</div>}
        </div>
      </Panel>
    </>
  );
}
