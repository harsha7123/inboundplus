import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui";
import { useAuth } from "../context/AuthContext";
import { useIsland } from "../context/IslandContext";
import { useDb } from "../lib/useData";

const TYPES = ["E-commerce", "AI Agent", "SEO", "Paid ads", "Integration", "Deployment", "Report / analysis"];

/** "New request" dialog used by Projects, Deployments and the Software catalogue. Saves to the requests table. */
export default function RequestModal({ open, onClose, prefill = "", type: presetType }) {
  const { session } = useAuth();
  const db = useDb();
  const island = useIsland();
  const nav = useNavigate();
  const [title, setTitle] = useState(prefill), [type, setType] = useState(TYPES[0]), [notes, setNotes] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setTitle(prefill); setNotes(""); setType(presetType || TYPES[0]); } }, [open, prefill, presetType]);

  const submit = async () => {
    if (!title.trim()) return;
    if (!session.orgId) return island.notify("Your workspace is not set up yet", { icon: "x" });
    setBusy(true);
    try {
      await db.insert("requests", { org_id: session.orgId, title: title.trim(), type, notes, status: "New", created_by: session.name });
      onClose();
      island.notify("Request sent — your account manager will follow up", { icon: "send" });
      nav("/portal/projects");
    } catch (e) { island.notify("Could not send: " + e.message, { icon: "x" }); }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>New request</h2>
      <p className="muted">Tell the team what you need. Your account manager replies within 1 business day.</p><br />
      <label className="field"><span>What do you need?</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black Friday landing page" autoFocus /></label>
      <label className="field"><span>Type</span><select className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="field"><span>Details</span><textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Goals, deadline, links…" /></label>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>Submit request</button></div>
    </Modal>
  );
}
