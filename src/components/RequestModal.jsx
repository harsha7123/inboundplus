import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui";
import { usePortal } from "../context/PortalContext";
import { useIsland } from "../context/IslandContext";

const TYPES = ["E-commerce", "AI Agent", "SEO", "Paid ads", "Integration", "Report / analysis"];

/** "New request" dialog used by Projects and the Software catalogue. */
export default function RequestModal({ open, onClose, prefill = "" }) {
  const { update } = usePortal();
  const island = useIsland();
  const nav = useNavigate();
  const [title, setTitle] = useState(prefill), [type, setType] = useState(TYPES[0]), [detail, setDetail] = useState("");
  useEffect(() => { if (open) { setTitle(prefill); setDetail(""); } }, [open, prefill]);

  const submit = () => {
    if (!title.trim()) return;
    update("requests", (r) => [{ title: title.trim(), detail: type, notes: detail, at: "just now" }, ...r]);
    onClose();
    island.notify("Request sent — your account manager will follow up", { icon: "send" });
    nav("/portal/projects");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>New request</h2>
      <p className="muted">Tell the team what you need. Your account manager replies within 1 business day.</p><br />
      <label className="field"><span>What do you need?</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black Friday landing page" autoFocus /></label>
      <label className="field"><span>Type</span><select className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="field"><span>Details</span><textarea className="input" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Goals, deadline, links…" /></label>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Submit request</button></div>
    </Modal>
  );
}
