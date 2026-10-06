/* Demo data — all clients, numbers and people below are fictional sample data */
window.IPDATA = (function () {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  // Seeded random so charts look the same every load
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const series = (n, start, growth, noise) => Array.from({ length: n }, (_, i) => Math.round(start * Math.pow(1 + growth, i) * (1 + (rnd() - 0.5) * noise)));

  const software = [
    { id: "agent-cs", name: "AI Customer Service Agent", cat: "AI Agents", price: "from $1,500 setup + $250/mo", status: "Popular",
      desc: "A Claude-powered assistant for WhatsApp, web chat and email that answers product, order and return questions 24/7.",
      bullets: ["Trained on your catalogue & policies", "Hands off to a human with full context", "Spanish & English"] },
    { id: "agent-ads", name: "Ad Copy & Creative Agent", cat: "AI Agents", price: "from $900 setup + $150/mo",
      desc: "Generates and tests Meta and Google ad variations from your best-selling products and brand voice.",
      bullets: ["Weekly variant batches", "Performance-based learning", "Approval workflow in the portal"] },
    { id: "claude-skills", name: "Claude Skills Pack for E-commerce", cat: "AI Agents", price: "from $600", status: "New",
      desc: "Reusable Claude skills for product descriptions, SEO briefs, review replies and weekly KPI summaries.",
      bullets: ["Brand-voice guardrails", "Runs inside your team's Claude", "Custom skills on request"] },
    { id: "store-build", name: "Shopify / WooCommerce Store Build", cat: "E-commerce", price: "from $6,000",
      desc: "Conversion-focused storefronts with fast themes, structured data and checkout optimisation.",
      bullets: ["Mobile-first design", "Payment & shipping set-up (LatAm + US)", "Core Web Vitals green"] },
    { id: "cro-kit", name: "CRO Experiment Kit", cat: "E-commerce", price: "from $1,200/mo",
      desc: "A/B testing on product pages, cart and checkout, with results shown live in your portal.",
      bullets: ["2–4 experiments per month", "Heatmaps & session insights", "Revenue-impact reporting"] },
    { id: "seo-suite", name: "SEO Growth Suite", cat: "SEO", price: "from $900/mo",
      desc: "Technical audits, keyword tracking, AI-assisted content briefs and backlink monitoring.",
      bullets: ["Weekly rank tracking", "Search Console integration", "Programmatic SEO pages"] },
    { id: "bi-dash", name: "Executive Growth Dashboard", cat: "Analytics", price: "from $2,500",
      desc: "GA4, Meta, Google Ads, HubSpot and store data unified into one live dashboard.",
      bullets: ["Daily refresh", "Cohort & LTV analysis", "Automated PDF reports"] },
    { id: "hubspot-int", name: "HubSpot ↔ Store ↔ ERP Integration", cat: "Integrations", price: "from $3,500",
      desc: "Sync orders, customers and inventory between HubSpot, your store and ERP (incl. SAP Business One).",
      bullets: ["Two-way sync", "Abandoned-cart workflows", "Error monitoring"] },
    { id: "whatsapp", name: "WhatsApp Commerce Automation", cat: "Integrations", price: "from $1,800",
      desc: "Catalogue, order status, payment links and re-engagement campaigns via the WhatsApp Business API.",
      bullets: ["Template approvals handled", "CRM sync", "Broadcast analytics"] },
  ];

  const blog = [
    { id: 1, title: "How AI agents cut e-commerce support costs by 40%", cat: "AI", date: "Sep 28, 2026", read: "6 min", icon: "bot",
      excerpt: "A practical look at deploying a customer-service agent on WhatsApp and web chat — what to automate first and what to keep human." },
    { id: 2, title: "The 2026 checkout optimisation checklist", cat: "CRO", date: "Sep 19, 2026", read: "8 min", icon: "cart",
      excerpt: "Twelve checkout fixes we test first, ranked by average lift across Latin American stores." },
    { id: 3, title: "Programmatic SEO for product catalogues", cat: "SEO", date: "Sep 10, 2026", read: "7 min", icon: "search",
      excerpt: "Turning thousands of SKUs into high-intent landing pages without thin content penalties." },
    { id: 4, title: "Reading your GA4 funnel like a growth team", cat: "Analytics", date: "Aug 30, 2026", read: "5 min", icon: "chart",
      excerpt: "Which drop-off points matter, how to segment by device and channel, and what to fix next." },
    { id: 5, title: "Claude skills every marketing team should have", cat: "AI", date: "Aug 21, 2026", read: "6 min", icon: "zap",
      excerpt: "Product copy, review replies, weekly KPI digests — reusable skills that keep brand voice consistent." },
    { id: 6, title: "Connecting HubSpot to your store and ERP", cat: "Integrations", date: "Aug 12, 2026", read: "9 min", icon: "plug",
      excerpt: "Architecture patterns for syncing customers, orders and stock without double entry." },
  ];

  const revenue = series(12, 38000, 0.065, 0.12);
  const sessions = series(12, 52000, 0.045, 0.1);
  const orders = revenue.map((r) => Math.round(r / (68 + rnd() * 10)));

  return {
    months,
    software,
    blog,
    client: {
      company: "Andes Outdoor Co.",
      plan: "Commerce Growth Partner",
      manager: { name: "Lucía Ramos", role: "Account Manager", initials: "LR" },
      retainer: { hours: 120, used: 86 },
    },
    analytics: {
      revenue, sessions, orders,
      convRate: sessions.map((s, i) => +((orders[i] / s) * 100).toFixed(2)),
      aov: revenue.map((r, i) => +(r / orders[i]).toFixed(2)),
      channels: {
        labels: ["Organic search", "Paid social", "Google Ads", "Email", "Direct", "Referral"],
        values: [31, 24, 19, 12, 10, 4],
      },
      // 3D: revenue (k$) by channel (rows) × last 6 months (cols)
      channelMonthly: [
        [18, 20, 22, 25, 27, 30],
        [14, 15, 17, 19, 22, 24],
        [12, 12, 14, 15, 17, 18],
        [6, 7, 8, 9, 10, 12],
        [5, 6, 6, 7, 8, 9],
        [2, 2, 3, 3, 3, 4],
      ],
      devices: { labels: ["Mobile", "Desktop", "Tablet"], values: [68, 27, 5] },
      funnel: [
        { stage: "Sessions", value: 84210 },
        { stage: "Product views", value: 41380 },
        { stage: "Add to cart", value: 9870 },
        { stage: "Checkout", value: 4120 },
        { stage: "Purchase", value: 2385 },
      ],
      topProducts: [
        { name: "Trail Runner X2", units: 642, revenue: 57138, trend: 12 },
        { name: "Alpaca Wool Hoodie", units: 518, revenue: 38850, trend: 8 },
        { name: "Summit 35L Backpack", units: 301, revenue: 33110, trend: -3 },
        { name: "Hydro Bottle 1L", units: 1204, revenue: 21672, trend: 22 },
        { name: "Thermal Base Layer", units: 389, revenue: 19450, trend: 5 },
      ],
      regions: [
        { name: "Lima", value: 38 }, { name: "Arequipa", value: 14 }, { name: "Florida, US", value: 13 },
        { name: "Cusco", value: 11 }, { name: "Trujillo", value: 9 }, { name: "Other", value: 15 },
      ],
      cohorts: [
        [100, 32, 24, 19, 17, 15],
        [100, 35, 26, 21, 18],
        [100, 37, 29, 23],
        [100, 39, 30],
        [100, 41],
        [100],
      ],
    },
    seo: {
      health: 86,
      visibility: series(12, 22, 0.07, 0.08),
      clicks: series(12, 9000, 0.06, 0.1),
      impressions: series(12, 210000, 0.05, 0.1),
      keywords: [
        { kw: "zapatillas trail running", pos: 3, prev: 7, vol: 12100, url: "/trail-runner-x2" },
        { kw: "mochila 35 litros", pos: 5, prev: 6, vol: 6600, url: "/summit-35l" },
        { kw: "polera de alpaca", pos: 2, prev: 4, vol: 8100, url: "/alpaca-hoodie" },
        { kw: "outdoor gear peru", pos: 1, prev: 1, vol: 2900, url: "/" },
        { kw: "botella termica 1 litro", pos: 9, prev: 14, vol: 5400, url: "/hydro-bottle" },
        { kw: "ropa termica hombre", pos: 12, prev: 10, vol: 4400, url: "/base-layer" },
        { kw: "hiking boots lima", pos: 6, prev: 11, vol: 1900, url: "/boots" },
        { kw: "camping checklist", pos: 4, prev: 8, vol: 3600, url: "/blog/camping-checklist" },
      ],
      issues: [
        { sev: "red", text: "14 product pages missing meta descriptions" },
        { sev: "amber", text: "LCP above 2.5s on 6 collection pages" },
        { sev: "amber", text: "22 images without alt text" },
        { sev: "green", text: "Structured data valid on 98% of products" },
      ],
      backlinks: series(12, 310, 0.04, 0.05),
    },
    ads: {
      campaigns: [
        { name: "Meta · Prospecting – Trail", platform: "Meta", spend: 4200, revenue: 18900, clicks: 9100, conv: 262, status: "Active" },
        { name: "Meta · Retargeting – Cart", platform: "Meta", spend: 1800, revenue: 12400, clicks: 3200, conv: 171, status: "Active" },
        { name: "Google · Search – Brand", platform: "Google", spend: 900, revenue: 9800, clicks: 4100, conv: 140, status: "Active" },
        { name: "Google · Shopping – All", platform: "Google", spend: 3100, revenue: 14200, clicks: 7800, conv: 198, status: "Active" },
        { name: "Google · PMax – Winter", platform: "Google", spend: 2400, revenue: 7600, clicks: 5200, conv: 101, status: "Learning" },
        { name: "TikTok · Awareness", platform: "TikTok", spend: 1200, revenue: 2100, clicks: 6900, conv: 29, status: "Paused" },
      ],
      spendTrend: series(12, 8000, 0.05, 0.1),
      roasTrend: [3.1, 3.3, 3.2, 3.6, 3.8, 3.7, 4.0, 4.2, 4.1, 4.4, 4.5, 4.6],
    },
    projects: [
      { id: "p1", name: "Store migration to Shopify 2.0", type: "E-commerce", progress: 78, due: "Oct 24, 2026", status: "On track",
        milestones: ["Theme build ✓", "Product import ✓", "Payments ✓", "QA & launch"] },
      { id: "p2", name: "AI customer-service agent (WhatsApp)", type: "AI Agent", progress: 55, due: "Nov 08, 2026", status: "On track",
        milestones: ["Knowledge base ✓", "Flows ✓", "WhatsApp approval", "Go-live"] },
      { id: "p3", name: "Q4 SEO content sprint", type: "SEO", progress: 40, due: "Nov 30, 2026", status: "At risk",
        milestones: ["Keyword map ✓", "12 briefs", "12 articles", "Internal linking"] },
      { id: "p4", name: "HubSpot ↔ Shopify integration", type: "Integration", progress: 90, due: "Oct 14, 2026", status: "On track",
        milestones: ["Mapping ✓", "Sync build ✓", "Testing ✓", "Monitoring"] },
    ],
    tasks: [
      { id: "t1", title: "Approve new homepage hero", col: "Waiting on you", owner: "You", due: "Oct 8" },
      { id: "t2", title: "Send winter product photos", col: "Waiting on you", owner: "You", due: "Oct 10" },
      { id: "t3", title: "Checkout A/B test #4", col: "In progress", owner: "Aarón C.", due: "Oct 15" },
      { id: "t4", title: "WhatsApp template approval", col: "In progress", owner: "Raúl L.", due: "Oct 12" },
      { id: "t5", title: "October SEO briefs (6)", col: "To do", owner: "Content team", due: "Oct 20" },
      { id: "t6", title: "Black Friday campaign plan", col: "To do", owner: "Lucía R.", due: "Oct 25" },
      { id: "t7", title: "GA4 enhanced e-commerce events", col: "Done", owner: "Rhonnald A.", due: "Oct 2" },
      { id: "t8", title: "Collection page speed fixes", col: "Done", owner: "Raúl L.", due: "Sep 30" },
    ],
    deployments: [
      { id: "d-1043", app: "Storefront (Shopify)", env: "Production", version: "v2.8.1", status: "success", by: "Raúl L.", when: "Today, 09:42", notes: "Faster collection pages, new size guide" },
      { id: "d-1042", app: "AI Support Agent", env: "Staging", version: "v0.9.0", status: "success", by: "Synchronous CI", when: "Yesterday, 18:10", notes: "Returns & exchanges intent added" },
      { id: "d-1041", app: "HubSpot Sync Service", env: "Production", version: "v1.4.2", status: "success", by: "Synchronous CI", when: "Oct 3, 15:27", notes: "Inventory sync every 5 min" },
      { id: "d-1040", app: "Storefront (Shopify)", env: "Staging", version: "v2.8.0", status: "failed", by: "Raúl L.", when: "Oct 2, 11:05", notes: "Theme check failed — fixed in v2.8.1" },
      { id: "d-1039", app: "Growth Dashboard", env: "Production", version: "v3.1.0", status: "success", by: "Rhonnald A.", when: "Sep 29, 10:00", notes: "Cohort retention view" },
    ],
    apps: [
      { name: "Storefront (Shopify)", uptime: 99.98, version: "v2.8.1", env: "Production", health: "Healthy" },
      { name: "AI Support Agent", uptime: 99.9, version: "v0.9.0", env: "Staging", health: "Testing" },
      { name: "HubSpot Sync Service", uptime: 99.95, version: "v1.4.2", env: "Production", health: "Healthy" },
      { name: "Growth Dashboard", uptime: 100, version: "v3.1.0", env: "Production", health: "Healthy" },
    ],
    agents: [
      { id: "a1", name: "Sofía – Customer Service", channel: "WhatsApp + Web chat", active: true, convos: 1842, resolved: 81, csat: 4.6, saved: 212 },
      { id: "a2", name: "Ad Copy Generator", channel: "Meta & Google Ads", active: true, convos: 326, resolved: 94, csat: 4.4, saved: 48 },
      { id: "a3", name: "Weekly KPI Analyst", channel: "Email digest", active: true, convos: 52, resolved: 100, csat: 4.8, saved: 26 },
      { id: "a4", name: "Review Reply Assistant", channel: "Google & store reviews", active: false, convos: 410, resolved: 88, csat: 4.5, saved: 31 },
    ],
    reports: [
      { id: "r1", name: "September 2026 Performance Report", type: "Monthly", date: "Oct 3, 2026", pages: 14 },
      { id: "r2", name: "Q3 2026 Executive Summary", type: "Quarterly", date: "Oct 1, 2026", pages: 9 },
      { id: "r3", name: "SEO Technical Audit", type: "Audit", date: "Sep 18, 2026", pages: 22 },
      { id: "r4", name: "August 2026 Performance Report", type: "Monthly", date: "Sep 4, 2026", pages: 13 },
      { id: "r5", name: "Checkout UX Study", type: "Research", date: "Aug 22, 2026", pages: 11 },
    ],
    files: [
      { name: "Homepage_Hero_v3.fig", type: "fig", size: "8.2 MB", by: "Aarón C.", status: "Needs approval" },
      { name: "Winter_Campaign_Brief.pdf", type: "pdf", size: "1.1 MB", by: "Lucía R.", status: "Approved" },
      { name: "Product_Feed_Oct.xlsx", type: "xls", size: "640 KB", by: "You", status: "Shared" },
      { name: "Trail_Runner_Ad_15s.mp4", type: "mp4", size: "24 MB", by: "Creative team", status: "Needs approval" },
      { name: "Brand_Guidelines_2026.pdf", type: "pdf", size: "5.4 MB", by: "You", status: "Shared" },
      { name: "SEO_Keyword_Map.xlsx", type: "xls", size: "310 KB", by: "Content team", status: "Approved" },
    ],
    threads: [
      { id: "m1", with: "Lucía Ramos", role: "Account Manager", initials: "LR", unread: true,
        msgs: [{ me: false, t: "Hi! The September report is ready in Reports. Revenue is up 18% vs August 🎉", at: "09:12" },
               { me: false, t: "Could you also approve the new homepage hero in Files when you have a minute?", at: "09:13" }] },
      { id: "m2", with: "Raúl Luna", role: "Web Developer", initials: "RL", unread: false,
        msgs: [{ me: true, t: "Is the size guide live?", at: "Yesterday" }, { me: false, t: "Yes — deployed this morning in v2.8.1.", at: "Yesterday" }] },
      { id: "m3", with: "Support", role: "InboundPlus help desk", initials: "IP", unread: false,
        msgs: [{ me: false, t: "Welcome to your client hub! Ask us anything here.", at: "Sep 1" }] },
    ],
    invoices: [
      { id: "INV-2026-0910", date: "Oct 1, 2026", desc: "Commerce Growth Partner – October", amount: 10000, status: "Due" },
      { id: "INV-2026-0874", date: "Sep 1, 2026", desc: "Commerce Growth Partner – September", amount: 10000, status: "Paid" },
      { id: "INV-2026-0861", date: "Aug 20, 2026", desc: "AI Support Agent – setup", amount: 1500, status: "Paid" },
      { id: "INV-2026-0832", date: "Aug 1, 2026", desc: "Commerce Growth Partner – August", amount: 10000, status: "Paid" },
    ],
    survey: {
      title: "Q3 Client Satisfaction Survey",
      results: { nps: 62, responses: 38, satisfaction: [2, 1, 4, 13, 18], priorities: { "More AI automation": 14, "Faster reporting": 9, "SEO growth": 8, "New store features": 7 } },
    },
    notifications: [
      { icon: "rocket", text: "Storefront v2.8.1 deployed to production", at: "2h ago" },
      { icon: "report", text: "September Performance Report is ready", at: "Yesterday" },
      { icon: "file", text: "Homepage_Hero_v3 needs your approval", at: "Yesterday" },
      { icon: "bot", text: "Sofía resolved 212 conversations this week", at: "2 days ago" },
    ],
  };
})();
