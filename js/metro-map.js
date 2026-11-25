(() => {
  const stage = document.getElementById("metro-stage");
  const sizer = document.getElementById("metro-sizer");
  const canvas = stage?.closest(".metro-map-canvas");
  const tip = document.getElementById("metro-tip");
  if (!stage || !canvas || !sizer) return;

  const MAP_W = 1600;
  const MAP_H = 1999;

  // Station dots: % of Art Lebedev metro map 2030 (1600×1999 web).
  const factions = {
    vodniki: {
      name: "Водники",
      stations: "м. Речной вокзал, м. Водный стадион, м. Войковская",
      color: "rgba(79, 176, 79, 0.38)",
      stroke: "#4fb04f",
      points: [
        { x: 27.9, y: 21.7, label: "Речной вокзал" },
        { x: 27.9, y: 24.3, label: "Водный стадион" },
        { x: 27.8, y: 27.5, label: "Войковская" },
      ],
      crest: "assets/crests/vodniki.jpg",
    },
    engineers: {
      name: "Инженеры",
      stations: "м. Сокол, м. Аэропорт, м. Динамо",
      color: "rgba(79, 176, 79, 0.38)",
      stroke: "#4fb04f",
      points: [
        { x: 27.9, y: 31.0, label: "Сокол" },
        { x: 32.1, y: 32.3, label: "Аэропорт" },
        { x: 35.9, y: 35.6, label: "Динамо" },
      ],
      crest: "assets/crests/engineers.jpg",
    },
    medics: {
      name: "Врачи-ядерщики",
      stations: "м. Щукинская, м. Октябрьское поле",
      color: "rgba(148, 62, 144, 0.38)",
      stroke: "#943e90",
      points: [
        { x: 19.9, y: 28.8, label: "Щукинская" },
        { x: 20.0, y: 32.4, label: "Октябрьское поле" },
      ],
      crest: "assets/crests/medics.jpg",
    },
    free: {
      name: "Свободные",
      stations: "м. Мнёвники, м. Народное Ополчение",
      color: "rgba(121, 205, 205, 0.36)",
      stroke: "#79cdcd",
      points: [
        { x: 16.8, y: 40.6, label: "Мнёвники" },
        { x: 18.6, y: 38.3, label: "Народное Ополчение" },
      ],
      crest: "assets/crests/free.jpg",
    },
    thistle: {
      name: "Чертополох",
      stations: "м. Владыкино, м. Петровско-Разумовская, м. Тимирязевская",
      color: "rgba(162, 165, 180, 0.36)",
      stroke: "#a2a5b4",
      points: [
        { x: 53.2, y: 18.6, label: "Владыкино" },
        { x: 48.7, y: 20.2, label: "Петровско-Разумовская" },
        { x: 46.0, y: 24.7, label: "Тимирязевская" },
      ],
      crest: "assets/crests/thistle.jpg",
    },
    printers: {
      name: "Печатники",
      stations: "м. Савёловская",
      color: "rgba(162, 165, 180, 0.36)",
      stroke: "#a2a5b4",
      points: [
        { x: 47.6, y: 31.2, label: "Савёловская" },
      ],
      crest: "assets/crests/printers.jpg",
    },
    circus: {
      name: "Цирк",
      stations: "м. Тверская, м. Охотный ряд, м. Театральная",
      color: "rgba(228, 35, 19, 0.36)",
      stroke: "#e42313",
      points: [
        { x: 48.5, y: 46.5, label: "Тверская" },
        { x: 50.0, y: 49.8, label: "Охотный ряд" },
        { x: 51.0, y: 51.0, label: "Театральная" },
      ],
      crest: "assets/crests/circus.jpg",
    },
    boatmen: {
      name: "Лодочники",
      tipName: "Братство Лодочников",
      stations: "Москва-река, коллекторы",
      color: "rgba(40, 90, 120, 0.28)",
      stroke: "#5aa0c8",
      points: [
        { x: 22.0, y: 55.0, label: "река · запад" },
        { x: 34.0, y: 58.0, label: "коллектор" },
        { x: 46.0, y: 61.0, label: "река · центр" },
      ],
      crest: "assets/crests/boatmen.jpg",
      soft: true,
      labelOffset: { x: -0.04, y: 0.02 },
    },
    geologists: {
      name: "Геологи",
      tipName: "Братство Геологов",
      stations: "тоннели, Метро-2",
      color: "rgba(120, 120, 110, 0.28)",
      stroke: "#a8a090",
      points: [
        { x: 55.0, y: 46.0, label: "тоннель" },
        { x: 58.0, y: 49.0, label: "Метро-2" },
        { x: 61.0, y: 52.0, label: "трещина" },
      ],
      crest: "assets/crests/geologists.jpg",
      soft: true,
      labelOffset: { x: 0.04, y: -0.01 },
    },
  };

  let lockedId = null;
  const isNarrow = window.matchMedia("(max-width: 720px)").matches;
  const DEFAULT_SCALE = isNarrow ? 1.05 : 1.35;
  let scale = DEFAULT_SCALE;
  const MIN_SCALE = isNarrow ? 0.75 : 0.9;
  const MAX_SCALE = 2.8;

  const applyScale = () => {
    canvas.style.setProperty("--map-scale", String(scale));
    sizer.style.setProperty("--map-scale", String(scale));
    stage.style.setProperty("--map-scale", String(scale));
  };

  const focusOn = (nx = 0.35, ny = 0.32) => {
    const w = MAP_W * scale;
    const h = MAP_H * scale;
    canvas.scrollLeft = Math.max(0, nx * w - canvas.clientWidth / 2);
    canvas.scrollTop = Math.max(0, ny * h - canvas.clientHeight / 2);
  };

  const midOf = (pts) => {
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x: x / 100, y: y / 100 };
  };

  const controls = document.createElement("div");
  controls.className = "metro-controls";
  controls.innerHTML = `
    <button type="button" data-zoom="in" aria-label="Приблизить">+</button>
    <button type="button" data-zoom="out" aria-label="Отдалить">−</button>
    <button type="button" data-zoom="reset" aria-label="Сбросить">⌂</button>
  `;
  canvas.appendChild(controls);

  const setScale = (next, anchorX, anchorY) => {
    const prev = scale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    if (scale === prev) return;
    const rect = canvas.getBoundingClientRect();
    const ax = anchorX ?? rect.left + rect.width / 2;
    const ay = anchorY ?? rect.top + rect.height / 2;
    const beforeX = (canvas.scrollLeft + (ax - rect.left)) / prev;
    const beforeY = (canvas.scrollTop + (ay - rect.top)) / prev;
    applyScale();
    canvas.scrollLeft = beforeX * scale - (ax - rect.left);
    canvas.scrollTop = beforeY * scale - (ay - rect.top);
  };

  controls.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-zoom]");
    if (!btn) return;
    const act = btn.getAttribute("data-zoom");
    if (act === "in") setScale(scale * 1.25);
    else if (act === "out") setScale(scale / 1.25);
    else {
      scale = DEFAULT_SCALE;
      applyScale();
      requestAnimationFrame(() => focusOn(0.35, 0.32));
    }
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        setScale(scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
      }
    },
    { passive: false }
  );

  let dragging = false;
  let dragMoved = false;
  let dragX = 0;
  let dragY = 0;
  let startLeft = 0;
  let startTop = 0;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".metro-controls, .metro-tip, .metro-zone-label, .metro-zone, .metro-zones")) return;
    if (e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    dragX = e.clientX;
    dragY = e.clientY;
    startLeft = canvas.scrollLeft;
    startTop = canvas.scrollTop;
    canvas.classList.add("is-panning");
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    const dy = e.clientY - dragY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;
    canvas.scrollLeft = startLeft - dx;
    canvas.scrollTop = startTop - dy;
  });

  const endDrag = (e) => {
    const wasDrag = dragMoved;
    dragging = false;
    canvas.classList.remove("is-panning");
    // Empty-map click (no pan) clears locked selection.
    if (!wasDrag && e?.type === "pointerup") {
      if (!e.target.closest(".metro-zone, .metro-zone-label, .metro-controls, .metro-tip")) {
        lockedId = null;
        if (tip) tip.hidden = true;
        layer.querySelectorAll(".metro-zone").forEach((el) => el.classList.remove("is-active"));
        labels.querySelectorAll(".metro-zone-label").forEach((el) => el.classList.remove("is-active"));
        document.querySelectorAll(".faction[data-faction]").forEach((el) => el.classList.remove("is-map-active"));
      }
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const toPx = (p) => ({ x: (p.x / 100) * MAP_W, y: (p.y / 100) * MAP_H, label: p.label });

  const layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  layer.setAttribute("class", "metro-zones");
  layer.setAttribute("viewBox", `0 0 ${MAP_W} ${MAP_H}`);
  layer.setAttribute("preserveAspectRatio", "xMidYMid meet");
  layer.setAttribute("aria-hidden", "true");
  stage.appendChild(layer);

  const labels = document.createElement("div");
  labels.className = "metro-hotspots";
  stage.appendChild(labels);

  const showTip = (id, lock = false) => {
    const f = factions[id];
    if (!f || !tip) return;
    if (lock) lockedId = id;
    tip.hidden = false;
    tip.style.setProperty("--metro-line", f.stroke || "var(--copper)");
    tip.innerHTML = `
      <img src="${f.crest}" alt="" />
      <div>
        <strong>${f.tipName || f.name}</strong>
        <span>${f.stations}</span>
      </div>
    `;
    layer.querySelectorAll(".metro-zone").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.faction === id);
    });
    labels.querySelectorAll(".metro-zone-label").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.faction === id);
    });
    document.querySelectorAll(".faction[data-faction]").forEach((el) => {
      el.classList.toggle("is-map-active", el.dataset.faction === id);
    });
  };

  const clearHover = () => {
    if (lockedId) {
      showTip(lockedId);
      return;
    }
    if (tip) tip.hidden = true;
    layer.querySelectorAll(".metro-zone").forEach((el) => el.classList.remove("is-active"));
    labels.querySelectorAll(".metro-zone-label").forEach((el) => el.classList.remove("is-active"));
  };

  // Corridor hull around station chain (pixel space on 1600×1999).
  const hullPath = (pts, pad = 18) => {
    if (pts.length === 1) {
      const p = pts[0];
      const r = pad * 1.15;
      return `M ${p.x - r} ${p.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
    }
    if (pts.length === 2) {
      const [a, b] = pts;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * pad;
      const oy = (dx / len) * pad;
      return `M ${a.x + ox} ${a.y + oy} L ${b.x + ox} ${b.y + oy} L ${b.x - ox} ${b.y - oy} L ${a.x - ox} ${a.y - oy} Z`;
    }
    const left = [];
    const right = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * pad;
      const oy = (dx / len) * pad;
      left.push([pts[i].x + ox, pts[i].y + oy]);
      right.push([pts[i].x - ox, pts[i].y - oy]);
    }
    const seq = [...left, ...right.reverse()];
    return `M ${seq.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
  };

  Object.entries(factions).forEach(([id, f]) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", `metro-zone${f.soft ? " is-soft" : ""}`);
    g.dataset.faction = id;
    const pts = f.points.map(toPx);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", hullPath(pts, f.soft ? 12 : pts.length === 1 ? 22 : 14));
    path.setAttribute("fill", f.color);
    path.setAttribute("stroke", f.stroke);
    path.setAttribute("stroke-width", f.soft ? "1.2" : "1.5");
    g.appendChild(path);

    if (pts.length > 1) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", f.stroke);
      line.setAttribute("stroke-width", "1.4");
      line.setAttribute("stroke-opacity", "0.8");
      g.appendChild(line);
    }

    // Small round markers sitting on metro station ticks (not stretched ovals).
    pts.forEach((pt) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", pt.x);
      c.setAttribute("cy", pt.y);
      c.setAttribute("r", "4");
      c.setAttribute("fill", f.stroke);
      c.setAttribute("stroke", "#0a1014");
      c.setAttribute("stroke-width", "1.2");
      c.setAttribute("class", "metro-station-dot");
      if (pt.label) {
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = pt.label;
        c.appendChild(title);
      }
      g.appendChild(c);
    });

    g.addEventListener("pointerenter", () => showTip(id, false));
    g.addEventListener("pointerleave", clearHover);
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      showTip(id, true);
      const m = midOf(f.points);
      focusOn(m.x, m.y);
    });
    layer.appendChild(g);

    const mid = midOf(f.points);
    const off = f.labelOffset || { x: 0, y: 0 };
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `metro-zone-label${f.soft ? " is-soft" : ""}`;
    btn.dataset.faction = id;
    btn.textContent = f.name;
    btn.style.left = `${(mid.x + off.x) * 100}%`;
    btn.style.top = `${(mid.y + off.y) * 100}%`;
    btn.addEventListener("pointerenter", () => showTip(id, false));
    btn.addEventListener("pointerleave", clearHover);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showTip(id, true);
      focusOn(mid.x, mid.y);
    });
    labels.appendChild(btn);
  });

  document.querySelectorAll(".faction[data-faction]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.faction;
      const f = factions[id];
      if (!f) return;
      showTip(id, true);
      document.getElementById("metro-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        scale = Math.max(scale, 2.05);
        applyScale();
        const m = midOf(f.points);
        focusOn(m.x, m.y);
      }, 280);
    });
  });

  tip?.addEventListener("click", (e) => e.stopPropagation());

  applyScale();
  const boot = () => requestAnimationFrame(() => focusOn(0.35, 0.32));
  const img = stage.querySelector(".metro-base");
  if (img?.complete) boot();
  else img?.addEventListener("load", boot, { once: true });
})();
