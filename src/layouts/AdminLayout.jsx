import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { useOrgs, useTable, useDb } from "../lib/useData";
import { ADMIN_GROUPS, ADMIN_PAGES, adminTo } from "../pages/admin/registry";
import { store } from "../lib/utils";

export default function AdminLayout() {
  const { session, signOut } = useAuth();
  const db = useDb();
  const nav = useNavigate();
  const loc = useLocation();
  const [sideOpen, setSideOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const orgs = useOrgs().rows;
  const requests = useTable("requests", null).rows;
  const messages = useTable("messages", null).rows;
  const seen = store.get("admin_seen_msgs", "");
  const counts = {
    requests: requests.filter((r) => r.status === "New").length,
    messages: messages.filter((m) => m.sender_role === "client" && m.created_at > seen).length,
    onboarding: orgs.filter((o) => o.stage && o.stage !== "Live").length,
  };

  const current = ADMIN_PAGES.find((p) => adminTo(p.path) === loc.pathname.replace(/\/$/, ""));
  useEffect(() => {
    if (current) document.title = `${current.label} · InboundPlus Admin`;
    setSideOpen(false); setMenu(false); window.scrollTo(0, 0);
  }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".dropdown, .user-chip, .search")) { setMenu(false); setQ(""); } };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const hits = q.trim() ? orgs.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const logout = async () => { await signOut(); nav("/login"); };

  return (
    <div className="portal admin">
      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <Link className="brand" to="/admin" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <img className="brand-logo" src="/img/logo.png" alt="InboundPlus" />
          <span className="admin-pill">Admin portal</span>
        </Link>
        <nav className="nav" aria-label="Admin menu">
          {ADMIN_GROUPS.map((g) => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {ADMIN_PAGES.filter((p) => p.group === g).map((p) => (
                <NavLink key={p.path} to={adminTo(p.path)} end={p.path === ""} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  <Icon name={p.icon} />{p.label}
                  {p.badge && counts[p.badge] > 0 && <span className={`count ${p.badge === "onboarding" ? "soft" : ""}`}>{counts[p.badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-label">Clients</div>
          {orgs.slice(0, 8).map((o) => (
            <NavLink key={o.id} to={`/admin/clients/${o.id}`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <span className="avatar sm" style={{ width: 22, height: 22, fontSize: 10 }}>{o.name.slice(0, 2).toUpperCase()}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="demo-note" style={{ margin: 0 }}>{db.kind === "local" ? "Demo data — stored in this browser." : "Live data — Supabase."}</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" aria-label="Open menu" onClick={() => setSideOpen((o) => !o)}><Icon name="menu" /></button>
          <div className="search">
            <Icon name="search" />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a client…" autoComplete="off" aria-label="Find a client"
              onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) { nav(`/admin/clients/${hits[0].id}`); setQ(""); } }} />
            <div className={`search-results ${q.trim() ? "open" : ""}`}>
              {hits.length ? hits.map((o) => <button key={o.id} onClick={() => { nav(`/admin/clients/${o.id}`); setQ(""); }}>{o.name}<small>{o.plan}</small></button>)
                : <div className="empty" style={{ padding: 14 }}>No client named “{q}”</div>}
            </div>
          </div>
          <div className="top-actions">
            <span className="admin-pill">InboundPlus team</span>
            <div className="user-chip" tabIndex={0} onClick={() => setMenu(!menu)}>
              <div className="avatar sm blue">{session.initials}</div>
              <div className="who"><b>{session.name}</b><small>Administrator</small></div>
              <div className={`dropdown ${menu ? "open" : ""}`} style={{ width: 220 }} onClick={(e) => e.stopPropagation()}>
                <h4>{session.email}</h4>
                <button className="nav-item" onClick={() => nav("/admin/users")}><Icon name="gear" />Users & access</button>
                <button className="nav-item" onClick={logout}><Icon name="logout" />Log out</button>
              </div>
            </div>
          </div>
        </header>
        <main className="content fade-in" key={loc.pathname}><Outlet /></main>
      </div>
    </div>
  );
}
