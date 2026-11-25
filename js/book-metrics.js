(() => {
  const SEED_VIEWS = { part1: 1284, part2: 0 };
  const READER_TTL = 90000;
  const READER_TICK = 20000;
  const VIEWS_TICK = 18000;

  const formatNum = (n) =>
    String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

  const sessionId = () => {
    const key = "vl-sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  };

  const dayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const viewsKey = (book) => `vl-views-extra-${book}`;
  const epochKey = (book) => `vl-views-epoch-${book}`;
  const dayFlag = (book) => `vl-views-day-${book}`;
  const readersKey = (book) => `vl-readers-${book}`;

  const ensureEpoch = (book) => {
    if (!localStorage.getItem(epochKey(book))) {
      localStorage.setItem(epochKey(book), String(Date.now()));
    }
    return Number(localStorage.getItem(epochKey(book)));
  };

  const getExtra = (book) => Number(localStorage.getItem(viewsKey(book)) || 0) || 0;

  const setExtra = (book, n) => {
    localStorage.setItem(viewsKey(book), String(Math.max(0, Math.floor(n))));
  };

  // Slow "global" growth so the counter doesn't freeze between rare visits.
  const ambientViews = (book) => {
    const epoch = ensureEpoch(book);
    const hours = Math.max(0, (Date.now() - epoch) / 3600000);
    // ~3–7 просмотров в час в среднем
    const rate = 4.2 + Math.sin(hours / 7) * 1.6;
    return Math.floor(hours * rate);
  };

  const getViews = (book) => (SEED_VIEWS[book] ?? 0) + getExtra(book) + ambientViews(book);

  const bumpViews = (book, amount = 1) => {
    if (book === "part2") return 0;
    ensureEpoch(book);
    setExtra(book, getExtra(book) + amount);
    return getViews(book);
  };

  // Once per calendar day: +1…3 for opening the site / reader.
  const registerDailyVisit = (book) => {
    if (book === "part2") return getViews(book);
    const flag = dayFlag(book);
    const today = dayKey();
    if (localStorage.getItem(flag) === today) return getViews(book);
    localStorage.setItem(flag, today);
    const bonus = 1 + Math.floor(Math.random() * 3);
    return bumpViews(book, bonus);
  };

  // While the page is open, rare +1 so «прочитали» заметно ползёт.
  const maybeAmbientTick = (book) => {
    if (book === "part2") return getViews(book);
    if (Math.random() > 0.35) return getViews(book);
    return bumpViews(book, 1);
  };

  const cleanReaders = (book) => {
    const now = Date.now();
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(readersKey(book)) || "[]");
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    list = list.filter((r) => r && r.until > now);
    localStorage.setItem(readersKey(book), JSON.stringify(list));
    return list;
  };

  const ambientReaders = () => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const t = h + m / 60;
    // ночь ≈0, утро выше, день ниже, вечер снова выше
    let base;
    if (t < 6 || t >= 23.5) base = 0; // ночь
    else if (t < 7) base = 2; // рассвет
    else if (t < 10) base = 14; // утро
    else if (t < 12) base = 9; // поздне утро
    else if (t < 17) base = 5; // день
    else if (t < 20) base = 11; // вечер
    else base = 15; // поздний вечер
    const wave = Math.floor((Math.sin(Date.now() / 420000) + 1) * (base < 2 ? 0.5 : 2.2));
    return Math.max(0, base + wave);
  };

  const getReading = (book) => cleanReaders(book).length + ambientReaders();

  const heartbeat = (book) => {
    const id = sessionId();
    const now = Date.now();
    let list = cleanReaders(book).filter((r) => r.id !== id);
    list.push({ id, until: now + READER_TTL });
    localStorage.setItem(readersKey(book), JSON.stringify(list));
    return list.length + ambientReaders();
  };

  const animateValue = (el, from, to) => {
    if (!el) return;
    from = Math.floor(from);
    to = Math.floor(to);
    if (from === to) {
      el.textContent = formatNum(to);
      return;
    }
    const start = performance.now();
    const dur = Math.min(900, 280 + Math.abs(to - from) * 40);
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(from + (to - from) * eased);
      el.textContent = formatNum(cur);
      if (p < 1) requestAnimationFrame(step);
      else {
        el.textContent = formatNum(to);
        el.classList.add("is-ticked");
        window.setTimeout(() => el.classList.remove("is-ticked"), 500);
      }
    };
    requestAnimationFrame(step);
  };

  const fill = (root, book, { views, reading }, animateViews = false) => {
    const v = root.querySelector('[data-stat="views"]');
    const r = root.querySelector('[data-stat="reading"]');
    if (v) {
      const prev = Number(String(v.dataset.value || "").replace(/\s/g, "")) || views;
      v.dataset.value = String(views);
      if (animateViews && prev !== views) animateValue(v, prev, views);
      else v.textContent = formatNum(views);
    }
    if (r) r.textContent = formatNum(reading);
  };

  // Migrate old single counter key if present
  const legacy = localStorage.getItem("vl-views-part1");
  if (legacy != null && localStorage.getItem(viewsKey("part1")) == null) {
    const seed = SEED_VIEWS.part1;
    const n = Number(legacy) || seed;
    setExtra("part1", Math.max(0, n - seed));
    localStorage.removeItem("vl-views-part1");
  }

  const boards = document.querySelectorAll("[data-book-stats]");
  boards.forEach((el) => {
    const book = el.getAttribute("data-book-stats") || "part1";
    if (book === "part2") {
      fill(el, book, { views: 0, reading: 0 });
      return;
    }

    const live = el.hasAttribute("data-live-reading");
    const views = registerDailyVisit(book);
    const reading = live ? heartbeat(book) : getReading(book);
    fill(el, book, { views, reading });

    // Reader: +1 просмотр при открытии главы (раз на главу за день)
    if (live) {
      const params = new URLSearchParams(location.search);
      const ch = params.get("ch") || "0";
      const chFlag = `vl-view-ch-${book}-${ch}-${dayKey()}`;
      if (!sessionStorage.getItem(chFlag)) {
        sessionStorage.setItem(chFlag, "1");
        const next = bumpViews(book, 1);
        fill(el, book, { views: next, reading: getReading(book) }, true);
      }

      window.setInterval(() => {
        fill(
          el,
          book,
          { views: maybeAmbientTick(book), reading: heartbeat(book) },
          true
        );
      }, READER_TICK);

      window.addEventListener("beforeunload", () => {
        const id = sessionId();
        const list = cleanReaders(book).filter((r) => r.id !== id);
        localStorage.setItem(readersKey(book), JSON.stringify(list));
      });
    } else {
      window.setInterval(() => {
        fill(
          el,
          book,
          { views: maybeAmbientTick(book), reading: getReading(book) },
          true
        );
      }, VIEWS_TICK);
    }
  });

  // Sync across tabs
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith("vl-views-extra-")) return;
    boards.forEach((el) => {
      const book = el.getAttribute("data-book-stats") || "part1";
      if (book === "part2") return;
      fill(el, book, { views: getViews(book), reading: getReading(book) }, true);
    });
  });
})();
