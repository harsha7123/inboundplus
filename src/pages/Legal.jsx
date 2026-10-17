/* Privacy policy and terms of use for the client portal (required by Google/Microsoft login and Stripe).
   Template text — have InboundPlus review it with their legal advisor before production use. */
import { useEffect } from "react";
import { Link } from "react-router-dom";

const UPDATED = "October 17, 2026";
const CONTACT = "hola@inboundplus.agency";

function Shell({ title, children }) {
  useEffect(() => { document.title = `${title} · InboundPlus Client Hub`; window.scrollTo(0, 0); }, [title]);
  return (
    <>
      <nav className="site-nav"><div className="wrap">
        <Link className="brand" to="/"><img className="brand-logo" src="/img/logo.png" alt="InboundPlus" /><span className="brand-sub">Client Hub</span></Link>
        <div className="site-actions" style={{ marginLeft: "auto", display: "flex" }}><Link className="btn btn-ghost" to="/login">Log in</Link></div>
      </div></nav>
      <main className="wrap legal" style={{ maxWidth: 820, padding: "48px 20px 80px" }}>
        <h1>{title}</h1>
        <p className="muted">Last updated: {UPDATED}</p>
        {children}
        <p className="muted" style={{ marginTop: 40 }}><Link to="/privacy">Privacy policy</Link> · <Link to="/terms">Terms of use</Link> · <Link to="/">Home</Link></p>
      </main>
    </>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy policy">
      <p>This policy explains how InboundPlus (“we”, “us”) handles personal information in the InboundPlus Client Hub at inboundplus.vercel.app (the “Portal”). It complements the general privacy policy at <a href="https://inboundplus.agency/politica-de-privacidad-y-uso-de-datos/" target="_blank" rel="noopener noreferrer">inboundplus.agency</a>.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account details:</b> your name, email address, company name and, if you choose, your store website and platform.</li>
        <li><b>Sign-in with Google or Microsoft:</b> if you use these options, we receive only your name, email address and profile picture from that provider. We never receive or store your Google or Microsoft password.</li>
        <li><b>Content you share:</b> files, messages, requests, survey answers and approvals you submit in the Portal.</li>
        <li><b>Payments:</b> invoices are paid through Stripe. Card details are entered on Stripe's secure page and are never stored by us. We keep the invoice status, amount, date and the payer's email.</li>
        <li><b>Technical data:</b> basic logs needed to keep the service secure and working.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To create and secure your account and let you log in.</li>
        <li>To provide our marketing, e-commerce and AI services, show your reports and dashboards, and communicate with you.</li>
        <li>To issue invoices and confirm payments.</li>
        <li>We do not sell your personal information and do not use it for advertising.</li>
      </ul>

      <h2>Service providers</h2>
      <p>We use trusted providers to run the Portal: Supabase (database, authentication and file storage), Vercel (hosting), Stripe (payments), and Google and Microsoft (optional sign-in). They process data only on our behalf.</p>

      <h2>Data access and security</h2>
      <p>Each client can only see their own company's data. Access is protected with authentication and database security rules, and data is encrypted in transit.</p>

      <h2>Retention and your rights</h2>
      <p>We keep your data while you are a client and as required by law. You can ask us to access, correct or delete your personal information, or to close your account, by writing to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>

      <h2>Contact</h2>
      <p>InboundPlus — Lima, Perú and Florida, United States · <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of use">
      <p>By creating an account or using the InboundPlus Client Hub (the “Portal”), you agree to these terms.</p>
      <h2>The Portal</h2>
      <p>The Portal lets InboundPlus clients follow projects, reports, deployments, AI agents and invoices, share files and messages, and pay invoices. Some dashboards may show sample data until your data sources are connected.</p>
      <h2>Your account</h2>
      <p>Keep your login details private and tell us immediately at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> if you suspect unauthorised use. You are responsible for activity under your account.</p>
      <h2>Acceptable use</h2>
      <p>Do not upload unlawful content, attempt to access other clients' data, or interfere with the Portal's security or operation.</p>
      <h2>Payments</h2>
      <p>Invoices are payable through Stripe in the currency shown. Payment terms are those in your service agreement with InboundPlus.</p>
      <h2>Liability</h2>
      <p>The Portal is provided to support our services. Your service agreement with InboundPlus governs our obligations and liability.</p>
      <h2>Changes</h2>
      <p>We may update these terms and will show the date of the latest version on this page.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Shell>
  );
}
