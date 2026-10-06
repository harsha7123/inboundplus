import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import Icon from "./Icon";
import { createBarScene } from "../lib/barScene";
import { sparkOptions } from "../lib/charts";

const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Card that tilts in 3D toward the cursor. */
export function Tilt({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduceMotion) return;
    const el = ref.current, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-3px)`;
  };
  const onLeave = () => { ref.current.style.transform = ""; };
  return <Tag ref={ref} className={`tilt ${className}`} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>{children}</Tag>;
}

const BADGE = { "On track": "green", "At risk": "amber", Active: "green", Learning: "amber", Paused: "gray", Paid: "green", Due: "amber", Approved: "green",
  "Needs approval": "amber", Rejected: "red", Shared: "gray", Healthy: "green", Testing: "amber", success: "green", failed: "red", running: "amber",
  Winner: "green", Running: "amber", Stopped: "gray", Submitted: "green", Open: "amber", "In review": "amber" };
export const StatusBadge = ({ s, label }) => <span className={`badge ${BADGE[s] || "gray"}`}><span className="dot" />{label || s}</span>;

export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1><p>{sub}</p></div>
      {children && <div className="head-tools">{children}</div>}
    </div>
  );
}

export function Kpi({ label, value, delta, icon, spark, color }) {
  return (
    <Tilt className="kpi">
      <div className="k-top"><span>{label}</span>{icon && <Icon name={icon} size={18} style={{ color: "var(--blue)" }} />}</div>
      <div className="k-val">{value}</div>
      {delta != null && (
        <div className={`delta ${delta >= 0 ? "up" : "down"}`}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% <span>vs last period</span></div>
      )}
      {spark && (
        <div style={{ height: 38, marginTop: 8 }}>
          <Line data={{ labels: spark.map((_, i) => i), datasets: [{ data: spark, borderColor: color, borderWidth: 2, tension: 0.4 }] }} options={sparkOptions} />
        </div>
      )}
    </Tilt>
  );
}

/** Segmented control: options = [{value,label}] or strings. */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value, l = typeof o === "string" ? o : o.label;
        return <button key={v} className={v === value ? "active" : ""} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

export function Chips({ options, value, onChange, align = "center" }) {
  return (
    <div className="filter-row" style={{ justifyContent: align }}>
      {options.map((c) => <button key={c} className={`chip ${c === value ? "active" : ""}`} onClick={() => onChange(c)}>{c}</button>)}
    </div>
  );
}

export const Progress = ({ value, tone = "" }) => <div className={`progress ${tone}`}><div style={{ width: `${value}%` }} /></div>;

export function Panel({ title, sub, actions, children, className = "", style }) {
  return (
    <div className={`panel ${className}`} style={style}>
      {(title || actions) && (
        <div className="panel-head">
          <div>{title && <h3>{title}</h3>}{sub && <p>{sub}</p>}</div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Switch({ checked, onChange, title }) {
  return (
    <label className="switch" title={title} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span />
    </label>
  );
}

export function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back open" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">{children}</div>
    </div>
  );
}

/** Three.js 3D bar chart. `values` updates animate in place. */
export function BarScene({ values, colors, tooltip, height = 340, className = "scene3d", floor, radius, sceneHeight, children }) {
  const ref = useRef(null), scene = useRef(null), tip = useRef(tooltip);
  tip.current = tooltip;
  useEffect(() => {
    scene.current = createBarScene(ref.current, {
      values, colors, floor, radius, height: sceneHeight,
      tooltip: tooltip ? (r, c, v) => tip.current(r, c, v) : null,
    });
    return () => scene.current.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { scene.current?.update(values); }, [values]);
  return (
    <div className={className} style={{ height, position: "relative" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      {children}
    </div>
  );
}

/** Table with click-to-sort headers. columns = [{ label, render?, num? }], rows = arrays. */
export function SortableTable({ columns, rows, initialSort = 0, initialDir = -1 }) {
  const [col, setCol] = useState(initialSort), [dir, setDir] = useState(initialDir);
  const sorted = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * dir);
  const click = (i) => { if (i === col) setDir(-dir); else { setCol(i); setDir(-1); } };
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{columns.map((c, i) => (
          <th key={c.label} className={i ? "num" : ""} onClick={() => click(i)}>{c.label} {i === col ? (dir > 0 ? "↑" : "↓") : ""}</th>
        ))}</tr></thead>
        <tbody>{sorted.map((r, ri) => (
          <tr key={ri}>{r.map((v, i) => <td key={i} className={i ? "num" : ""}>{columns[i].render ? columns[i].render(v) : v}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export const Delta = ({ v, suffix = "%" }) => (
  <span style={{ color: v >= 0 ? "var(--green)" : "var(--red)", fontWeight: 500 }}>{v >= 0 ? "▲" : "▼"} {Math.abs(v)}{suffix}</span>
);
