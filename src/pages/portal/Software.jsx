import { useState } from "react";
import RequestModal from "../../components/RequestModal";
import { Chips, PageHead, Tilt } from "../../components/ui";
import D from "../../data";

const CATS = ["All", ...new Set(D.software.map((s) => s.cat))];

export default function Software() {
  const [cat, setCat] = useState("All");
  const [req, setReq] = useState(null);
  return (
    <>
      <PageHead title="Software & solutions" sub="Add new capabilities to your store. Request one and track the rollout under Projects." />
      <Chips options={CATS} value={cat} onChange={setCat} align="flex-start" />
      <div className="grid g-3">
        {D.software.filter((s) => cat === "All" || s.cat === cat).map((s) => (
          <Tilt key={s.id} className="panel sw-card fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sw-top"><span className="badge blue">{s.cat}</span>{s.status && <span className={`badge ${s.status === "New" ? "green" : "amber"}`}>{s.status}</span>}</div>
            <h3 style={{ fontSize: 17 }}>{s.name}</h3>
            <p className="muted" style={{ fontSize: 14 }}>{s.desc}</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13 }}>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            <div className="flex between" style={{ marginTop: "auto", paddingTop: 8 }}>
              <b style={{ color: "var(--navy)", fontSize: 13 }}>{s.price}</b>
              <button className="btn btn-sm btn-primary" onClick={() => setReq(s.name)}>Request</button>
            </div>
          </Tilt>
        ))}
      </div>
      <RequestModal open={!!req} prefill={req || ""} onClose={() => setReq(null)} />
    </>
  );
}
