/* Sample agency dataset: 10 fictional e-commerce clients with onboarding, agents, files, reports,
   releases, projects, requests and messages. Used by the demo login and by "Load sample data" in
   the admin portal. Sample clients are recognisable by a website ending in ".example". */

import D from "./index";
import { ONBOARDING_TEMPLATE, STAGES } from "./agency";

const iso = (daysAgo = 0, h = 10) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const day = (daysAgo) => iso(daysAgo).slice(0, 10);

const M = { lucia: "Lucía Ramos", martin: "Martín Vega", paula: "Paula Castro" };

// key, name, plan, mrr, platform, stage, status, manager, industry, contact, startedDaysAgo, renewalInDays
const CLIENTS = [
  ["andes", "Andes Outdoor Co.", "Commerce Growth Partner", 10000, "Shopify", "Live", "Active", M.lucia, "Sportswear", "Carla Mendoza", 120, 60],
  ["pacifico", "Casa Pacífico Home", "Ecommerce Growth Advisory", 3000, "WooCommerce", "Live", "Active", M.lucia, "Home & deco", "Sofía Rivas", 75, 20],
  ["selva", "Selva Cosmetics", "Ecommerce Growth Advisory", 3000, "Shopify", "Live", "Active", M.paula, "Beauty", "Valeria Ruiz", 160, 45],
  ["miraflores", "Miraflores Wine Club", "Commerce Growth Partner", 10000, "VTEX", "Live", "Active", M.martin, "Wine & spirits", "Rodrigo Paz", 140, 12],
  ["altiplano", "Altiplano Coffee Roasters", "Ecommerce Growth Advisory", 3000, "Shopify", "Live", "Paused", M.lucia, "Food & beverage", "Elena Quispe", 210, 5],
  ["inka", "Inka Kids Toys", "Ecommerce Growth Advisory", 3000, "WooCommerce", "Launch", "Onboarding", M.paula, "Toys & kids", "Diego Torres", 28, 95],
  ["ruta", "Ruta Bikes Perú", "Ecommerce Growth Blueprint", 0, "VTEX", "Setup", "Onboarding", M.martin, "Bikes & outdoor", "Mateo Quispe", 12, null],
  ["kallpa", "Kallpa Fitness", "Commerce Growth Partner", 10000, "WooCommerce", "Access & assets", "Onboarding", M.lucia, "Fitness", "Jorge Salas", 38, 150],
  ["nativa", "Nativa Café", "Ecommerce Growth Advisory", 3000, "Shopify", "Kickoff", "Onboarding", M.martin, "Food & beverage", "Andrea Flores", 4, 120],
  ["brisa", "Brisa Swimwear Miami", "Ecommerce Growth Advisory", 3000, "Shopify", "Signed", "Onboarding", M.paula, "Swimwear (US)", "Natalie Brooks", 1, 122],
];

/** Returns { organizations, onboarding_tasks, agent_deployments, files, reports, deployments, projects, requests, messages }.
    Child rows reference their client with `org` (the client key); callers map keys to real ids. */
export function buildSampleAgency() {
  const out = { organizations: [], onboarding_tasks: [], agent_deployments: [], files: [], reports: [], deployments: [], projects: [], requests: [], messages: [] };
  const add = (t, org, row) => out[t].push({ org, ...row });

  for (const [key, name, plan, mrr, platform, stage, status, manager, industry, contact, started, renew] of CLIENTS) {
    const slug = name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
    out.organizations.push({
      key, name, plan, mrr, platform, stage, status, manager, industry, contact_name: contact,
      contact_email: `${contact.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@${slug}.example`,
      website: `${slug}.example`, start_date: day(started), renewal_date: renew == null ? null : day(-renew), created_at: iso(started),
    });

    // onboarding checklist: everything before the current stage done, current stage half done
    const si = STAGES.indexOf(stage);
    ONBOARDING_TEMPLATE.forEach(([section, title], i) => {
      const ti = STAGES.indexOf(section);
      const done = stage === "Live" || ti < si || (ti === si && i % 2 === 0 && !(key === "kallpa" && title.startsWith("Meta")));
      add("onboarding_tasks", key, { section, title, position: i, done, created_at: iso(started, 8) });
    });
  }

  /* ---------- Andes Outdoor (flagship, rich data from the client demo) ---------- */
  D.files.forEach((f, i) => add("files", "andes", { name: f.name, size: f.size, kind: f.type, status: f.status, uploaded_by: f.by, created_at: iso(i * 3 + 1) }));
  D.reports.forEach((r, i) => add("reports", "andes", { name: r.name, type: r.type, summary: null, created_at: iso([3, 5, 18, 32, 45][i] ?? i * 10) }));
  D.deployments.forEach((d, i) => add("deployments", "andes", { app: d.app, env: d.env, version: d.version, status: d.status, notes: d.notes, by_name: d.by, created_at: iso([0, 1, 3, 4, 7][i] ?? i, 9 + i) }));
  D.projects.forEach((p, i) => add("projects", "andes", { name: p.name, type: p.type, progress: p.progress, status: p.status, due: p.due, created_at: iso(40 - i * 5) }));
  add("requests", "andes", { title: "Black Friday landing page", type: "E-commerce", notes: "Need it live by Nov 20.", status: "In review", created_by: "Carla Mendoza", created_at: iso(1) });
  add("requests", "andes", { title: "Add size guide to product pages", type: "E-commerce", notes: "", status: "Done", created_by: "Carla Mendoza", created_at: iso(15) });
  add("messages", "andes", { sender_role: "agency", sender_name: M.lucia, body: "Hi! The September report is ready in Reports. Revenue is up 18% vs August 🎉", created_at: iso(0, 9) });
  add("messages", "andes", { sender_role: "agency", sender_name: M.lucia, body: "Could you also approve the new homepage hero in Files when you have a minute?", created_at: iso(0, 9) });
  add("messages", "andes", { sender_role: "client", sender_name: "Carla Mendoza", body: "Great news, thanks Lucía! Will review the hero today.", created_at: iso(0, 11) });
  [["customer-service", "WhatsApp + Web chat", "Live", 1842, "Sofía persona, ES/EN", 70], ["cart-recovery", "WhatsApp", "Testing", 96, "10% max incentive", 12],
   ["ad-copy", "Meta + Google Ads", "Live", 326, "", 50], ["exec-reporting", "Client portal", "Live", 6, "Monthly + quarterly", 90]]
    .forEach(([agent_key, channel, s, conversations, notes, d]) => add("agent_deployments", "andes", { agent_key, channel, status: s, conversations, notes, created_at: iso(d) }));

  /* ---------- Casa Pacífico (Watch: slow request, unanswered message) ---------- */
  add("files", "pacifico", { name: "Home_Collection_Banner.fig", size: "6.1 MB", kind: "fig", status: "Needs approval", uploaded_by: "Creative team", created_at: iso(2) });
  add("files", "pacifico", { name: "Product_Feed_Sep.xlsx", size: "880 KB", kind: "xls", status: "Shared", uploaded_by: "Sofía Rivas", created_at: iso(20) });
  add("reports", "pacifico", { name: "September 2026 Performance Report", type: "Monthly", summary: "Organic sessions +12%, ROAS 3.9×. Next: home-collection SEO pages.", created_at: iso(5) });
  add("deployments", "pacifico", { app: "Storefront (WooCommerce)", env: "Production", version: "v1.6.0", status: "success", notes: "New home collection pages", by_name: "Web team", created_at: iso(3) });
  add("projects", "pacifico", { name: "SEO content sprint – Home & Deco", type: "SEO", progress: 35, status: "On track", due: "Nov 20, 2026", created_at: iso(20) });
  add("requests", "pacifico", { title: "Add WhatsApp chat to the store", type: "AI Agent", notes: "Customers keep asking on Instagram.", status: "New", created_by: "Sofía Rivas", created_at: iso(7, 8) });
  add("messages", "pacifico", { sender_role: "agency", sender_name: M.lucia, body: "The new banner is ready for your review in Files.", created_at: iso(3, 10) });
  add("messages", "pacifico", { sender_role: "client", sender_name: "Sofía Rivas", body: "Hello team, can we review the banner tomorrow?", created_at: iso(2, 8) });
  add("agent_deployments", "pacifico", { agent_key: "customer-service", channel: "Web chat", status: "Setup", conversations: 0, notes: "Waiting for FAQ document", created_at: iso(5) });
  add("agent_deployments", "pacifico", { agent_key: "catalog-seo", channel: "WooCommerce", status: "Live", conversations: 412, notes: "412 products rewritten", created_at: iso(30) });

  /* ---------- Selva Cosmetics (Healthy) ---------- */
  add("files", "selva", { name: "Holiday_Gift_Sets_Ads.mp4", size: "18 MB", kind: "mp4", status: "Approved", uploaded_by: "Creative team", created_at: iso(6) });
  add("files", "selva", { name: "Brand_Guidelines_Selva.pdf", size: "4.2 MB", kind: "pdf", status: "Shared", uploaded_by: "Valeria Ruiz", created_at: iso(150) });
  add("reports", "selva", { name: "September 2026 Performance Report", type: "Monthly", summary: "Revenue +22% MoM, repeat purchase rate 31%. Influencer bundle sold out.", created_at: iso(4) });
  add("reports", "selva", { name: "Q3 2026 Executive Summary", type: "Quarterly", summary: "Best quarter to date: revenue +48% vs Q2, CAC −14%.", created_at: iso(6) });
  add("deployments", "selva", { app: "Storefront (Shopify)", env: "Production", version: "v3.2.0", status: "success", notes: "Gift-set bundles and quiz", by_name: "Web team", created_at: iso(2) });
  add("deployments", "selva", { app: "Review Reply Assistant", env: "Production", version: "v1.1.0", status: "success", notes: "Auto-replies for 5★ reviews", by_name: "AI team", created_at: iso(9) });
  add("projects", "selva", { name: "Holiday campaign 2026", type: "Paid ads", progress: 70, status: "On track", due: "Nov 25, 2026", created_at: iso(25) });
  add("projects", "selva", { name: "Skin-type quiz recommender", type: "AI Agent", progress: 100, status: "Done", due: "Sep 30, 2026", created_at: iso(60) });
  add("messages", "selva", { sender_role: "client", sender_name: "Valeria Ruiz", body: "The quiz is converting really well, thank you!", created_at: iso(1, 15) });
  add("messages", "selva", { sender_role: "agency", sender_name: M.paula, body: "Amazing! We'll add it to the October report with the numbers.", created_at: iso(1, 16) });
  [["shopping-assistant", "Website quiz", "Live", 2210, "Skin-type quiz"], ["reviews", "Google + Shopify reviews", "Live", 540, ""], ["retention", "Email + WhatsApp", "Testing", 120, "Replenishment reminders"]]
    .forEach(([agent_key, channel, s, conversations, notes], i) => add("agent_deployments", "selva", { agent_key, channel, status: s, conversations, notes, created_at: iso(40 - i * 10) }));

  /* ---------- Miraflores Wine Club (At risk: stale approvals & requests, no contact, renewal soon) ---------- */
  add("files", "miraflores", { name: "Christmas_Catalog_Draft.pdf", size: "9.8 MB", kind: "pdf", status: "Needs approval", uploaded_by: "Creative team", created_at: iso(9) });
  add("files", "miraflores", { name: "Subscription_Landing_v2.fig", size: "5.5 MB", kind: "fig", status: "Needs approval", uploaded_by: "Web team", created_at: iso(12) });
  add("reports", "miraflores", { name: "August 2026 Performance Report", type: "Monthly", summary: "Subscriptions flat; churn up to 7.4%. Retention agent recommended.", created_at: iso(36) });
  add("deployments", "miraflores", { app: "Storefront (VTEX)", env: "Staging", version: "v2.0.1", status: "failed", notes: "Payment gateway sandbox error", by_name: "Web team", created_at: iso(10) });
  add("projects", "miraflores", { name: "Subscription relaunch", type: "E-commerce", progress: 45, status: "At risk", due: "Oct 31, 2026", created_at: iso(50) });
  add("requests", "miraflores", { title: "Fix subscription checkout errors", type: "E-commerce", notes: "Customers can't renew with Visa.", status: "In progress", created_by: "Rodrigo Paz", created_at: iso(11) });
  add("requests", "miraflores", { title: "Christmas email campaign", type: "Paid ads", notes: "", status: "New", created_by: "Rodrigo Paz", created_at: iso(8) });
  add("messages", "miraflores", { sender_role: "agency", sender_name: M.martin, body: "Sharing the Christmas catalog draft for approval.", created_at: iso(20, 10) });
  add("messages", "miraflores", { sender_role: "client", sender_name: "Rodrigo Paz", body: "Any update on the checkout issue? We are losing renewals.", created_at: iso(6, 9) });
  add("agent_deployments", "miraflores", { agent_key: "retention", channel: "Email", status: "Setup", conversations: 0, notes: "Win-back flow pending approval", created_at: iso(15) });

  /* ---------- Altiplano Coffee (Paused account, renewal in 5 days) ---------- */
  add("reports", "altiplano", { name: "Q3 2026 Executive Summary", type: "Quarterly", summary: "Paused in September at client's request (budget review).", created_at: iso(8) });
  add("projects", "altiplano", { name: "Coffee subscription funnel", type: "E-commerce", progress: 60, status: "At risk", due: "On hold", created_at: iso(90) });
  add("messages", "altiplano", { sender_role: "agency", sender_name: M.lucia, body: "Hi Elena, shall we schedule the renewal call for next week?", created_at: iso(16, 10) });
  add("agent_deployments", "altiplano", { agent_key: "customer-service", channel: "WhatsApp", status: "Paused", conversations: 980, notes: "Paused with account", created_at: iso(150) });

  /* ---------- Inka Kids Toys (Launch) ---------- */
  add("files", "inka", { name: "Toy_Catalog_Photos.zip", size: "48 MB", kind: "fig", status: "Shared", uploaded_by: "Diego Torres", created_at: iso(20) });
  add("files", "inka", { name: "Launch_Campaign_Creatives.fig", size: "7.2 MB", kind: "fig", status: "Needs approval", uploaded_by: "Creative team", created_at: iso(1) });
  add("deployments", "inka", { app: "Storefront (WooCommerce)", env: "Staging", version: "v0.9.0", status: "success", notes: "Store ready for launch QA", by_name: "Web team", created_at: iso(2) });
  add("projects", "inka", { name: "Christmas launch", type: "E-commerce", progress: 85, status: "On track", due: "Nov 10, 2026", created_at: iso(25) });
  add("messages", "inka", { sender_role: "agency", sender_name: M.paula, body: "Launch creatives are in Files — please approve by Friday.", created_at: iso(1, 12) });
  add("agent_deployments", "inka", { agent_key: "cart-recovery", channel: "WhatsApp", status: "Testing", conversations: 14, notes: "", created_at: iso(4) });

  /* ---------- Ruta Bikes (Setup, Blueprint) ---------- */
  add("files", "ruta", { name: "Onboarding_Checklist.pdf", size: "220 KB", kind: "pdf", status: "Shared", uploaded_by: "InboundPlus", created_at: iso(10) });
  add("projects", "ruta", { name: "Ecommerce Growth Blueprint", type: "Strategy", progress: 40, status: "On track", due: "Oct 30, 2026", created_at: iso(10) });
  add("requests", "ruta", { title: "Can we include a WhatsApp agent in the plan?", type: "AI Agent", notes: "", status: "In review", created_by: "Mateo Quispe", created_at: iso(3) });
  add("messages", "ruta", { sender_role: "agency", sender_name: M.martin, body: "Diagnosis call booked for Monday 10:00.", created_at: iso(2, 10) });

  /* ---------- Kallpa Fitness (stuck at Access & assets for 38 days) ---------- */
  add("requests", "kallpa", { title: "Help giving Meta Business Manager access", type: "Integration", notes: "We don't know which account is ours.", status: "New", created_by: "Jorge Salas", created_at: iso(9) });
  add("messages", "kallpa", { sender_role: "agency", sender_name: M.lucia, body: "We still need partner access to Meta Business Manager to continue.", created_at: iso(18, 10) });

  /* ---------- Nativa Café (Kickoff) ---------- */
  add("messages", "nativa", { sender_role: "agency", sender_name: M.martin, body: "Welcome to InboundPlus! Your kickoff call is booked for Thursday.", created_at: iso(3, 11) });
  add("files", "nativa", { name: "Kickoff_Agenda.pdf", size: "180 KB", kind: "pdf", status: "Shared", uploaded_by: "InboundPlus", created_at: iso(3) });

  /* ---------- Brisa Swimwear (just signed) ---------- */
  add("messages", "brisa", { sender_role: "agency", sender_name: M.paula, body: "Hi Natalie, welcome aboard! Please fill in the onboarding questionnaire.", created_at: iso(0, 14) });

  return out;
}

export const SAMPLE_USERS = (idOf) => [
  { id: "u-admin", email: "team@inboundplus.example", full_name: "InboundPlus Admin", role: "admin", org_id: null, created_at: iso(200) },
  { id: "u-carla", email: "demo@andesoutdoor.example", full_name: "Carla Mendoza", role: "client", org_id: idOf("andes"), created_at: iso(120) },
  { id: "u-diego", email: "diego@andesoutdoor.example", full_name: "Diego Paredes", role: "client", org_id: idOf("andes"), created_at: iso(100) },
  { id: "u-sofia", email: "sofia@casapacifico.example", full_name: "Sofía Rivas", role: "client", org_id: idOf("pacifico"), created_at: iso(75) },
  { id: "u-valeria", email: "valeria@selva.example", full_name: "Valeria Ruiz", role: "client", org_id: idOf("selva"), created_at: iso(160) },
  { id: "u-rodrigo", email: "rodrigo@miraflores.example", full_name: "Rodrigo Paz", role: "client", org_id: idOf("miraflores"), created_at: iso(140) },
  { id: "u-mateo", email: "mateo@ruta.example", full_name: "Mateo Quispe", role: "client", org_id: idOf("ruta"), created_at: iso(12) },
  { id: "u-andrea", email: "andrea@nativa.example", full_name: "Andrea Flores", role: "client", org_id: idOf("nativa"), created_at: iso(4) },
  { id: "u-new", email: "lucas@newstore.example", full_name: "Lucas Medina", role: "client", org_id: null, created_at: iso(0) },
];

export const isSampleOrg = (o) => (o.website || "").endsWith(".example");
