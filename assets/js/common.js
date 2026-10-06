/* Shared helpers: session, toasts, icons, 3D tilt, 3D bar scene */
(function () {
  const IP = (window.IP = {});

  /* ---------- Storage (safe) ---------- */
  IP.store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("ip_" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, val) { try { localStorage.setItem("ip_" + key, JSON.stringify(val)); } catch (e) { /* ignore */ } },
    del(key) { try { localStorage.removeItem("ip_" + key); } catch (e) { /* ignore */ } },
  };
  IP.session = () => IP.store.get("session", null);

  /* ---------- Dynamic Island notifications ----------
     IP.island(text, { icon, progress, persist }) → { update(text, pct), done(text) } */
  let islandEl, islandTimer;
  IP.island = function (text, opts) {
    opts = opts || {};
    if (!islandEl) {
      islandEl = document.createElement("div");
      islandEl.className = "island"; islandEl.setAttribute("role", "status"); islandEl.setAttribute("aria-live", "polite");
      islandEl.innerHTML = '<span class="i-ico"></span><span class="i-text"></span><span class="i-dot"></span><span class="i-bar"><div></div></span>';
      document.body.appendChild(islandEl);
    }
    const el = islandEl, txt = el.querySelector(".i-text"), bar = el.querySelector(".i-bar div"), dot = el.querySelector(".i-dot");
    clearTimeout(islandTimer);
    el.querySelector(".i-ico").innerHTML = IP.icon(opts.icon || "check");
    txt.textContent = text;
    el.classList.toggle("progress", !!opts.progress);
    dot.style.display = opts.progress ? "none" : "";
    bar.style.width = (opts.pct || 0) + "%";
    el.classList.add("show");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
    const close = (ms) => {
      islandTimer = setTimeout(() => {
        el.classList.remove("open");
        islandTimer = setTimeout(() => el.classList.remove("show", "progress"), 450);
      }, ms);
    };
    if (!opts.persist) close(2600);
    return {
      update(t, pct) { clearTimeout(islandTimer); if (t) txt.textContent = t; if (pct != null) bar.style.width = pct + "%"; },
      done(t) { if (t) txt.textContent = t; bar.style.width = "100%"; el.querySelector(".i-ico").innerHTML = IP.icon("check"); setTimeout(() => { el.classList.remove("progress"); dot.style.display = ""; }, 400); close(2200); },
    };
  };
  IP.toast = (text) => IP.island(text);

  IP.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  IP.fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n));
  IP.money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  /* ---------- Icons (inline SVG, stroke) ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12L22 7H6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    ads: '<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14"/>',
    folder: '<path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15l-3-3c1-4 4-8 12-9-1 8-5 11-9 12z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01"/><circle cx="12" cy="3" r="1"/>',
    report: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 17v-3M12 17v-6M16 17v-2"/>',
    survey: '<path d="M9 11l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
    blog: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0M16 4a4 4 0 010 8M22 21a7 7 0 00-4-6.3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 01-12 0zM12 18v4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  };
  IP.icon = (name, cls) => `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  IP.hydrateIcons = (root) => (root || document).querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = IP.icon(el.dataset.icon); });

  /* ---------- 3D tilt for cards ---------- */
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  IP.tilt = function (root) {
    if (reduce) return;
    (root || document).querySelectorAll(".tilt").forEach((el) => {
      if (el._tilt) return; el._tilt = true;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-3px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  };

  /* ---------- 3D bar scene (Three.js) ----------
     opts: { values:[[...]], rowLabels, colLabels, colors:[hex per row], bg:null|hex,
             autoRotate, tooltip:(r,c,v)=>string, floor:hex }                       */
  IP.barScene = function (container, opts) {
    if (!window.THREE) { container.innerHTML = '<div class="empty">3D view unavailable (offline).</div>'; return null; }
    const T = window.THREE;
    const w = () => container.clientWidth, h = () => container.clientHeight;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    container.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, w() / h(), 0.1, 200);
    scene.add(new T.AmbientLight(0xffffff, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.75); sun.position.set(8, 14, 10); scene.add(sun);
    const fill = new T.DirectionalLight(0xffffff, 0.25); fill.position.set(-10, 6, -6); scene.add(fill);

    const group = new T.Group(); scene.add(group);
    let bars = [], target = [];
    const rows = opts.values.length, cols = opts.values[0].length;
    const gap = 1.25;
    const ox = -((cols - 1) * gap) / 2, oz = -((rows - 1) * gap) / 2;

    const floor = new T.Mesh(
      new T.BoxGeometry(cols * gap + 0.8, 0.12, rows * gap + 0.8),
      new T.MeshLambertMaterial({ color: opts.floor || 0xe3e8ef })
    );
    floor.position.y = -0.06; group.add(floor);

    const maxV = () => Math.max(1, ...opts.values.flat());
    const geo = new T.BoxGeometry(0.8, 1, 0.8);
    geo.translate(0, 0.5, 0);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mat = new T.MeshLambertMaterial({ color: opts.colors[r % opts.colors.length] });
        const m = new T.Mesh(geo, mat);
        m.position.set(ox + c * gap, 0, oz + r * gap);
        m.scale.y = 0.001;
        m.userData = { r, c, base: opts.colors[r % opts.colors.length] };
        group.add(m); bars.push(m);
      }
    }
    const H = opts.height || 5;
    function setValues(values) {
      opts.values = values;
      const mx = maxV();
      target = bars.map((b) => Math.max(0.05, (values[b.userData.r][b.userData.c] / mx) * H));
    }
    setValues(opts.values);

    // Camera orbit (drag)
    let theta = opts.theta || 0.75, phi = opts.phi || 0.95, radius = opts.radius || Math.max(rows, cols) * 2.2 + 6;
    let dragging = false, lx = 0, ly = 0, idle = 0;
    function placeCam() {
      camera.position.set(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi) + 1, radius * Math.sin(phi) * Math.cos(theta));
      camera.lookAt(0, H * 0.32, 0);
    }
    placeCam();
    const el = renderer.domElement;
    el.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointerup", () => { dragging = false; idle = 0; });
    el.addEventListener("pointermove", (e) => {
      if (dragging) {
        theta -= (e.clientX - lx) * 0.008;
        phi = Math.min(1.45, Math.max(0.35, phi - (e.clientY - ly) * 0.006));
        lx = e.clientX; ly = e.clientY; placeCam();
      }
      hover(e);
    });
    el.addEventListener("pointerleave", () => { hoverOff(); });

    // Hover tooltip via raycasting
    const ray = new T.Raycaster(), mouse = new T.Vector2();
    let tip = null, hot = null;
    if (opts.tooltip) {
      tip = document.createElement("div"); tip.className = "scene-tip"; container.appendChild(tip);
    }
    function hover(e) {
      if (!opts.tooltip) return;
      const r = el.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(bars)[0];
      if (hot && (!hit || hit.object !== hot)) { hot.material.color.setHex(hot.userData.base); hot = null; }
      if (hit) {
        hot = hit.object; hot.material.color.setHex(opts.hover || 0xffb020);
        const { r: ri, c } = hot.userData;
        tip.innerHTML = opts.tooltip(ri, c, opts.values[ri][c]);
        tip.style.display = "block";
        tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 170) + "px";
        tip.style.top = (e.clientY - r.top + 14) + "px";
      } else if (tip) tip.style.display = "none";
    }
    function hoverOff() { if (hot) { hot.material.color.setHex(hot.userData.base); hot = null; } if (tip) tip.style.display = "none"; }

    let alive = true, visible = true;
    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; });
    io.observe(container);
    function loop() {
      if (!alive) return;
      requestAnimationFrame(loop);
      if (!visible) return;
      bars.forEach((b, i) => { b.scale.y += (target[i] - b.scale.y) * 0.08; });
      if (opts.autoRotate !== false && !dragging && !reduce) { idle++; if (idle > 30) { theta += 0.0025; placeCam(); } }
      renderer.render(scene, camera);
    }
    loop();
    const ro = new ResizeObserver(() => { if (!w() || !h()) return; renderer.setSize(w(), h()); camera.aspect = w() / h(); camera.updateProjectionMatrix(); });
    ro.observe(container);

    return {
      update: setValues,
      destroy() { alive = false; io.disconnect(); ro.disconnect(); renderer.dispose(); container.innerHTML = ""; },
    };
  };
})();
