import * as THREE from "three";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Interactive 3D bar grid (drag to orbit, hover for tooltip).
 * opts: { values: number[][], colors: hex[], floor?, height?, radius?, autoRotate?, tooltip?(r,c,v)=>html }
 * Returns { update(values), destroy() }.
 */
export function createBarScene(container, opts) {
  const w = () => container.clientWidth, h = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w() / h(), 0.1, 200);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(8, 14, 10); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-10, 6, -6); scene.add(fill);

  const group = new THREE.Group(); scene.add(group);
  const rows = opts.values.length, cols = opts.values[0].length, gap = 1.25, H = opts.height || 5;
  const ox = -((cols - 1) * gap) / 2, oz = -((rows - 1) * gap) / 2;
  let values = opts.values;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(cols * gap + 0.8, 0.12, rows * gap + 0.8), new THREE.MeshLambertMaterial({ color: opts.floor ?? 0xe3e8ef }));
  floor.position.y = -0.06; group.add(floor);

  const geo = new THREE.BoxGeometry(0.8, 1, 0.8); geo.translate(0, 0.5, 0);
  const bars = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const base = opts.colors[r % opts.colors.length];
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: base }));
    m.position.set(ox + c * gap, 0, oz + r * gap); m.scale.y = 0.001; m.userData = { r, c, base };
    group.add(m); bars.push(m);
  }
  let target = [];
  const setValues = (v) => {
    values = v;
    const mx = Math.max(1, ...v.flat());
    target = bars.map((b) => Math.max(0.05, (v[b.userData.r][b.userData.c] / mx) * H));
  };
  setValues(values);

  let theta = 0.75, phi = 0.95, radius = opts.radius || Math.max(rows, cols) * 2.2 + 6, dragging = false, lx = 0, ly = 0, idle = 0;
  const placeCam = () => {
    camera.position.set(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi) + 1, radius * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(0, H * 0.32, 0);
  };
  placeCam();

  const el = renderer.domElement;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let tip = null, hot = null;
  if (opts.tooltip) { tip = document.createElement("div"); tip.className = "scene-tip"; container.appendChild(tip); }
  const hoverOff = () => { if (hot) { hot.material.color.setHex(hot.userData.base); hot = null; } if (tip) tip.style.display = "none"; };
  const hover = (e) => {
    if (!opts.tooltip) return;
    const r = el.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(bars)[0];
    if (hot && (!hit || hit.object !== hot)) hoverOff();
    if (hit) {
      hot = hit.object; hot.material.color.setHex(0xffb020);
      tip.innerHTML = opts.tooltip(hot.userData.r, hot.userData.c, values[hot.userData.r][hot.userData.c]);
      tip.style.display = "block";
      tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 170) + "px";
      tip.style.top = e.clientY - r.top + 14 + "px";
    }
  };
  const down = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); };
  const up = () => { dragging = false; idle = 0; };
  const move = (e) => {
    if (dragging) {
      theta -= (e.clientX - lx) * 0.008;
      phi = Math.min(1.45, Math.max(0.35, phi - (e.clientY - ly) * 0.006));
      lx = e.clientX; ly = e.clientY; placeCam();
    }
    hover(e);
  };
  el.addEventListener("pointerdown", down); el.addEventListener("pointerup", up);
  el.addEventListener("pointermove", move); el.addEventListener("pointerleave", hoverOff);

  let alive = true, visible = true, raf = 0;
  const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }); io.observe(container);
  const ro = new ResizeObserver(() => { if (!w() || !h()) return; renderer.setSize(w(), h()); camera.aspect = w() / h(); camera.updateProjectionMatrix(); });
  ro.observe(container);
  const reduce = reduceMotion();
  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    bars.forEach((b, i) => { b.scale.y += (target[i] - b.scale.y) * 0.08; });
    if (opts.autoRotate !== false && !dragging && !reduce && ++idle > 30) { theta += 0.0025; placeCam(); }
    renderer.render(scene, camera);
  };
  loop();

  return {
    update: setValues,
    destroy() {
      alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      bars.forEach((b) => b.material.dispose()); geo.dispose(); floor.geometry.dispose(); floor.material.dispose();
      renderer.dispose(); container.innerHTML = "";
    },
  };
}
