import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { usePortal } from "../context/PortalContext";
import D from "../data";
import { GROUPS, PORTAL_PAGES, to } from "../pages/portal/registry";

export default function PortalLayout() {
  const { session, signOut } = useAuth();
  const { state, update } = usePortal();
  const nav = useNavigate();
  const loc = useLocation();
  const [sideOpen, setSideOpen] = useState(false);
  const [menu, setMenu] = useState(null); // "bell" | "user" | null
  const [q, setQ] = useState("");

  const counts = {
    unread: state.threads.filter((t) => t.unread).length,
    approvals: state.files.filter((f) => f.status === "Needs approval").length,
  };

  const current = PORTAL_PAGES.find((p) => to(p.path) === loc.pathname.replace(/\/$/, "")) || PORTAL_PAGES[0];
  useEffect(() => {
    document.title = `${current.label} · InboundPlus Client Portal`;
    setSideOpen(false); setMenu(null); window.scrollTo(0, 0);
  }, [current]);

  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".dropdown, .icon-btn, .user-chip, .search")) { setMenu(null); setQ(""); } };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const index = useMemo(() => [
    ...PORTAL_PAGES.map((p) => ({ t: p.label, kind: "Page", go: p.path })),
    ...D.software.map((s) => ({ t: s.name, kind: "Software", go: "software" })),
    ...D.blog.map((b) => ({ t: b.title, kind: b.cat, go: "blog" })),
    ...D.projects.map((p) => ({ t: p.name, kind: "Project", go: "projects" })),
    ...D.seo.keywords.map((k) => ({ t: k.kw, kind: "Keyword", go: "seo" })),
    ...state.reports.map((r) => ({ t: r.name, kind: "Report", go: "reports" })),
  ], [state.reports]);
  const hits = q.trim() ? index.filter((x) => x.t.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const goSearch = (h) => { nav(to(h.go)); setQ(""); };

  const logout = async () => { await signOut(); nav("/login"); };

  return (
    <div className="portal">
      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <Link className="brand" to="/" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <img className="brand-logo" src="/img/logo.png" alt="InboundPlus" />
          <small style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>{session.company}</small>
        </Link>
        <nav className="nav" aria-label="Portal menu">
          {GROUPS.map((g) => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {PORTAL_PAGES.filter((p) => p.group === g).map((p) => (
                <NavLink key={p.path} to={to(p.path)} end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  <Icon name={p.icon} />{p.label}
                  {p.badge && counts[p.badge] > 0 && <span className="count">{counts[p.badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="am-card">
            <div className="avatar sm blue">{D.client.manager.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}><b>{D.client.manager.name}</b><small className="muted" style={{ display: "block" }}>Your account manager</small></div>
            <button className="icon-btn" style={{ width: 32, height: 32 }} title="Message" onClick={() => nav(to("messages"))}><Icon name="chat" /></button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" aria-label="Open menu" onClick={() => setSideOpen((o) => !o)}><Icon name="menu" /></button>
          <div className="search">
            <Icon name="search" />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && hits[0] && goSearch(hits[0])}
              placeholder="Search pages, reports, software, blog…" autoComplete="off" aria-label="Search" />
            <div className={`search-results ${q.trim() ? "open" : ""}`}>
              {hits.length ? hits.map((h, i) => <button key={i} onClick={() => goSearch(h)}>{h.t}<small>{h.kind}</small></button>)
                : <div className="empty" style={{ padding: 14 }}>No results for “{q}”</div>}
            </div>
          </div>
          <div className="top-actions">
            <span className="sample-pill" title="Dashboards show sample data until data sources are connected">Sample data</span>
            <div style={{ position: "relative" }}>
              <button className="icon-btn" aria-label="Notifications" onClick={() => { setMenu(menu === "bell" ? null : "bell"); update("readNotifs", true); }}>
                <Icon name="bell" />{!state.readNotifs && <span className="pip" />}
              </button>
              <div className={`dropdown ${menu === "bell" ? "open" : ""}`}>
                <h4>Notifications</h4>
                {D.notifications.map((n, i) => (
                  <div className="notif" key={i}><Icon name={n.icon} size={18} style={{ color: "var(--blue)" }} /><div>{n.text}<small>{n.at}</small></div></div>
                ))}
              </div>
            </div>
            <div className="user-chip" tabIndex={0} onClick={() => setMenu(menu === "user" ? null : "user")}>
              <div className="avatar sm">{session.initials}</div>
              <div className="who"><b>{session.name}</b><small>{session.company}</small></div>
              <div className={`dropdown ${menu === "user" ? "open" : ""}`} style={{ width: 220 }} onClick={(e) => e.stopPropagation()}>
                <h4>{session.email}</h4>
                <button className="nav-item" onClick={() => nav(to("settings"))}><Icon name="gear" />Settings</button>
                <button className="nav-item" onClick={() => nav(to("billing"))}><Icon name="card" />Billing</button>
                <button className="nav-item" onClick={logout}><Icon name="logout" />Log out</button>
              </div>
            </div>
          </div>
        </header>
        <main className="content fade-in" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
