/* InboundPlus Client Portal — views & interactions (front-end prototype, sample data) */
(function () {
  const session = IP.session();
  if (!session) { location.href = "login.html"; return; }

  const D = IPDATA, esc = IP.esc, icon = IP.icon, $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const C = { navy: "#12305e", blue: "#2563eb", sky: "#60a5fa", pale: "#bfd3f7", green: "#16a34a", red: "#dc2626", amber: "#d97706", gray: "#94a3b8", grid: "#eef1f6" };
  const PALETTE = [C.navy, C.blue, C.sky, C.pale, C.green, C.gray];

  /* ---------- persistent demo state ---------- */
  const state = IP.store.get("state", null) || {
    tasks: D.tasks, files: D.files, threads: D.threads, agents: D.agents, deployments: D.deployments,
    reports: D.reports, survey: D.survey.results, requests: [], integrations: { GA4: true, Shopify: true, HubSpot: true, "Meta Ads": true, "Google Ads": true, "Search Console": true, WhatsApp: false, "SAP Business One": false },
    notifs: { weekly: true, deploy: true, approvals: true, invoices: false }, readNotifs: false,
  };
  const save = () => IP.store.set("state", state);

  /* ---------- charts registry ---------- */
  let charts = [], scenes = [];
  function clearViz() { charts.forEach((c) => c.destroy()); charts = []; scenes.forEach((s) => s && s.destroy()); scenes = []; }
  if (window.Chart) {
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.color = "#64748b";
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.tooltip.backgroundColor = C.navy;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
  }
  function chart(id, cfg) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) return null;
    const c = new Chart(el, cfg); charts.push(c); return c;
  }
  const axes = (yFmt) => ({
    x: { grid: { display: false }, border: { display: false } },
    y: { grid: { color: C.grid }, border: { display: false }, ticks: { callback: yFmt || ((v) => IP.fmt(v)) } },
  });
  const spark = (id, data, color) => chart(id, {
    type: "line",
    data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, borderWidth: 2, pointRadius: 0, tension: .4, fill: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
  });

  /* ---------- menu ---------- */
  const MENU = [
    ["Overview", [["overview", "home", "Dashboard"], ["analytics", "chart", "Analytics"], ["ecommerce", "cart", "E-commerce"], ["seo", "search", "SEO"], ["ads", "ads", "Paid ads"]]],
    ["Delivery", [["projects", "folder", "Projects"], ["deployments", "rocket", "Deployments"], ["agents", "bot", "AI agents"], ["software", "code", "Software"]]],
    ["Insights", [["reports", "report", "Reports"], ["surveys", "survey", "Surveys"], ["blog", "blog", "Blog"]]],
    ["Workspace", [["files", "file", "Files & approvals"], ["messages", "chat", "Messages"], ["billing", "card", "Billing"], ["settings", "gear", "Settings"]]],
  ];
  const TITLES = Object.fromEntries(MENU.flatMap(([, items]) => items.map(([k, , t]) => [k, t])));
  function drawNav(active) {
    const unread = state.threads.filter((t) => t.unread).length;
    const pending = state.files.filter((f) => f.status === "Needs approval").length;
    $("#nav").innerHTML = MENU.map(([label, items]) => `<div class="nav-label">${label}</div>` + items.map(([k, i, t]) => {
      const n = k === "messages" ? unread : k === "files" ? pending : 0;
      return `<button class="nav-item ${k === active ? "active" : ""}" data-k="${k}">${icon(i)}${t}${n ? `<span class="count">${n}</span>` : ""}</button>`;
    }).join("")).join("");
    $$("#nav .nav-item").forEach((b) => b.onclick = () => go(b.dataset.k));
  }

  /* ---------- router ---------- */
  function go(k) { location.hash = k; }
  function route() {
    const k = (location.hash || "#overview").slice(1);
    const view = VIEWS[k] ? k : "overview";
    clearViz();
    drawNav(view);
    $("#sidebar").classList.remove("open");
    document.title = TITLES[view] + " · InboundPlus Client Portal";
    const v = $("#view");
    v.innerHTML = "";
    v.classList.remove("fade-in"); void v.offsetWidth; v.classList.add("fade-in");
    VIEWS[view](v);
    IP.hydrateIcons(v);
    IP.tilt(v);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ---------- modal ---------- */
  function modal(html, onMount) {
    $("#modalBody").innerHTML = html;
    $("#modal").classList.add("open");
    IP.hydrateIcons($("#modalBody"));
    $$("[data-close]", $("#modalBody")).forEach((b) => b.onclick = closeModal);
    onMount && onMount($("#modalBody"));
  }
  function closeModal() { $("#modal").classList.remove("open"); }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  const head = (title, sub, tools) => `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div><div class="head-tools">${tools || ""}</div></div>`;
  const kpi = (label, val, delta, sparkId, ic) => `
    <div class="kpi tilt"><div class="k-top"><span>${label}</span>${ic ? `<span style="width:18px;color:${C.blue}">${icon(ic)}</span>` : ""}</div>
    <div class="k-val">${val}</div><div class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}% <span>vs last period</span></div>
    ${sparkId ? `<canvas id="${sparkId}"></canvas>` : ""}</div>`;
  const pct = (a, b) => ((a - b) / b) * 100;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const statusBadge = (s) => {
    const m = { "On track": "green", "At risk": "amber", Active: "green", Learning: "amber", Paused: "gray", Paid: "green", Due: "amber", Approved: "green", "Needs approval": "amber", Rejected: "red", Shared: "gray", Healthy: "green", Testing: "amber", success: "green", failed: "red", running: "amber" };
    return `<span class="badge ${m[s] || "gray"}"><span class="dot"></span>${esc(s)}</span>`;
  };

  const VIEWS = {};

  /* ===================== OVERVIEW ===================== */
  VIEWS.overview = (v) => {
    const A = D.analytics, n = A.revenue.length;
    const first = session.name.split(" ")[0];
    const r = D.client.retainer;
    v.innerHTML = head(`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${esc(first)} 👋`, `Here's how ${esc(session.company)} is performing this month.`,
      `<button class="btn btn-ghost" onclick="Portal.go('reports')">${icon("download")} Reports</button><button class="btn btn-primary" id="askAgent">${icon("bot")} Ask the AI analyst</button>`) +
    (session.isNew ? `<div class="panel" style="margin-bottom:20px;border-color:${C.blue}"><div class="flex between wrap-gap"><div><h3>Welcome to your client hub 🎉</h3><p class="muted">We're showing sample data until your store and ad accounts are connected.</p></div><button class="btn btn-primary" onclick="Portal.go('settings')">Connect data sources</button></div></div>` : "") +
    `<div class="kpis">
      ${kpi("Revenue (Oct)", IP.money(A.revenue[n - 1]), pct(A.revenue[n - 1], A.revenue[n - 2]), "sp1", "chart")}
      ${kpi("Orders", A.orders[n - 1].toLocaleString(), pct(A.orders[n - 1], A.orders[n - 2]), "sp2", "cart")}
      ${kpi("Conversion rate", A.convRate[n - 1] + "%", pct(A.convRate[n - 1], A.convRate[n - 2]), "sp3", "target")}
      ${kpi("Avg. order value", "$" + A.aov[n - 1], pct(A.aov[n - 1], A.aov[n - 2]), "sp4", "card")}
    </div>
    <div class="grid g-21">
      <div class="panel"><div class="panel-head"><div><h3>Revenue by channel — 3D view</h3><p>Last 6 months · drag to rotate, hover a bar for details</p></div>
        <div class="seg" id="ch3dMode"><button class="active" data-m="all">All channels</button><button data-m="paid">Paid only</button><button data-m="organic">Organic only</button></div></div>
        <div class="scene3d" id="ov3d"></div>
        <div class="legend" style="margin-top:12px">${A.channels.labels.map((l, i) => `<span><i style="background:${PALETTE[i]}"></i>${l}</span>`).join("")}</div>
      </div>
      <div class="panel"><div class="panel-head"><div><h3>Traffic sources</h3><p>Share of sessions</p></div></div><div class="chart-box sm"><canvas id="chChannels"></canvas></div>
        <div class="list" style="margin-top:10px">${A.channels.labels.slice(0, 4).map((l, i) => `<div class="list-item"><span class="dot" style="color:${PALETTE[i]}"></span><span class="grow">${l}</span><b>${A.channels.values[i]}%</b></div>`).join("")}</div>
      </div>
    </div>
    <div class="grid g-21">
      <div class="panel"><div class="panel-head"><div><h3>Revenue & sessions</h3><p>12-month trend</p></div></div><div class="chart-box"><canvas id="chRev"></canvas></div></div>
      <div class="panel"><div class="panel-head"><div><h3>Retainer hours</h3><p>October · ${r.used} of ${r.hours} h used</p></div></div>
        <div class="gauge-wrap"><div class="chart-box sm" style="width:100%"><canvas id="chRetainer"></canvas></div><div class="g-num">${Math.round((r.used / r.hours) * 100)}%</div><small>${r.hours - r.used} hours remaining</small></div>
        <div class="list">${[["Development", 38], ["Campaign management", 24], ["Content & SEO", 16], ["Strategy", 8]].map(([t, h]) => `<div class="list-item"><span class="grow">${t}</span><b>${h} h</b></div>`).join("")}</div>
      </div>
    </div>
    <div class="grid g-3">
      <div class="panel"><div class="panel-head"><h3>Active projects</h3><button class="btn btn-sm btn-ghost" onclick="Portal.go('projects')">View all</button></div>
        <div class="list">${D.projects.map((p) => `<div class="list-item"><div class="grow"><b style="font-size:14px">${esc(p.name)}</b><small>${p.type} · due ${p.due}</small><div class="progress ${p.status === "At risk" ? "amber" : ""}" style="margin-top:6px"><div style="width:${p.progress}%"></div></div></div><b>${p.progress}%</b></div>`).join("")}</div></div>
      <div class="panel"><div class="panel-head"><h3>Latest deployments</h3><button class="btn btn-sm btn-ghost" onclick="Portal.go('deployments')">View all</button></div>
        <div class="timeline">${state.deployments.slice(0, 4).map((d) => `<div class="tl-item ${d.status === "success" ? "ok" : d.status === "failed" ? "fail" : "run"}"><b style="font-size:14px">${esc(d.app)} ${d.version}</b><br><small>${d.env} · ${d.when}</small></div>`).join("")}</div></div>
      <div class="panel"><div class="panel-head"><h3>AI agents this week</h3><button class="btn btn-sm btn-ghost" onclick="Portal.go('agents')">Open</button></div>
        <div class="list">${state.agents.map((a) => `<div class="list-item"><div class="avatar sm ${a.active ? "green" : ""}">${icon("bot")}</div><div class="grow"><b style="font-size:14px">${esc(a.name)}</b><small>${a.convos.toLocaleString()} conversations · ${a.resolved}% resolved</small></div>${a.active ? statusBadge("Active") : statusBadge("Paused")}</div>`).join("")}</div>
        <div class="panel" style="background:var(--surface-2);box-shadow:none;border:none;margin-top:10px;padding:14px"><b style="font-size:22px;color:${C.navy}">${sum(state.agents.map((a) => a.saved))} hours</b><br><small class="muted">of team time saved by AI agents this quarter</small></div></div>
    </div>`;

    spark("sp1", A.revenue, C.blue); spark("sp2", A.orders, C.navy); spark("sp3", A.convRate, C.green); spark("sp4", A.aov, C.amber);
    const cm = A.channelMonthly, m6 = D.months.slice(-6);
    const sc = IP.barScene($("#ov3d"), { values: cm, colors: [0x12305e, 0x2563eb, 0x60a5fa, 0xbfd3f7, 0x16a34a, 0x94a3b8], tooltip: (r, c, val) => `${A.channels.labels[r]} · ${m6[c]}<br><b>$${val}k revenue</b>`, radius: 17 });
    scenes.push(sc);
    $$("#ch3dMode button").forEach((b) => b.onclick = () => {
      $$("#ch3dMode button").forEach((x) => x.classList.toggle("active", x === b));
      const keep = { all: [0, 1, 2, 3, 4, 5], paid: [1, 2], organic: [0, 3, 4, 5] }[b.dataset.m];
      sc && sc.update(cm.map((row, i) => (keep.includes(i) ? row : row.map(() => 0))));
    });
    chart("chChannels", { type: "doughnut", data: { labels: A.channels.labels, datasets: [{ data: A.channels.values, backgroundColor: PALETTE, borderWidth: 2, borderColor: "#fff", hoverOffset: 10 }] }, options: { maintainAspectRatio: false, cutout: "64%", plugins: { legend: { display: false } } } });
    chart("chRev", { type: "bar", data: { labels: D.months, datasets: [
      { type: "bar", label: "Revenue ($)", data: A.revenue, backgroundColor: C.blue, borderRadius: 6, yAxisID: "y" },
      { type: "line", label: "Sessions", data: A.sessions, borderColor: C.navy, backgroundColor: C.navy, tension: .35, pointRadius: 3, yAxisID: "y1" }] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { ...axes((v) => "$" + IP.fmt(v)), y1: { position: "right", grid: { display: false }, border: { display: false }, ticks: { callback: (v) => IP.fmt(v) } } } } });
    chart("chRetainer", { type: "doughnut", data: { labels: ["Used", "Remaining"], datasets: [{ data: [r.used, r.hours - r.used], backgroundColor: [C.blue, "#e8efff"], borderWidth: 0 }] }, options: { maintainAspectRatio: false, rotation: -90, circumference: 180, cutout: "75%", plugins: { legend: { display: false } } } });
    $("#askAgent").onclick = () => { curAgent = "a3"; go("agents"); };
  };

  /* ===================== ANALYTICS ===================== */
  VIEWS.analytics = (v) => {
    const A = D.analytics;
    v.innerHTML = head("Analytics", "Traffic, conversion and customer behaviour across your store.",
      `<div class="seg" id="range"><button data-n="3">3M</button><button data-n="6">6M</button><button data-n="12" class="active">12M</button></div>`) +
    `<div class="kpis" id="aKpis"></div>
    <div class="grid g-2">
      <div class="panel"><div class="panel-head"><div><h3>Conversion rate & AOV</h3><p>Click legend items to toggle</p></div></div><div class="chart-box"><canvas id="chConv"></canvas></div></div>
      <div class="panel"><div class="panel-head"><div><h3>Conversion funnel</h3><p>Click a stage to see drop-off</p></div></div><div class="funnel" id="funnel"></div><div id="funnelNote" class="muted" style="margin-top:14px;font-size:13px">Select a stage.</div></div>
    </div>
    <div class="grid g-3">
      <div class="panel"><div class="panel-head"><h3>Devices</h3></div><div class="chart-box sm"><canvas id="chDev"></canvas></div></div>
      <div class="panel"><div class="panel-head"><h3>Sales by region</h3></div><div class="chart-box sm"><canvas id="chReg"></canvas></div></div>
      <div class="panel"><div class="panel-head"><h3>Orders per month</h3></div><div class="chart-box sm"><canvas id="chOrd"></canvas></div></div>
    </div>
    <div class="panel"><div class="panel-head"><div><h3>Customer retention cohorts</h3><p>% of customers who purchase again, by first-purchase month</p></div></div>
      <div class="tbl-wrap"><table class="tbl" id="cohort"></table></div></div>`;

    let cConv, cOrd;
    function draw(n) {
      const sl = (a) => a.slice(-n), labels = sl(D.months);
      const rev = sl(A.revenue), ses = sl(A.sessions), ord = sl(A.orders), half = Math.max(1, Math.floor(n / 2));
      const prevRev = A.revenue.slice(-2 * n, -n); const prevSum = prevRev.length ? sum(prevRev) : sum(rev.slice(0, half)) * (n / half);
      $("#aKpis").innerHTML =
        kpi("Revenue", IP.money(sum(rev)), pct(sum(rev), prevSum)) +
        kpi("Sessions", IP.fmt(sum(ses)), pct(sum(ses.slice(-half)), sum(ses.slice(0, half)))) +
        kpi("Orders", sum(ord).toLocaleString(), pct(sum(ord.slice(-half)), sum(ord.slice(0, half)))) +
        kpi("Returning customers", "34.8%", 3.2);
      IP.tilt($("#aKpis"));
      if (cConv) { cConv.data.labels = labels; cConv.data.datasets[0].data = sl(A.convRate); cConv.data.datasets[1].data = sl(A.aov); cConv.update(); }
      else cConv = chart("chConv", { type: "line", data: { labels, datasets: [
        { label: "Conversion rate (%)", data: sl(A.convRate), borderColor: C.blue, backgroundColor: C.blue, tension: .35, yAxisID: "y" },
        { label: "AOV ($)", data: sl(A.aov), borderColor: C.amber, backgroundColor: C.amber, tension: .35, yAxisID: "y1" }] },
        options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { ...axes((x) => x + "%"), y1: { position: "right", grid: { display: false }, border: { display: false }, ticks: { callback: (x) => "$" + x } } } } });
      if (cOrd) { cOrd.data.labels = labels; cOrd.data.datasets[0].data = ord; cOrd.update(); }
      else cOrd = chart("chOrd", { type: "bar", data: { labels, datasets: [{ label: "Orders", data: ord, backgroundColor: C.navy, borderRadius: 5 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axes() } });
    }
    $$("#range button").forEach((b) => b.onclick = () => { $$("#range button").forEach((x) => x.classList.toggle("active", x === b)); draw(+b.dataset.n); });
    draw(12);

    const F = A.funnel, top = F[0].value;
    $("#funnel").innerHTML = F.map((s, i) => `<div class="funnel-row" data-i="${i}" style="cursor:pointer"><span>${s.stage}</span><div><div class="funnel-bar" style="width:0;background:${PALETTE[i]};${i >= 3 ? "color:#12305e" : ""}">${IP.fmt(s.value)}</div></div><b class="num">${((s.value / top) * 100).toFixed(1)}%</b></div>`).join("");
    requestAnimationFrame(() => $$("#funnel .funnel-bar").forEach((b, i) => b.style.width = Math.max(8, (F[i].value / top) * 100) + "%"));
    $$("#funnel .funnel-row").forEach((row) => row.onclick = () => {
      const i = +row.dataset.i; $$("#funnel .funnel-row").forEach((x) => x.style.opacity = x === row ? 1 : .55);
      const tips = ["Top of funnel — 68% of sessions are mobile.", "Product pages: add size guides and reviews above the fold.", "Cart: free-shipping threshold banner is being A/B tested.", "Checkout: one-page checkout is projected to lift completion by ~9%.", "Purchases: AI agent recovers ~6% of abandoned carts on WhatsApp."];
      const drop = i ? (100 - (F[i].value / F[i - 1].value) * 100).toFixed(1) : null;
      $("#funnelNote").innerHTML = `<b style="color:${C.navy}">${F[i].stage}: ${F[i].value.toLocaleString()}</b>${drop ? ` · <span style="color:${C.red}">${drop}% drop-off from ${F[i - 1].stage}</span>` : ""}<br>${tips[i]}`;
    });

    chart("chDev", { type: "doughnut", data: { labels: A.devices.labels, datasets: [{ data: A.devices.values, backgroundColor: [C.blue, C.navy, C.pale], borderWidth: 2, borderColor: "#fff", hoverOffset: 8 }] }, options: { maintainAspectRatio: false, cutout: "60%", plugins: { legend: { position: "bottom" } } } });
    chart("chReg", { type: "bar", data: { labels: A.regions.map((r) => r.name), datasets: [{ data: A.regions.map((r) => r.value), backgroundColor: C.blue, borderRadius: 5 }] }, options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: C.grid }, ticks: { callback: (x) => x + "%" } }, y: { grid: { display: false } } } } });

    const cm = D.months.slice(-6);
    $("#cohort").innerHTML = `<thead><tr><th class="nosort">Cohort</th>${["M0", "M1", "M2", "M3", "M4", "M5"].map((m) => `<th class="nosort num">${m}</th>`).join("")}</tr></thead><tbody>` +
      A.cohorts.map((row, i) => `<tr><td><b>${cm[i]}</b></td>${[0, 1, 2, 3, 4, 5].map((j) => row[j] == null ? "<td></td>" : `<td class="num" style="background:rgba(37,99,235,${(row[j] / 100) * .85 + .05});color:${row[j] > 50 ? "#fff" : C.navy};font-weight:600" title="${cm[i]} cohort, month ${j}: ${row[j]}%">${row[j]}%</td>`).join("")}</tr>`).join("") + "</tbody>";
  };

  /* ===================== E-COMMERCE ===================== */
  VIEWS.ecommerce = (v) => {
    const A = D.analytics;
    v.innerHTML = head("E-commerce", "Store performance, products and conversion experiments.", `<span class="badge green"><span class="dot"></span>Store online · 99.98% uptime</span>`) +
    `<div class="kpis">${kpi("Cart abandonment", "68.2%", -4.1, null, "cart")}${kpi("Repeat purchase rate", "27.4%", 2.6, null, "users")}${kpi("Customer lifetime value", "$214", 6.8, null, "star")}${kpi("Page speed (LCP)", "1.9s", -12.0, null, "zap")}</div>
    <div class="grid g-21">
      <div class="panel"><div class="panel-head"><div><h3>Top products</h3><p>Click a column header to sort</p></div></div><div class="tbl-wrap"><table class="tbl" id="prodTbl"></table></div></div>
      <div class="panel"><div class="panel-head"><h3>Product revenue — 3D</h3></div><div class="scene3d" id="prod3d" style="height:300px"></div><p class="muted" style="font-size:12px;margin-top:8px">Bars = last 4 months revenue per product. Drag to rotate.</p></div>
    </div>
    <div class="panel"><div class="panel-head"><div><h3>CRO experiments</h3><p>A/B tests run by the InboundPlus CRO team</p></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th class="nosort">Experiment</th><th class="nosort">Page</th><th class="nosort num">Variant lift</th><th class="nosort">Confidence</th><th class="nosort">Status</th></tr></thead><tbody>
      ${[["One-page checkout", "Checkout", 9.4, 96, "Winner"], ["Free-shipping progress bar", "Cart", 5.1, 88, "Running"], ["Reviews above the fold", "Product", 3.7, 91, "Running"], ["Bundle offer: Trail kit", "Product", -1.2, 54, "Stopped"]]
        .map(([e, p, l, c, s]) => `<tr><td><b>${e}</b></td><td>${p}</td><td class="num" style="color:${l >= 0 ? C.green : C.red};font-weight:700">${l >= 0 ? "+" : ""}${l}%</td><td><div class="flex"><div class="progress ${c > 90 ? "green" : "amber"}" style="width:110px"><div style="width:${c}%"></div></div><small>${c}%</small></div></td><td>${statusBadge(s === "Winner" ? "Approved" : s === "Running" ? "Learning" : "Paused").replace(/Approved|Learning|Paused/, s)}</td></tr>`).join("")}
      </tbody></table></div></div>`;
    sortableTable($("#prodTbl"), ["Product", "Units", "Revenue", "Trend"], A.topProducts.map((p) => [p.name, p.units, p.revenue, p.trend]),
      [(x) => `<b>${esc(x)}</b>`, (x) => x.toLocaleString(), (x) => IP.money(x), (x) => `<span style="color:${x >= 0 ? C.green : C.red};font-weight:700">${x >= 0 ? "▲" : "▼"} ${Math.abs(x)}%</span>`]);
    const pv = A.topProducts.map((p) => [0.7, 0.85, 0.92, 1].map((f) => Math.round((p.revenue / 1000) * f)));
    scenes.push(IP.barScene($("#prod3d"), { values: pv, colors: [0x12305e, 0x2563eb, 0x60a5fa, 0xbfd3f7, 0x16a34a], tooltip: (r, c, val) => `${A.topProducts[r].name} · ${D.months.slice(-4)[c]}<br><b>$${val}k</b>`, radius: 14 }));
  };

  function sortableTable(tbl, headers, rows, fmts) {
    let col = 2, dir = -1;
    function draw() {
      const sorted = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : -1) * dir);
      tbl.innerHTML = `<thead><tr>${headers.map((h, i) => `<th class="${i ? "num" : ""}" data-i="${i}">${h} ${i === col ? (dir > 0 ? "↑" : "↓") : ""}</th>`).join("")}</tr></thead><tbody>` +
        sorted.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? "num" : ""}">${fmts[i](c)}</td>`).join("")}</tr>`).join("") + "</tbody>";
      $$("th", tbl).forEach((th) => th.onclick = () => { const i = +th.dataset.i; dir = i === col ? -dir : -1; col = i; draw(); });
    }
    draw();
  }

  /* ===================== SEO ===================== */
  VIEWS.seo = (v) => {
    const S = D.seo, n = S.clicks.length;
    v.innerHTML = head("SEO", "Rankings, organic traffic and site health.", `<button class="btn btn-primary" id="runAudit">${icon("zap")} Run site audit</button>`) +
    `<div class="kpis">${kpi("Organic clicks", IP.fmt(S.clicks[n - 1]), pct(S.clicks[n - 1], S.clicks[n - 2]), "ss1", "search")}${kpi("Impressions", IP.fmt(S.impressions[n - 1]), pct(S.impressions[n - 1], S.impressions[n - 2]), "ss2", "eye")}${kpi("Visibility score", S.visibility[n - 1] + "%", pct(S.visibility[n - 1], S.visibility[n - 2]), "ss3", "globe")}${kpi("Backlinks", S.backlinks[n - 1], pct(S.backlinks[n - 1], S.backlinks[n - 2]), "ss4", "plug")}</div>
    <div class="grid g-12">
      <div class="panel"><div class="panel-head"><h3>Site health</h3><span class="muted" id="auditTime" style="font-size:12px">Last audit: Oct 5</span></div>
        <div class="gauge-wrap"><div class="chart-box sm" style="width:100%"><canvas id="chHealth"></canvas></div><div class="g-num" id="healthNum">${S.health}</div><small>out of 100</small></div>
        <div class="list" id="issues">${S.issues.map((i) => `<div class="list-item"><span class="dot" style="color:var(--${i.sev === "red" ? "red" : i.sev === "amber" ? "amber" : "green"})"></span><span class="grow" style="font-size:14px">${i.text}</span></div>`).join("")}</div></div>
      <div class="panel"><div class="panel-head"><div><h3>Organic clicks vs impressions</h3><p>Google Search Console</p></div></div><div class="chart-box lg"><canvas id="chGsc"></canvas></div></div>
    </div>
    <div class="panel"><div class="panel-head"><div><h3>Keyword rankings</h3><p>Click a header to sort · filter by keyword</p></div><input class="input" id="kwFilter" placeholder="Filter keywords…" style="max-width:240px"></div><div class="tbl-wrap"><table class="tbl" id="kwTbl"></table></div></div>`;
    spark("ss1", S.clicks, C.blue); spark("ss2", S.impressions, C.navy); spark("ss3", S.visibility, C.green); spark("ss4", S.backlinks, C.amber);
    const hc = chart("chHealth", { type: "doughnut", data: { datasets: [{ data: [S.health, 100 - S.health], backgroundColor: [C.green, "#e7f6ec"], borderWidth: 0 }] }, options: { maintainAspectRatio: false, rotation: -90, circumference: 180, cutout: "75%", plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
    chart("chGsc", { type: "line", data: { labels: D.months, datasets: [
      { label: "Clicks", data: S.clicks, borderColor: C.blue, backgroundColor: "rgba(37,99,235,.08)", fill: true, tension: .35, yAxisID: "y" },
      { label: "Impressions", data: S.impressions, borderColor: C.navy, tension: .35, yAxisID: "y1", borderDash: [5, 4] }] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { ...axes(), y1: { position: "right", grid: { display: false }, border: { display: false }, ticks: { callback: (x) => IP.fmt(x) } } } } });
    function drawKw(q) {
      const rows = S.keywords.filter((k) => k.kw.includes(q.toLowerCase())).map((k) => [k.kw, k.pos, k.prev - k.pos, k.vol, k.url]);
      if (!rows.length) { $("#kwTbl").innerHTML = `<tbody><tr><td class="empty">No keywords match “${esc(q)}”.</td></tr></tbody>`; return; }
      sortableTable($("#kwTbl"), ["Keyword", "Position", "Change", "Search volume", "URL"], rows,
        [(x) => `<b>${esc(x)}</b>`, (x) => `<span class="badge ${x <= 3 ? "green" : x <= 10 ? "blue" : "gray"}">#${x}</span>`, (x) => x === 0 ? "—" : `<span style="color:${x > 0 ? C.green : C.red};font-weight:700">${x > 0 ? "▲" : "▼"} ${Math.abs(x)}</span>`, (x) => x.toLocaleString(), (x) => `<small class="muted">${esc(x)}</small>`]);
    }
    drawKw("");
    $("#kwFilter").oninput = (e) => drawKw(e.target.value.trim());
    $("#runAudit").onclick = (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = "Auditing 1,240 pages…";
      let h = S.health; const t = setInterval(() => { h = Math.min(91, h + 1); $("#healthNum").textContent = h; hc.data.datasets[0].data = [h, 100 - h]; hc.update(); if (h >= 91) { clearInterval(t); b.disabled = false; b.innerHTML = icon("zap") + " Run site audit"; $("#auditTime").textContent = "Last audit: just now"; $("#issues").insertAdjacentHTML("afterbegin", `<div class="list-item fade-in"><span class="dot" style="color:var(--green)"></span><span class="grow" style="font-size:14px">8 meta descriptions fixed since last audit</span></div>`); IP.toast("Audit complete — health score 91/100"); } }, 120);
    };
  };

  /* ===================== ADS ===================== */
  VIEWS.ads = (v) => {
    const AD = D.ads, sp = sum(AD.campaigns.map((c) => c.spend)), rv = sum(AD.campaigns.map((c) => c.revenue)), cv = sum(AD.campaigns.map((c) => c.conv));
    v.innerHTML = head("Paid ads", "Meta, Google and TikTok campaigns in one view.", `<div class="seg" id="platF"><button class="active" data-p="All">All</button><button data-p="Meta">Meta</button><button data-p="Google">Google</button><button data-p="TikTok">TikTok</button></div>`) +
    `<div class="kpis">${kpi("Ad spend", IP.money(sp), 6.2, null, "card")}${kpi("Attributed revenue", IP.money(rv), 14.8, null, "chart")}${kpi("ROAS", (rv / sp).toFixed(2) + "×", 8.1, null, "target")}${kpi("Cost per purchase", "$" + (sp / cv).toFixed(2), -5.4, null, "cart")}</div>
    <div class="grid g-2">
      <div class="panel"><div class="panel-head"><div><h3>Spend vs revenue by campaign</h3></div></div><div class="chart-box"><canvas id="chCamp"></canvas></div></div>
      <div class="panel"><div class="panel-head"><div><h3>Budget simulator</h3><p>Drag to see projected results next month</p></div></div>
        <label class="field"><span>Monthly budget: <b id="budVal"></b></span><input type="range" id="budget" min="5000" max="30000" step="500" value="${sp}" style="width:100%"></label>
        <div class="grid g-3" style="margin:0"><div class="kpi"><div class="k-top">Projected revenue</div><div class="k-val" id="pRev"></div></div><div class="kpi"><div class="k-top">Projected ROAS</div><div class="k-val" id="pRoas"></div></div><div class="kpi"><div class="k-top">Purchases</div><div class="k-val" id="pConv"></div></div></div>
        <p class="muted" style="font-size:12px;margin-top:12px">Model assumes diminishing returns above current spend, based on the last 12 months.</p>
        <div class="chart-box sm" style="margin-top:8px"><canvas id="chRoas"></canvas></div></div>
    </div>
    <div class="panel"><div class="panel-head"><h3>Campaigns</h3></div><div class="tbl-wrap"><table class="tbl" id="campTbl"></table></div></div>`;
    let cc;
    function draw(p) {
      const list = AD.campaigns.filter((c) => p === "All" || c.platform === p);
      $("#campTbl").innerHTML = `<thead><tr><th class="nosort">Campaign</th><th class="nosort">Status</th><th class="nosort num">Spend</th><th class="nosort num">Revenue</th><th class="nosort num">ROAS</th><th class="nosort num">Clicks</th><th class="nosort num">Purchases</th></tr></thead><tbody>` +
        list.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${statusBadge(c.status)}</td><td class="num">${IP.money(c.spend)}</td><td class="num">${IP.money(c.revenue)}</td><td class="num"><b style="color:${c.revenue / c.spend >= 3 ? C.green : C.amber}">${(c.revenue / c.spend).toFixed(1)}×</b></td><td class="num">${c.clicks.toLocaleString()}</td><td class="num">${c.conv}</td></tr>`).join("") + "</tbody>";
      const labels = list.map((c) => c.name.split("·")[1].trim());
      if (cc) { cc.data.labels = labels; cc.data.datasets[0].data = list.map((c) => c.spend); cc.data.datasets[1].data = list.map((c) => c.revenue); cc.update(); }
      else cc = chart("chCamp", { type: "bar", data: { labels, datasets: [{ label: "Spend", data: list.map((c) => c.spend), backgroundColor: C.pale, borderRadius: 5 }, { label: "Revenue", data: list.map((c) => c.revenue), backgroundColor: C.blue, borderRadius: 5 }] }, options: { maintainAspectRatio: false, scales: axes((x) => "$" + IP.fmt(x)) } });
    }
    $$("#platF button").forEach((b) => b.onclick = () => { $$("#platF button").forEach((x) => x.classList.toggle("active", x === b)); draw(b.dataset.p); });
    draw("All");
    const roas0 = rv / sp;
    function sim() {
      const b = +$("#budget").value, ratio = b / sp;
      const roas = roas0 * Math.pow(ratio, -0.28), rev = b * roas;
      $("#budVal").textContent = IP.money(b); $("#pRev").textContent = IP.money(rev); $("#pRoas").textContent = roas.toFixed(2) + "×"; $("#pConv").textContent = Math.round(rev / 82);
    }
    $("#budget").oninput = sim; sim();
    chart("chRoas", { type: "line", data: { labels: D.months, datasets: [{ label: "ROAS", data: AD.roasTrend, borderColor: C.green, backgroundColor: "rgba(22,163,74,.08)", fill: true, tension: .35 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axes((x) => x + "×") } });
  };

  /* ===================== PROJECTS ===================== */
  VIEWS.projects = (v) => {
    v.innerHTML = head("Projects", "Everything InboundPlus is building for you.", `<button class="btn btn-primary" id="newReq">${icon("plus")} New request</button>`) +
    `<div class="grid g-2">${D.projects.map((p) => `<div class="panel tilt"><div class="flex between"><span class="badge blue">${p.type}</span>${statusBadge(p.status)}</div>
      <h3 style="margin:12px 0 4px">${esc(p.name)}</h3><small class="muted">Due ${p.due}</small>
      <div class="flex" style="margin:14px 0"><div class="progress ${p.status === "At risk" ? "amber" : ""}" style="flex:1"><div style="width:${p.progress}%"></div></div><b>${p.progress}%</b></div>
      <div class="flex wrap-gap" style="gap:6px">${p.milestones.map((m) => `<span class="badge ${m.includes("✓") ? "green" : "gray"}">${esc(m)}</span>`).join("")}</div></div>`).join("")}</div>
    <div class="panel"><div class="panel-head"><div><h3>Task board</h3><p>Drag cards between columns · items in “Waiting on you” need your action</p></div></div><div class="kanban" id="kanban"></div></div>
    ${state.requests.length ? `<div class="panel" style="margin-top:20px"><div class="panel-head"><h3>Your requests</h3></div><div class="list">${state.requests.map((r) => `<div class="list-item"><span style="width:20px;color:${C.blue}">${icon("plus")}</span><div class="grow"><b style="font-size:14px">${esc(r.title)}</b><small>${esc(r.detail)} · submitted ${r.at}</small></div>${statusBadge("Learning").replace("Learning", "In review")}</div>`).join("")}</div></div>` : ""}`;
    const cols = ["Waiting on you", "To do", "In progress", "Done"];
    function draw() {
      $("#kanban").innerHTML = cols.map((c) => `<div class="kcol" data-col="${c}"><h4>${c}<span class="badge gray">${state.tasks.filter((t) => t.col === c).length}</span></h4>` +
        state.tasks.filter((t) => t.col === c).map((t) => `<div class="kcard" draggable="true" data-id="${t.id}"><b>${esc(t.title)}</b><div class="k-meta"><span>${esc(t.owner)}</span><span>${icon("calendar").replace("<svg", '<svg style="width:12px;vertical-align:-2px"')} ${t.due}</span></div></div>`).join("") + "</div>").join("");
      $$(".kcard").forEach((k) => {
        k.ondragstart = (e) => { e.dataTransfer.setData("text/plain", k.dataset.id); k.classList.add("dragging"); };
        k.ondragend = () => k.classList.remove("dragging");
      });
      $$(".kcol").forEach((col) => {
        col.ondragover = (e) => { e.preventDefault(); col.classList.add("over"); };
        col.ondragleave = () => col.classList.remove("over");
        col.ondrop = (e) => {
          e.preventDefault(); col.classList.remove("over");
          const t = state.tasks.find((x) => x.id === e.dataTransfer.getData("text/plain"));
          if (t && t.col !== col.dataset.col) { t.col = col.dataset.col; save(); draw(); IP.toast(`Moved “${t.title}” to ${t.col}`); }
        };
      });
    }
    draw();
    $("#newReq").onclick = () => requestModal("");
  };

  function requestModal(prefill) {
    modal(`<h2>New request</h2><p class="muted">Tell the team what you need. Your account manager replies within 1 business day.</p><br>
      <label class="field"><span>What do you need?</span><input class="input" id="rqT" value="${esc(prefill)}" placeholder="e.g. Black Friday landing page"></label>
      <label class="field"><span>Type</span><select class="input" id="rqType"><option>E-commerce</option><option>AI Agent</option><option>SEO</option><option>Paid ads</option><option>Integration</option><option>Report / analysis</option></select></label>
      <label class="field"><span>Details</span><textarea class="input" id="rqD" rows="3" placeholder="Goals, deadline, links…"></textarea></label>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="rqGo">Submit request</button></div>`, (m) => {
      $("#rqGo", m).onclick = () => {
        const t = $("#rqT", m).value.trim(); if (!t) { $("#rqT", m).focus(); return; }
        state.requests.unshift({ title: t, detail: $("#rqType", m).value, at: "just now" }); save(); closeModal();
        IP.toast("Request submitted — Lucía will follow up."); if (location.hash === "#projects") route(); else go("projects");
      };
    });
  }

  /* ===================== DEPLOYMENTS ===================== */
  VIEWS.deployments = (v) => {
    v.innerHTML = head("Software & deployments", "Live status of your store, AI agents and integrations.", `<button class="btn btn-primary" id="deployBtn">${icon("rocket")} Request deployment</button>`) +
    `<div class="grid g-2" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${D.apps.map((a) => `<div class="kpi tilt"><div class="k-top"><span>${a.env}</span>${statusBadge(a.health)}</div><div style="font-weight:700;font-size:16px;margin:10px 0 4px">${esc(a.name)}</div><small class="muted">${a.version} · ${a.uptime}% uptime (30d)</small><div class="flex" style="gap:2px;margin-top:10px">${Array.from({ length: 30 }, (_, i) => `<span title="Day ${i + 1}" style="flex:1;height:22px;border-radius:2px;background:${a.uptime < 100 && (i === 11 || (a.uptime < 99.95 && i === 23)) ? C.amber : C.green}"></span>`).join("")}</div></div>`).join("")}</div>
    <div class="grid g-21">
      <div class="panel"><div class="panel-head"><div><h3>Deployment history</h3><p>Every release, with status and notes</p></div><div class="seg" id="envF"><button class="active" data-e="All">All</button><button data-e="Production">Production</button><button data-e="Staging">Staging</button></div></div><div class="timeline" id="tl"></div></div>
      <div class="panel"><div class="panel-head"><h3>Pipeline</h3></div><div id="pipe"><p class="muted" style="font-size:14px">No deployment running. Click <b>Request deployment</b> to watch a release go through build → test → deploy.</p></div>
        <div class="chart-box sm" style="margin-top:16px"><canvas id="chDeploys"></canvas></div></div>
    </div>`;
    let env = "All";
    function drawTl() {
      $("#tl").innerHTML = state.deployments.filter((d) => env === "All" || d.env === env).map((d) => `<div class="tl-item ${d.status === "success" ? "ok" : d.status === "failed" ? "fail" : "run"} fade-in"><div class="flex between wrap-gap"><b>${esc(d.app)} <span class="muted" style="font-weight:500">${d.version}</span></b>${statusBadge(d.status)}</div><small>${d.id} · ${d.env} · ${esc(d.by)} · ${d.when}</small><p style="font-size:14px;margin-top:4px">${esc(d.notes)}</p></div>`).join("");
    }
    $$("#envF button").forEach((b) => b.onclick = () => { $$("#envF button").forEach((x) => x.classList.toggle("active", x === b)); env = b.dataset.e; drawTl(); });
    drawTl();
    chart("chDeploys", { type: "bar", data: { labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], datasets: [{ label: "Successful", data: [6, 8, 7, 11, 12, 4], backgroundColor: C.green, borderRadius: 4 }, { label: "Failed", data: [1, 0, 1, 1, 1, 0], backgroundColor: C.red, borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: C.grid } } } } });
    $("#deployBtn").onclick = () => modal(`<h2>Request deployment</h2><p class="muted">Choose what to release. The pipeline runs automatically after approval.</p><br>
      <label class="field"><span>Application</span><select class="input" id="dpApp">${D.apps.map((a) => `<option>${a.name}</option>`).join("")}</select></label>
      <label class="field"><span>Environment</span><select class="input" id="dpEnv"><option>Staging</option><option>Production</option></select></label>
      <label class="field"><span>Release notes</span><input class="input" id="dpNotes" placeholder="What's changing?"></label>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="dpGo">${icon("rocket")} Start deployment</button></div>`, (m) => {
      $("#dpGo", m).onclick = () => {
        const app = $("#dpApp", m).value, envSel = $("#dpEnv", m).value, notes = $("#dpNotes", m).value.trim() || "Client-requested release";
        closeModal(); runPipeline(app, envSel, notes, drawTl);
      };
    });
  };
  function runPipeline(app, env, notes, done) {
    const steps = ["Build", "Unit tests", "Security scan", "Deploy to " + env, "Health check"];
    const ver = "v" + (2 + Math.floor(Math.random() * 2)) + "." + Math.floor(Math.random() * 9) + "." + Math.floor(Math.random() * 9);
    $("#pipe").innerHTML = `<b>${esc(app)} ${ver}</b><small class="muted" style="display:block;margin-bottom:12px">→ ${env}</small>` + steps.map((s, i) => `<div class="list-item" id="st${i}"><span class="badge gray" style="width:72px;justify-content:center">Queued</span><span class="grow" style="font-size:14px">${s}</span></div>`).join("") + `<div class="progress" style="margin-top:12px"><div id="pipeBar" style="width:0"></div></div>`;
    let i = 0;
    const tick = () => {
      if (i > 0) $(`#st${i - 1} .badge`).outerHTML = `<span class="badge green" style="width:72px;justify-content:center">Passed</span>`;
      if (i === steps.length) {
        state.deployments.unshift({ id: "d-" + (1044 + state.deployments.length - 5), app, env, version: ver, status: "success", by: session.name + " (request)", when: "Just now", notes });
        save(); done(); IP.toast(`${app} ${ver} deployed to ${env} ✓`); return;
      }
      const st = $(`#st${i} .badge`); if (!st) return;
      st.outerHTML = `<span class="badge amber" style="width:72px;justify-content:center">Running</span>`;
      $("#pipeBar").style.width = ((i + 1) / steps.length) * 100 + "%";
      i++; setTimeout(tick, 900);
    };
    tick();
  }

  /* ===================== AI AGENTS ===================== */
  const _A = D.analytics, _n = _A.revenue.length;
  const ST = { rev: pct(_A.revenue[_n - 1], _A.revenue[_n - 2]).toFixed(1), ord: pct(_A.orders[_n - 1], _A.orders[_n - 2]).toFixed(0), conv: _A.convRate[_n - 1] };
  const AGENT_REPLIES = {
    a1: [[/order|pedido|where/i, "I can check that! Order #A-48213 shipped yesterday via Olva Courier and should arrive in Lima on Thursday. Want the tracking link?"], [/return|devol|exchange/i, "No problem — returns are free within 30 days. I've started a return for you; you'll get a prepaid label by email in a few minutes."], [/size|talla/i, "The Trail Runner X2 fits true to size. If you're between sizes, most customers go half a size up."], [/./, "Hi! I'm Sofía, Andes Outdoor's assistant. I can help with orders, returns, sizing and product questions."]],
    a2: [[/./, "Here are 3 ad variants for Trail Runner X2:\n\n1. “Built for the Andes. Ready for your weekend.” — CTA: Shop now\n2. “Grip that doesn't quit, from Lima to Cusco.” — CTA: Find your size\n3. “40,000 runners can't be wrong. Free shipping today.” — CTA: Get yours\n\nVariant 2 matches your best-performing angle (local pride, +22% CTR last month)."]],
    a3: [[/revenue|sales|ventas/i, `Revenue this month is up ${ST.rev}% vs September, driven mainly by organic search (+11%) and Meta retargeting (ROAS 6.9×). Mobile conversion is still 41% lower than desktop — the one-page checkout test should close part of that gap.`], [/seo|rank/i, "SEO is trending well: 5 of 8 tracked keywords improved. “zapatillas trail running” moved from #7 to #3. The biggest open issue is 14 product pages missing meta descriptions."], [/ads|roas|campaign/i, "Blended ROAS is 4.6×. I'd pause TikTok Awareness (1.8×) and move ~$800 to Meta Retargeting, which is under-funded at 6.9×."], [/./, `Weekly summary: revenue +${ST.rev}%, orders +${ST.ord}%, conversion ${ST.conv}%. Top product: Trail Runner X2. Recommended focus: checkout UX on mobile and Black Friday campaign prep. Ask me about revenue, SEO or ads for details.`]],
    a4: [[/./, "Draft reply to a 4★ review: “Thanks so much, María! We're glad the hoodie keeps you warm. Sorry the delivery took longer than expected — we've added a new courier for Arequipa to speed things up.”"]],
  };
  const SUGGESTS = { a1: ["Where is my order?", "I want to return shoes", "What size should I get?"], a2: ["Write ads for Trail Runner X2"], a3: ["How is revenue doing?", "How is SEO trending?", "What should we do with ads?"], a4: ["Reply to latest review"] };
  let curAgent = "a3";
  VIEWS.agents = (v) => {
    v.innerHTML = head("AI agents", "Claude-powered agents working for your brand — monitor them and test them live.", `<button class="btn btn-ghost" onclick="Portal.go('software')">${icon("plus")} Add an agent</button>`) +
    `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))" id="agentCards"></div>
    <div class="grid g-12">
      <div class="panel"><div class="panel-head"><div><h3>Conversations this week</h3><p>All agents</p></div></div><div class="chart-box"><canvas id="chAg"></canvas></div>
        <div class="list" style="margin-top:8px"><div class="list-item"><span class="grow">Avg. first response</span><b>4 sec</b></div><div class="list-item"><span class="grow">Handed off to humans</span><b>11%</b></div><div class="list-item"><span class="grow">Abandoned carts recovered</span><b>142</b></div></div></div>
      <div class="panel chat"><div class="panel-head"><div><h3 id="chatTitle">Chat</h3><p>Test your agent with sample questions</p></div></div><div class="suggests" id="suggests"></div><div class="chat-log" id="chatLog"></div>
        <form class="chat-input" id="chatForm"><input class="input" id="chatIn" placeholder="Type a message…" autocomplete="off"><button class="btn btn-primary" aria-label="Send">${icon("send").replace("<svg", '<svg style="width:18px"')}</button></form></div>
    </div>`;
    function cards() {
      $("#agentCards").innerHTML = state.agents.map((a) => `<div class="panel agent-card tilt ${a.id === curAgent ? "selected" : ""}" data-id="${a.id}">
        <div class="flex between"><div class="avatar ${a.active ? "green" : ""}">${icon("bot").replace("<svg", '<svg style="width:18px"')}</div><label class="switch" title="Enable / pause"><input type="checkbox" ${a.active ? "checked" : ""} data-tog="${a.id}"><span></span></label></div>
        <div><b>${esc(a.name)}</b><br><small class="muted">${esc(a.channel)}</small></div>
        <div class="agent-stats"><div><b>${a.convos.toLocaleString()}</b>chats</div><div><b>${a.resolved}%</b>resolved</div><div><b>${a.csat}★</b>CSAT</div></div></div>`).join("");
      IP.tilt($("#agentCards"));
      $$(".agent-card").forEach((c) => c.onclick = (e) => { if (e.target.closest(".switch")) return; select(c.dataset.id); });
      $$("[data-tog]").forEach((t) => t.onchange = () => { const a = state.agents.find((x) => x.id === t.dataset.tog); a.active = t.checked; save(); IP.toast(`${a.name} ${a.active ? "activated" : "paused"}`); cards(); });
    }
    function select(id) {
      curAgent = id; cards();
      const a = state.agents.find((x) => x.id === id);
      $("#chatTitle").textContent = "Chat with " + a.name;
      $("#chatLog").innerHTML = ""; addMsg(false, AGENT_REPLIES[id].slice(-1)[0][1]);
      $("#suggests").innerHTML = SUGGESTS[id].map((s) => `<button class="chip" type="button">${esc(s)}</button>`).join("");
      $$("#suggests .chip").forEach((b) => b.onclick = () => send(b.textContent));
    }
    function addMsg(me, text) {
      const d = document.createElement("div"); d.className = "msg " + (me ? "me" : "bot");
      d.innerHTML = esc(text) + `<small>${me ? "You" : "Agent"} · now</small>`;
      $("#chatLog").appendChild(d); $("#chatLog").scrollTop = 1e6;
    }
    function send(text) {
      if (!text.trim()) return;
      addMsg(true, text); $("#chatIn").value = "";
      const typing = document.createElement("div"); typing.className = "msg bot"; typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      $("#chatLog").appendChild(typing); $("#chatLog").scrollTop = 1e6;
      const reply = AGENT_REPLIES[curAgent].find(([re]) => re.test(text))[1];
      setTimeout(() => { typing.remove(); addMsg(false, reply); }, 900 + Math.random() * 600);
    }
    $("#chatForm").onsubmit = (e) => { e.preventDefault(); send($("#chatIn").value); };
    window.Portal.selectAgent = select;
    select(curAgent);
    chart("chAg", { type: "bar", data: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ label: "Resolved by AI", data: [212, 240, 228, 260, 301, 342, 259], backgroundColor: C.blue, borderRadius: 4 }, { label: "Handed to team", data: [28, 31, 25, 33, 36, 40, 30], backgroundColor: C.pale, borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: C.grid } } } } });
  };

  /* ===================== SOFTWARE CATALOG ===================== */
  VIEWS.software = (v) => {
    const cats = ["All", ...new Set(D.software.map((s) => s.cat))];
    v.innerHTML = head("Software & solutions", "Add new capabilities to your store. Request one and track the rollout under Projects.", "") +
      `<div class="filter-row" style="justify-content:flex-start" id="swF">${cats.map((c, i) => `<button class="chip ${i ? "" : "active"}" data-c="${c}">${c}</button>`).join("")}</div><div class="grid g-3" id="swG"></div>`;
    function draw(cat) {
      $("#swG").innerHTML = D.software.filter((s) => cat === "All" || s.cat === cat).map((s) => `<div class="panel tilt sw-card fade-in" style="display:flex;flex-direction:column;gap:10px">
        <div class="sw-top"><span class="badge blue">${s.cat}</span>${s.status ? `<span class="badge ${s.status === "New" ? "green" : "amber"}">${s.status}</span>` : ""}</div>
        <h3 style="font-size:17px">${esc(s.name)}</h3><p class="muted" style="font-size:14px">${esc(s.desc)}</p>
        <ul style="margin:0;padding-left:18px;color:var(--muted);font-size:13px">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        <div class="flex between" style="margin-top:auto;padding-top:8px"><b style="color:${C.navy};font-size:13px">${esc(s.price)}</b><button class="btn btn-sm btn-primary" data-req="${esc(s.name)}">Request</button></div></div>`).join("");
      IP.tilt($("#swG"));
      $$("[data-req]").forEach((b) => b.onclick = () => requestModal(b.dataset.req));
    }
    $$("#swF .chip").forEach((b) => b.onclick = () => { $$("#swF .chip").forEach((x) => x.classList.toggle("active", x === b)); draw(b.dataset.c); });
    draw("All");
  };

  /* ===================== REPORTS ===================== */
  VIEWS.reports = (v) => {
    v.innerHTML = head("Reports", "Monthly, quarterly and custom reports — view online or save as PDF.", `<button class="btn btn-primary" id="buildRep">${icon("plus")} Build custom report</button>`) +
    `<div class="grid g-21"><div class="panel"><div class="panel-head"><h3>Report library</h3><div class="seg" id="repF"><button class="active" data-t="All">All</button><button data-t="Monthly">Monthly</button><button data-t="Quarterly">Quarterly</button><button data-t="Audit">Audits</button></div></div><div class="list" id="repList"></div></div>
     <div class="panel"><div class="panel-head"><h3>Scheduled reports</h3></div><div class="list">
       ${[["Weekly KPI digest", "Every Monday 8:00", true], ["Monthly performance", "1st business day", true], ["Ads pacing alert", "When spend > 90% of budget", false]].map(([t, w, on], i) => `<div class="list-item"><div class="grow"><b style="font-size:14px">${t}</b><small>${w}</small></div><label class="switch"><input type="checkbox" ${on ? "checked" : ""} data-sch="${i}"><span></span></label></div>`).join("")}
     </div><div class="demo-note" style="margin-top:14px">Reports are emailed to ${esc(session.email)} and stored here.</div></div></div>`;
    let t = "All";
    function draw() {
      $("#repList").innerHTML = state.reports.filter((r) => t === "All" || r.type === t).map((r) => `<div class="list-item fade-in"><div class="file-ico pdf">PDF</div><div class="grow"><b style="font-size:14px">${esc(r.name)}</b><small>${r.type} · ${r.date} · ${r.pages} pages</small></div><button class="btn btn-sm btn-ghost" data-view="${r.id}">${icon("eye").replace("<svg", '<svg style="width:15px"')} View</button><button class="btn btn-sm btn-ghost" data-dl="${r.id}">${icon("download").replace("<svg", '<svg style="width:15px"')} PDF</button></div>`).join("") || `<div class="empty">No reports of this type yet.</div>`;
      $$("[data-view]").forEach((b) => b.onclick = () => viewReport(state.reports.find((r) => r.id === b.dataset.view)));
      $$("[data-dl]").forEach((b) => b.onclick = () => printReport(state.reports.find((r) => r.id === b.dataset.dl)));
    }
    $$("#repF button").forEach((b) => b.onclick = () => { $$("#repF button").forEach((x) => x.classList.toggle("active", x === b)); t = b.dataset.t; draw(); });
    $$("[data-sch]").forEach((s) => s.onchange = () => IP.toast(s.checked ? "Schedule turned on" : "Schedule paused"));
    draw();
    $("#buildRep").onclick = () => modal(`<h2>Build a custom report</h2><p class="muted">Pick the sections and period. We'll generate it instantly.</p><br>
      <label class="field"><span>Report name</span><input class="input" id="crN" value="Custom report – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}"></label>
      <label class="field"><span>Period</span><select class="input" id="crP"><option>Last 30 days</option><option>Last quarter</option><option>Year to date</option></select></label>
      <div class="field"><span style="font-weight:600;font-size:13px;display:block;margin-bottom:8px">Sections</span>${["Sales & revenue", "Traffic & conversion", "SEO", "Paid ads", "AI agents", "Deployments"].map((s, i) => `<label class="opt"><input type="checkbox" ${i < 4 ? "checked" : ""} value="${s}"> ${s}</label>`).join("")}</div>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="crGo">Generate report</button></div>`, (m) => {
      $("#crGo", m).onclick = () => {
        const secs = $$("input[type=checkbox]:checked", m).map((x) => x.value);
        if (!secs.length) return IP.toast("Pick at least one section.");
        const r = { id: "r" + Date.now(), name: $("#crN", m).value.trim() || "Custom report", type: "Custom", date: "Today", pages: 2 + secs.length * 2, sections: secs };
        state.reports.unshift(r); save(); closeModal(); t = "All"; draw(); viewReport(r);
      };
    });
  };
  function reportBody(r) {
    const A = D.analytics, n = A.revenue.length;
    const secs = r.sections || ["Sales & revenue", "Traffic & conversion", "SEO", "Paid ads"];
    const block = {
      "Sales & revenue": `Revenue reached <b>${IP.money(A.revenue[n - 1])}</b> (+${pct(A.revenue[n - 1], A.revenue[n - 2]).toFixed(1)}%), with ${A.orders[n - 1].toLocaleString()} orders and an AOV of $${A.aov[n - 1]}.`,
      "Traffic & conversion": `${A.sessions[n - 1].toLocaleString()} sessions; conversion rate ${A.convRate[n - 1]}%. Mobile is 68% of traffic.`,
      SEO: `Site health ${D.seo.health}/100. 5 of 8 tracked keywords improved; “zapatillas trail running” now ranks #3.`,
      "Paid ads": `Blended ROAS 4.6×. Meta Retargeting is the top performer at 6.9×; TikTok Awareness recommended for pause.`,
      "AI agents": `Agents handled ${sum(state.agents.map((a) => a.convos)).toLocaleString()} conversations and saved ${sum(state.agents.map((a) => a.saved))} team hours.`,
      Deployments: `${state.deployments.length} releases logged; latest: ${state.deployments[0].app} ${state.deployments[0].version}.`,
    };
    return secs.map((s) => `<h3 style="margin:16px 0 6px;font-size:15px">${s}</h3><p style="font-size:14px">${block[s] || ""}</p>`).join("");
  }
  function viewReport(r) {
    modal(`<span class="badge blue">${r.type}</span><h2 style="margin-top:10px">${esc(r.name)}</h2><p class="muted">${esc(session.company)} · ${r.date}</p>${reportBody(r)}
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" id="rpDl">${icon("download").replace("<svg", '<svg style="width:16px"')} Save as PDF</button></div>`, (m) => { $("#rpDl", m).onclick = () => printReport(r); });
  }
  function printReport(r) {
    const w = window.open("", "_blank");
    if (!w) return IP.toast("Allow pop-ups to save the PDF.");
    w.document.write(`<!doctype html><html><head><title>${esc(r.name)}</title><style>body{font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:720px;margin:40px auto;padding:0 20px}h1{color:#12305e}.top{display:flex;justify-content:space-between;border-bottom:2px solid #12305e;padding-bottom:12px;margin-bottom:20px}</style></head><body><div class="top"><b>InboundPlus</b><span>${esc(session.company)}</span></div><h1>${esc(r.name)}</h1><p>${r.type} report · ${r.date}</p>${reportBody(r)}<p style="margin-top:40px;color:#64748b;font-size:12px">Prototype report with sample data.</p><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  /* ===================== SURVEYS ===================== */
  VIEWS.surveys = (v) => {
    const R = state.survey;
    v.innerHTML = head("Surveys", "Tell us how we're doing — results update live.", "") +
    `<div class="grid g-2">
      <div class="panel" id="surveyPanel"><div class="panel-head"><div><h3>${D.survey.title}</h3><p>Takes about 1 minute</p></div>${R.submitted ? statusBadge("Approved").replace("Approved", "Submitted") : statusBadge("Due").replace("Due", "Open")}</div>
        <form id="svForm">
          <div class="survey-q"><h4>1. How likely are you to recommend InboundPlus to a colleague? (0–10)</h4><div class="stars" id="nps" style="flex-wrap:wrap">${Array.from({ length: 11 }, (_, i) => `<button type="button" data-v="${i}" style="width:36px;height:36px">${i}</button>`).join("")}</div></div>
          <div class="survey-q"><h4>2. Overall satisfaction this quarter</h4><div class="stars" id="sat">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-v="${i}">${i}★</button>`).join("")}</div></div>
          <div class="survey-q"><h4>3. What should we prioritise next?</h4>${Object.keys(R.priorities).map((p) => `<label class="opt"><input type="radio" name="prio" value="${p}"> ${p}</label>`).join("")}</div>
          <div class="survey-q"><h4>4. Anything else?</h4><textarea class="input" rows="3" id="svC" placeholder="Optional"></textarea></div>
          <div class="form-error" id="svErr"></div>
          <button class="btn btn-primary" ${R.submitted ? "disabled" : ""}>${R.submitted ? "Thanks — response recorded" : "Submit response"}</button>
        </form></div>
      <div class="panel"><div class="panel-head"><div><h3>Live results</h3><p id="svResp">${R.responses} responses</p></div><div style="text-align:right"><small class="muted">NPS</small><div style="font-size:30px;font-weight:800;color:${C.navy}" id="npsVal">${R.nps}</div></div></div>
        <div class="chart-box sm"><canvas id="chSat"></canvas></div><div class="chart-box sm" style="margin-top:16px"><canvas id="chPrio"></canvas></div></div>
    </div>`;
    let nps = null, sat = null;
    const pick = (id, cb) => $$(`#${id} button`).forEach((b) => b.onclick = () => { $$(`#${id} button`).forEach((x) => x.classList.toggle("on", +x.dataset.v <= +b.dataset.v && (id === "sat" || x === b))); cb(+b.dataset.v); });
    pick("nps", (x) => nps = x); pick("sat", (x) => sat = x);
    const cs = chart("chSat", { type: "bar", data: { labels: ["1★", "2★", "3★", "4★", "5★"], datasets: [{ label: "Responses", data: R.satisfaction, backgroundColor: [C.red, C.amber, C.gray, C.sky, C.blue], borderRadius: 5 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: "Satisfaction" } }, scales: axes() } });
    const cp = chart("chPrio", { type: "bar", data: { labels: Object.keys(R.priorities), datasets: [{ data: Object.values(R.priorities), backgroundColor: C.navy, borderRadius: 5 }] }, options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: "Priorities" } }, scales: { x: { grid: { color: C.grid } }, y: { grid: { display: false } } } } });
    $("#svForm").onsubmit = (e) => {
      e.preventDefault(); if (R.submitted) return;
      const prio = ($("input[name=prio]:checked") || {}).value;
      if (nps == null || sat == null || !prio) return ($("#svErr").textContent = "Please answer questions 1–3.");
      R.satisfaction[sat - 1]++; R.priorities[prio]++; R.responses++; R.submitted = true;
      R.nps = Math.round(R.nps + ((nps >= 9 ? 100 : nps <= 6 ? -100 : 0) - R.nps) / R.responses);
      save();
      cs.data.datasets[0].data = R.satisfaction; cs.update(); cp.data.datasets[0].data = Object.values(R.priorities); cp.update();
      $("#npsVal").textContent = R.nps; $("#svResp").textContent = R.responses + " responses";
      const btn = $("#svForm button.btn-primary"); btn.disabled = true; btn.textContent = "Thanks — response recorded"; $("#svErr").textContent = "";
      IP.toast("Thank you! Your feedback was recorded.");
    };
  };

  /* ===================== BLOG ===================== */
  VIEWS.blog = (v) => {
    const cats = ["All", ...new Set(D.blog.map((b) => b.cat))];
    v.innerHTML = head("Blog & insights", "Playbooks from the InboundPlus team, curated for your store.", "") +
      `<div class="filter-row" style="justify-content:flex-start" id="bF">${cats.map((c, i) => `<button class="chip ${i ? "" : "active"}" data-c="${c}">${c}</button>`).join("")}</div><div class="grid g-3" id="bG"></div>`;
    function draw(cat) {
      $("#bG").innerHTML = D.blog.filter((b) => cat === "All" || b.cat === cat).map((b) => `<article class="card tilt blog-card fade-in" data-b="${b.id}" style="cursor:pointer"><div class="blog-thumb">${icon(b.icon)}</div><div class="blog-body"><div class="blog-meta"><span class="badge gray">${b.cat}</span><span>${b.date}</span><span>${b.read}</span></div><h3>${esc(b.title)}</h3><p>${esc(b.excerpt)}</p></div></article>`).join("");
      IP.tilt($("#bG"));
      $$("[data-b]").forEach((a) => a.onclick = () => { const b = D.blog.find((x) => x.id === +a.dataset.b); modal(`<span class="badge gray">${b.cat}</span><h2 style="margin-top:10px">${esc(b.title)}</h2><p class="muted">${b.date} · ${b.read} read</p><br><p>${esc(b.excerpt)}</p><br><p class="muted">Full article content would appear here, pulled from the agency's CMS.</p><div class="modal-foot"><button class="btn btn-primary" data-close>Close</button></div>`); });
    }
    $$("#bF .chip").forEach((b) => b.onclick = () => { $$("#bF .chip").forEach((x) => x.classList.toggle("active", x === b)); draw(b.dataset.c); });
    draw("All");
  };

  /* ===================== FILES ===================== */
  VIEWS.files = (v) => {
    v.innerHTML = head("Files & approvals", "Share assets with the team and approve deliverables.", `<div class="seg" id="fF"><button class="active" data-s="All">All</button><button data-s="Needs approval">Needs approval</button><button data-s="Approved">Approved</button></div>`) +
      `<div class="panel"><div class="dropzone" id="dz">${icon("upload").replace("<svg", '<svg style="width:28px;display:block;margin:0 auto 8px"')}Drop files here or click to upload<input type="file" id="fileIn" multiple hidden></div><div class="file-grid" id="fG"></div></div>`;
    let f = "All";
    function draw() {
      $("#fG").innerHTML = state.files.filter((x) => f === "All" || x.status === f).map((x, i) => `<div class="file-card tilt fade-in"><div class="flex between"><div class="file-ico ${x.type}">${x.type.toUpperCase()}</div>${statusBadge(x.status)}</div><b style="font-size:14px;word-break:break-all">${esc(x.name)}</b><small class="muted">${x.size} · ${esc(x.by)}</small>
        ${x.status === "Needs approval" ? `<div class="flex"><button class="btn btn-sm btn-success" data-ap="${esc(x.name)}">${icon("check").replace("<svg", '<svg style="width:14px"')} Approve</button><button class="btn btn-sm btn-danger" data-rj="${esc(x.name)}">Request changes</button></div>` : ""}</div>`).join("") || `<div class="empty">Nothing here.</div>`;
      IP.tilt($("#fG"));
      $$("[data-ap]").forEach((b) => b.onclick = () => setStatus(b.dataset.ap, "Approved"));
      $$("[data-rj]").forEach((b) => b.onclick = () => setStatus(b.dataset.rj, "Rejected"));
    }
    function setStatus(name, s) { state.files.find((x) => x.name === name).status = s; save(); draw(); drawNav("files"); IP.toast(s === "Approved" ? `Approved ${name}` : `Change request sent for ${name}`); }
    function add(files) {
      [...files].forEach((fl) => { const ext = (fl.name.split(".").pop() || "").toLowerCase(); state.files.unshift({ name: fl.name, type: ext === "pdf" ? "pdf" : ["xls", "xlsx", "csv"].includes(ext) ? "xls" : ["mp4", "mov"].includes(ext) ? "mp4" : "fig", size: (fl.size / 1048576).toFixed(1) + " MB", by: "You", status: "Shared" }); });
      save(); draw(); IP.toast(`${files.length} file(s) shared with the team`);
    }
    $$("#fF button").forEach((b) => b.onclick = () => { $$("#fF button").forEach((x) => x.classList.toggle("active", x === b)); f = b.dataset.s; draw(); });
    const dz = $("#dz");
    dz.onclick = () => $("#fileIn").click();
    $("#fileIn").onchange = (e) => e.target.files.length && add(e.target.files);
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("over"); };
    dz.ondragleave = () => dz.classList.remove("over");
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("over"); e.dataTransfer.files.length && add(e.dataTransfer.files); };
    draw();
  };

  /* ===================== MESSAGES ===================== */
  VIEWS.messages = (v) => {
    v.innerHTML = head("Messages", "Talk to your InboundPlus team.", "") + `<div class="panel" style="padding:0"><div class="thread"><div class="thread-list" id="thL"></div><div class="thread-main chat" style="padding-right:18px;padding-top:16px;height:100%"><div class="chat-log" id="thLog"></div><form class="chat-input" id="thForm" style="padding-bottom:16px"><input class="input" id="thIn" placeholder="Write a message…" autocomplete="off"><button class="btn btn-primary">Send</button></form></div></div></div>`;
    let cur = state.threads[0].id;
    function list() {
      $("#thL").innerHTML = state.threads.map((t) => `<div class="thread-item ${t.id === cur ? "active" : ""}" data-t="${t.id}"><div class="flex"><div class="avatar sm ${t.initials === "IP" ? "" : "blue"}">${t.initials}</div><div class="grow"><b>${esc(t.with)} ${t.unread ? `<span class="dot" style="color:${C.red}"></span>` : ""}</b><small>${esc(t.role)}</small></div></div><small style="display:block;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.msgs[t.msgs.length - 1].t)}</small></div>`).join("");
      $$("[data-t]").forEach((el) => el.onclick = () => { cur = el.dataset.t; open(); });
    }
    function open() {
      const t = state.threads.find((x) => x.id === cur); t.unread = false; save(); drawNav("messages"); list();
      $("#thLog").innerHTML = t.msgs.map((m) => `<div class="msg ${m.me ? "me" : "bot"}">${esc(m.t)}<small>${m.me ? "You" : esc(t.with)} · ${m.at}</small></div>`).join("");
      $("#thLog").scrollTop = 1e6;
    }
    $("#thForm").onsubmit = (e) => {
      e.preventDefault(); const txt = $("#thIn").value.trim(); if (!txt) return;
      const t = state.threads.find((x) => x.id === cur); t.msgs.push({ me: true, t: txt, at: "now" }); $("#thIn").value = ""; save(); open();
      setTimeout(() => { t.msgs.push({ me: false, t: "Thanks! I've got it and will get back to you shortly. 👍", at: "now" }); save(); if (location.hash === "#messages" && cur === t.id) open(); }, 1400);
    };
    open();
  };

  /* ===================== BILLING ===================== */
  VIEWS.billing = (v) => {
    const r = D.client.retainer;
    v.innerHTML = head("Billing", "Your plan, retainer hours and invoices.", "") +
    `<div class="grid g-3">
      <div class="panel tilt"><small class="muted">Current plan</small><h3 style="margin:6px 0;font-size:20px;color:${C.navy}">${D.client.plan}</h3><p class="muted" style="font-size:14px">$10,000 / month · renews Nov 1, 2026</p><button class="btn btn-sm btn-ghost" style="margin-top:14px" id="chgPlan">Compare plans</button></div>
      <div class="panel tilt"><small class="muted">Retainer hours (October)</small><div style="font-size:28px;font-weight:800;color:${C.navy};margin:6px 0">${r.used} / ${r.hours} h</div><div class="progress"><div style="width:${(r.used / r.hours) * 100}%"></div></div><small class="muted">${r.hours - r.used} hours remaining · resets Nov 1</small></div>
      <div class="panel tilt"><small class="muted">Balance due</small><div style="font-size:28px;font-weight:800;color:${C.amber};margin:6px 0">${IP.money(sum(D.invoices.filter((i) => i.status === "Due").map((i) => i.amount)))}</div><small class="muted">Due Oct 15, 2026 · Bank transfer or card</small></div>
    </div>
    <div class="panel"><div class="panel-head"><h3>Invoices</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="nosort">Invoice</th><th class="nosort">Date</th><th class="nosort">Description</th><th class="nosort num">Amount</th><th class="nosort">Status</th><th class="nosort"></th></tr></thead><tbody>
      ${D.invoices.map((i) => `<tr><td><b>${i.id}</b></td><td>${i.date}</td><td>${esc(i.desc)}</td><td class="num">${IP.money(i.amount)}</td><td>${statusBadge(i.status)}</td><td><button class="btn btn-sm btn-ghost" data-inv="${i.id}">View</button></td></tr>`).join("")}
    </tbody></table></div></div>`;
    $$("[data-inv]").forEach((b) => b.onclick = () => { const i = D.invoices.find((x) => x.id === b.dataset.inv); modal(`<h2>${i.id}</h2><p class="muted">${i.date} · ${esc(session.company)}</p><br><div class="list"><div class="list-item"><span class="grow">${esc(i.desc)}</span><b>${IP.money(i.amount)}</b></div><div class="list-item"><span class="grow">Tax</span><b>$0</b></div><div class="list-item"><b class="grow">Total</b><b>${IP.money(i.amount)}</b></div></div><div class="modal-foot"><button class="btn btn-primary" data-close>Close</button></div>`); });
    $("#chgPlan").onclick = () => modal(`<h2>Plans</h2><p class="muted">Contact your account manager to change plans.</p><br><div class="list">${[["Ecommerce Growth Blueprint", "$2,000 one-time"], ["Ecommerce Growth Advisory", "from $3,000 / month"], ["Commerce Growth Partner", "from $10,000 / month"]].map(([n, p]) => `<div class="list-item"><b class="grow">${n}</b><span>${p}</span>${n === D.client.plan ? statusBadge("Active") : ""}</div>`).join("")}</div><div class="modal-foot"><button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" onclick="Portal.go('messages')">Message account manager</button></div>`, (m) => $(".btn-primary", m).addEventListener("click", closeModal));
  };

  /* ===================== SETTINGS ===================== */
  VIEWS.settings = (v) => {
    v.innerHTML = head("Settings", "Profile, team, notifications and data connections.", "") +
    `<div class="grid g-2">
      <div class="panel"><div class="panel-head"><h3>Profile</h3></div>
        <label class="field"><span>Name</span><input class="input" id="sN" value="${esc(session.name)}"></label>
        <label class="field"><span>Company</span><input class="input" id="sC" value="${esc(session.company)}"></label>
        <label class="field"><span>Email</span><input class="input" value="${esc(session.email)}" disabled></label>
        <button class="btn btn-primary" id="sSave">Save changes</button></div>
      <div class="panel"><div class="panel-head"><h3>Data connections</h3><p>Powers your dashboards</p></div><div class="list" id="ints"></div></div>
      <div class="panel"><div class="panel-head"><h3>Team members</h3><button class="btn btn-sm btn-ghost" id="invite">${icon("plus").replace("<svg", '<svg style="width:14px"')} Invite</button></div><div class="list" id="team"></div></div>
      <div class="panel"><div class="panel-head"><h3>Email notifications</h3></div><div class="list">${[["weekly", "Weekly KPI digest"], ["deploy", "Deployment updates"], ["approvals", "Files needing approval"], ["invoices", "Invoices & billing"]].map(([k, t]) => `<div class="list-item"><span class="grow">${t}</span><label class="switch"><input type="checkbox" data-n="${k}" ${state.notifs[k] ? "checked" : ""}><span></span></label></div>`).join("")}</div></div>
    </div>`;
    const team = IP.store.get("team", [{ n: session.name, e: session.email, r: "Owner" }, { n: "Diego Paredes", e: "diego@andesoutdoor.example", r: "Marketing" }]);
    const drawTeam = () => $("#team").innerHTML = team.map((t) => `<div class="list-item"><div class="avatar sm">${esc(t.n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase())}</div><div class="grow"><b style="font-size:14px">${esc(t.n)}</b><small>${esc(t.e)}</small></div><span class="badge gray">${esc(t.r)}</span></div>`).join("");
    drawTeam();
    const drawInts = () => $("#ints").innerHTML = Object.entries(state.integrations).map(([k, on]) => `<div class="list-item"><span style="width:20px;color:${on ? C.green : C.gray}">${icon("plug")}</span><span class="grow">${k}<small>${on ? "Connected · synced 12 min ago" : "Not connected"}</small></span><button class="btn btn-sm ${on ? "btn-ghost" : "btn-primary"}" data-i="${k}">${on ? "Disconnect" : "Connect"}</button></div>`).join("");
    drawInts();
    $("#ints").onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const k = b.dataset.i; state.integrations[k] = !state.integrations[k]; save(); drawInts(); IP.toast(`${k} ${state.integrations[k] ? "connected (demo)" : "disconnected"}`); };
    $$("[data-n]").forEach((s) => s.onchange = () => { state.notifs[s.dataset.n] = s.checked; save(); IP.toast("Preference saved"); });
    $("#sSave").onclick = () => { session.name = $("#sN").value.trim() || session.name; session.company = $("#sC").value.trim() || session.company; session.initials = session.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase(); IP.store.set("session", session); paintUser(); IP.toast("Profile updated"); };
    $("#invite").onclick = () => modal(`<h2>Invite a teammate</h2><br><label class="field"><span>Name</span><input class="input" id="iN"></label><label class="field"><span>Email</span><input class="input" id="iE" type="email"></label><label class="field"><span>Role</span><select class="input" id="iR"><option>Viewer</option><option>Editor</option><option>Admin</option></select></label><div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="iGo">Send invite</button></div>`, (m) => {
      $("#iGo", m).onclick = () => { const n = $("#iN", m).value.trim(), e = $("#iE", m).value.trim(); if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return IP.toast("Enter a name and valid email."); team.push({ n, e, r: $("#iR", m).value }); IP.store.set("team", team); drawTeam(); closeModal(); IP.toast(`Invite recorded for ${n} (demo — no email sent)`); };
    });
  };

  /* ---------- top bar: user, notifications, search ---------- */
  function paintUser() {
    $("#userInit").textContent = session.initials; $("#userName").textContent = session.name; $("#userCompany").textContent = session.company;
    $("#userEmail").textContent = session.email; $("#sideCompany").textContent = session.company;
  }
  paintUser();
  $("#notifList").innerHTML = D.notifications.map((n) => `<div class="notif"><span style="width:18px;color:${C.blue};flex-shrink:0">${icon(n.icon)}</span><div>${esc(n.text)}<small>${n.at}</small></div></div>`).join("");
  if (state.readNotifs) $("#bellPip").style.display = "none";
  const toggle = (menu, e) => { e.stopPropagation(); const open = menu.classList.contains("open"); $$(".dropdown").forEach((d) => d.classList.remove("open")); if (!open) menu.classList.add("open"); };
  $("#bellBtn").onclick = (e) => { toggle($("#bellMenu"), e); $("#bellPip").style.display = "none"; state.readNotifs = true; save(); };
  $("#userChip").onclick = (e) => { if (e.target.closest("#userMenu")) return; toggle($("#userMenu"), e); };
  document.addEventListener("click", (e) => { if (!e.target.closest(".dropdown")) $$(".dropdown").forEach((d) => d.classList.remove("open")); if (!e.target.closest(".search")) $("#searchResults").classList.remove("open"); });
  $("#logoutBtn").onclick = () => { IP.store.del("session"); location.href = "login.html"; };

  const INDEX = [
    ...Object.entries(TITLES).map(([k, t]) => ({ t, kind: "Page", go: k })),
    ...D.software.map((s) => ({ t: s.name, kind: "Software", go: "software" })),
    ...D.blog.map((b) => ({ t: b.title, kind: "Blog", go: "blog" })),
    ...D.projects.map((p) => ({ t: p.name, kind: "Project", go: "projects" })),
    ...D.seo.keywords.map((k) => ({ t: k.kw, kind: "Keyword", go: "seo" })),
  ];
  const sIn = $("#globalSearch"), sOut = $("#searchResults");
  sIn.oninput = () => {
    const q = sIn.value.trim().toLowerCase();
    const hits = q ? [...INDEX, ...state.reports.map((r) => ({ t: r.name, kind: "Report", go: "reports" }))].filter((x) => x.t.toLowerCase().includes(q)).slice(0, 8) : [];
    sOut.innerHTML = hits.length ? hits.map((h) => `<button data-go="${h.go}">${esc(h.t)}<small>${h.kind}</small></button>`).join("") : q ? `<div class="empty" style="padding:14px">No results for “${esc(q)}”</div>` : "";
    sOut.classList.toggle("open", !!q);
    $$("[data-go]", sOut).forEach((b) => b.onclick = () => { go(b.dataset.go); sIn.value = ""; sOut.classList.remove("open"); });
  };
  sIn.onkeydown = (e) => { if (e.key === "Enter") { const b = $("[data-go]", sOut); b && b.click(); } };

  window.Portal = { go };
  IP.hydrateIcons();
  route();
})();
