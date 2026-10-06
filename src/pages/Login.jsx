import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BarScene } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useIsland } from "../context/IslandContext";
import D from "../data";
import { ALLOW_DEMO } from "../lib/supabase";
import { validEmail } from "../lib/utils";

const PRIVACY = "https://inboundplus.agency/politica-de-privacidad-y-uso-de-datos/";
const SCENE = [[3, 4, 5, 6, 7, 9], [2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 4, 5]];

export default function Login() {
  const auth = useAuth();
  const island = useIsland();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const recovering = params.get("mode") === "reset" || auth.recovery;
  const [view, setView] = useState(recovering ? "reset" : params.get("mode") === "register" ? "register" : "login");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [f, setF] = useState({ email: "", password: "", name: "", company: "", site: "", platform: "Shopify", goal: "Increase online sales", terms: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  useEffect(() => { if (auth.recovery) setView("reset"); }, [auth.recovery]);
  useEffect(() => {
    document.title = ({ register: "Register", reset: "New password", notice: "Check your email" }[view] || "Log in") + " · InboundPlus";
    setErr("");
  }, [view]);

  if (!auth.loading && auth.session && view !== "reset") return <Navigate to="/portal" replace />;

  const run = async (fn) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr(e.message || "Something went wrong."); } finally { setBusy(false); } };

  const login = (e) => {
    e.preventDefault();
    if (!validEmail(f.email)) return setErr("Enter a valid email address.");
    if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
    run(async () => { await auth.signIn(f.email.trim(), f.password); nav("/portal"); });
  };

  const register = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.company.trim()) return setErr("Please enter your name and company.");
    if (!validEmail(f.email)) return setErr("Enter a valid email address.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    if (!f.terms) return setErr("Please accept the privacy & data policy to continue.");
    run(async () => {
      const res = await auth.signUp({ email: f.email.trim(), password: f.password, name: f.name.trim(), company: f.company.trim(), platform: f.platform, goal: f.goal, site: f.site.trim() });
      if (res.confirm) { setNotice(`We sent a confirmation link to ${f.email}. Click it to activate your account, then log in.`); setView("notice"); }
      else nav("/portal");
    });
  };

  const forgot = (e) => {
    e.preventDefault();
    if (!validEmail(f.email)) return setErr("Enter your email above, then click “Forgot password?”.");
    if (!auth.enabled) return island.notify("Demo mode: password reset needs Supabase", { icon: "x" });
    run(async () => { await auth.resetPassword(f.email.trim()); setNotice(`If an account exists for ${f.email}, we've sent a link to reset your password.`); setView("notice"); });
  };

  const reset = (e) => {
    e.preventDefault();
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    run(async () => { await auth.updatePassword(f.password); island.notify("Password updated"); nav("/portal"); });
  };

  const demo = () => { auth.demo(D.client.company); nav("/portal"); };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link className="brand" to="/"><img className="brand-logo lg" src="/img/logo.png" alt="InboundPlus" /><span className="brand-sub">Client Hub</span></Link>
        <h2 style={{ marginTop: 36 }}>Scale your e-commerce with growth systems + AI.</h2>
        <p>Sales, SEO, campaigns, AI agents, deployments and reports — all in one client portal.</p>
        <BarScene className="scene-box" height="auto" values={SCENE} colors={[0xf26b35, 0xffa36e, 0x5551d3]} floor={0x1c232b} radius={19} sceneHeight={4}>
          <span className="scene-hint">Drag to rotate</span>
        </BarScene>
      </aside>

      <main className="auth-main">
        <div className="auth-card fade-in">
          {(view === "login" || view === "register") && (
            <div className="tabs" role="tablist">
              <button className={view === "login" ? "active" : ""} onClick={() => setView("login")}>Log in</button>
              <button className={view === "register" ? "active" : ""} onClick={() => setView("register")}>Register</button>
            </div>
          )}

          {view === "login" && (
            <form onSubmit={login} noValidate>
              <h1>Welcome back</h1>
              <p className="sub">Log in to your client portal.</p>
              <label className="field"><span>Work email</span><input className="input" type="email" value={f.email} onChange={set("email")} autoComplete="username" placeholder="you@company.com" /></label>
              <label className="field"><span>Password</span><input className="input" type="password" value={f.password} onChange={set("password")} autoComplete="current-password" placeholder="••••••••" /></label>
              <div className="auth-foot"><span /><a href="#" onClick={forgot}>Forgot password?</a></div>
              <div className="form-error" role="alert">{err}</div>
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : "Log in"}</button>
              {ALLOW_DEMO && <><div className="divider">or</div>
                <button className="btn btn-ghost" style={{ width: "100%" }} type="button" onClick={demo}>Explore the demo client account</button></>}
            </form>
          )}

          {view === "register" && (
            <form onSubmit={register} noValidate>
              <h1>Create your account</h1>
              <p className="sub">Set up your company's client portal.</p>
              <div className="row-2">
                <label className="field"><span>Full name</span><input className="input" value={f.name} onChange={set("name")} autoComplete="name" /></label>
                <label className="field"><span>Company</span><input className="input" value={f.company} onChange={set("company")} autoComplete="organization" /></label>
              </div>
              <label className="field"><span>Work email</span><input className="input" type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
              <div className="row-2">
                <label className="field"><span>Store website</span><input className="input" value={f.site} onChange={set("site")} placeholder="mystore.com" /></label>
                <label className="field"><span>Store platform</span>
                  <select className="input" value={f.platform} onChange={set("platform")}>{["Shopify", "WooCommerce", "VTEX", "Magento", "Other / none yet"].map((o) => <option key={o}>{o}</option>)}</select></label>
              </div>
              <label className="field"><span>Main goal</span>
                <select className="input" value={f.goal} onChange={set("goal")}>{["Increase online sales", "Improve ROAS", "Organise our digital operation", "Automate with AI", "Better reporting"].map((o) => <option key={o}>{o}</option>)}</select></label>
              <label className="field"><span>Password <small className="muted">(min. 8 characters)</small></span><input className="input" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
              <label className="flex" style={{ gap: 8, fontSize: 13, marginBottom: 14 }}><input type="checkbox" checked={f.terms} onChange={set("terms")} /> I agree to the <a href={PRIVACY} target="_blank" rel="noopener noreferrer">privacy &amp; data policy</a></label>
              <div className="form-error" role="alert">{err}</div>
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : "Create account"}</button>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={reset} noValidate>
              <h1>Set a new password</h1>
              <p className="sub">Choose a new password for your account.</p>
              <label className="field"><span>New password <small className="muted">(min. 8 characters)</small></span><input className="input" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
              <div className="form-error" role="alert">{err}</div>
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>Update password</button>
            </form>
          )}

          {view === "notice" && (
            <div>
              <h1>Check your email</h1>
              <p className="sub">{notice}</p>
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setView("login")}>Back to log in</button>
            </div>
          )}

          <p className="demo-note">{auth.enabled ? "Secure sign-in powered by Supabase." : <><b>Demo mode:</b> Supabase is not configured. Accounts are stored only in this browser.</>}</p>
        </div>
      </main>
    </div>
  );
}
