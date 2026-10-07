/* Components shared by the client portal and the admin portal (files, uploads, chat, reports). */
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { StatusBadge, Tilt } from "./ui";
import { useIsland } from "../context/IslandContext";
import { ago, useDb } from "../lib/useData";

export function Empty({ icon = "folder", title, text, children }) {
  return (
    <div className="empty" style={{ padding: "36px 20px" }}>
      <Icon name={icon} size={30} style={{ color: "var(--muted)", display: "block", margin: "0 auto 10px" }} />
      <b style={{ display: "block", color: "var(--text)", marginBottom: 4 }}>{title}</b>
      {text && <span>{text}</span>}
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

/** Drag-and-drop / click upload area. */
export function Uploader({ onFiles, label = "Drop files here or click to upload", busy, accept, multiple = true }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  return (
    <div className={`dropzone ${over ? "over" : ""}`} style={busy ? { opacity: 0.6, pointerEvents: "none" } : undefined}
      onClick={() => input.current.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]); }}>
      <Icon name="upload" size={28} style={{ display: "block", margin: "0 auto 8px" }} />{busy ? "Uploading…" : label}
      <input ref={input} type="file" hidden multiple={multiple} accept={accept} onChange={(e) => { if (e.target.files.length) onFiles([...e.target.files]); e.target.value = ""; }} />
    </div>
  );
}

/** Opens a stored file (signed URL in Supabase, data URL in demo). */
export function DownloadButton({ row, label = "Open", className = "btn btn-sm btn-ghost" }) {
  const db = useDb();
  const island = useIsland();
  const open = async (e) => {
    e.stopPropagation();
    try {
      const url = await db.fileUrl(row);
      if (!url) return island.notify("Sample file — no download available", { icon: "file" });
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener"; if (url.startsWith("data:")) a.download = row.name;
      a.click();
    } catch (err) { island.notify("Could not open file: " + err.message, { icon: "x" }); }
  };
  return <button className={className} onClick={open}><Icon name="download" size={14} /> {label}</button>;
}

/** Grid of file cards. Pass handlers to show the matching actions. */
export function FileGrid({ rows, onApprove, onReject, onDelete, showOrg }) {
  if (!rows.length) return <Empty icon="file" title="No files yet" text="Uploaded files will appear here." />;
  return (
    <div className="file-grid">
      {rows.map((f) => (
        <Tilt key={f.id} className="file-card fade-in">
          <div className="flex between"><div className={`file-ico ${f.kind}`}>{(f.kind || "file").toUpperCase()}</div><StatusBadge s={f.status} /></div>
          <b style={{ fontSize: 14, wordBreak: "break-all" }}>{f.name}</b>
          <small className="muted">{f.size} · {f.uploaded_by} · {ago(f.created_at)}{showOrg ? ` · ${showOrg(f.org_id)}` : ""}</small>
          <div className="flex wrap-gap" style={{ gap: 6 }}>
            <DownloadButton row={f} />
            {onApprove && f.status === "Needs approval" && <button className="btn btn-sm btn-success" onClick={() => onApprove(f)}><Icon name="check" size={14} /> Approve</button>}
            {onReject && f.status === "Needs approval" && <button className="btn btn-sm btn-danger" onClick={() => onReject(f)}>Request changes</button>}
            {onDelete && <button className="btn btn-sm btn-ghost" title="Delete" onClick={() => onDelete(f)}><Icon name="x" size={14} /></button>}
          </div>
        </Tilt>
      ))}
    </div>
  );
}

/** One conversation between a client organization and the agency. `me` = "client" | "agency". */
export function ChatThread({ messages, me, onSend, height = 460, placeholder = "Write a message…" }) {
  const [text, setText] = useState("");
  const log = useRef(null);
  const ordered = [...messages].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
  useEffect(() => { if (log.current) log.current.scrollTop = 1e6; }, [ordered.length]);
  const send = (e) => { e.preventDefault(); const t = text.trim(); if (!t) return; onSend(t); setText(""); };
  return (
    <div className="chat" style={{ height }}>
      <div className="chat-log" ref={log}>
        {ordered.length ? ordered.map((m) => (
          <div key={m.id} className={`msg ${m.sender_role === me ? "me" : "bot"}`}>{m.body}<small>{m.sender_role === me ? "You" : m.sender_name} · {ago(m.created_at)}</small></div>
        )) : <Empty icon="chat" title="No messages yet" text="Start the conversation below." />}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoComplete="off" />
        <button className="btn btn-primary">Send</button>
      </form>
    </div>
  );
}

/** Timeline of deployments. */
export function DeployTimeline({ rows, showOrg }) {
  if (!rows.length) return <Empty icon="rocket" title="No deployments yet" />;
  return (
    <div className="timeline">{rows.map((d) => (
      <div key={d.id} className={`tl-item fade-in ${d.status === "success" ? "ok" : d.status === "failed" ? "fail" : "run"}`}>
        <div className="flex between wrap-gap"><b>{d.app} <span className="muted" style={{ fontWeight: 400 }}>{d.version}</span></b><StatusBadge s={d.status} /></div>
        <small>{showOrg ? `${showOrg(d.org_id)} · ` : ""}{d.env} · {d.by_name} · {ago(d.created_at)}</small>
        {d.notes && <p style={{ fontSize: 14, marginTop: 4 }}>{d.notes}</p>}
      </div>
    ))}</div>
  );
}

export const REQUEST_STATUSES = ["New", "In review", "In progress", "Done"];
