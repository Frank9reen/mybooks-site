(() => {
  const params = new URLSearchParams(location.search);
  const titleEl = document.getElementById("reader-title");
  const partEl = document.getElementById("reader-part");
  const navEl = document.getElementById("chapter-nav");
  const articleEl = document.getElementById("reader-article");
  const progressEl = document.querySelector(".reader-progress > span");
  const prevBtn = document.getElementById("prev-chapter");
  const nextBtn = document.getElementById("next-chapter");
  const fontDown = document.getElementById("font-down");
  const fontUp = document.getElementById("font-up");

  if (params.get("part") === "2") {
    titleEl.textContent = "Василиса и Левиафан";
    partEl.textContent = "Часть 2 · скоро";
    articleEl.innerHTML =
      "<h2>Часть 2 закрыта</h2><p>Читать пока нельзя.</p><p><a class=\"btn btn-primary\" href=\"?part=1\">Часть 1</a></p>";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const part = 1;
  const dataUrl = `../data/part${part}.json`;
  const doneRoot = document.getElementById("chapter-done");
  const doneKicker = document.getElementById("chapter-done-kicker");
  const doneTitle = document.getElementById("chapter-done-title");
  const doneText = document.getElementById("chapter-done-text");
  const doneNext = document.getElementById("chapter-done-next");
  const doneClose = document.getElementById("chapter-done-close");

  let book = null;
  let index = Number(params.get("ch") || 0);
  let fontScale = Number(localStorage.getItem("reader-font") || 1);
  let endObserver = null;
  let celebrateArmed = false;
  const celebrated = new Set(
    JSON.parse(sessionStorage.getItem("vl-celebrated-ch") || "[]")
  );

  const applyFont = () => {
    articleEl.style.fontSize = `${1.1 * fontScale}rem`;
    localStorage.setItem("reader-font", String(fontScale));
  };

  const escapeHtml = (str) =>
    str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  // Crest icon only at metro stations — no community name labels in text.
  const FACTIONS = {
    engineers: {
      place: "м. Сокол",
      crest: "../assets/crests/engineers.jpg",
      stations: /[«"]Сокол[»"]|[«"]Аэропорт[»"]|[«"]Динамо[»"]/gi,
    },
    free: {
      place: "м. Мнёвники",
      crest: "../assets/crests/free.jpg",
      stations: /[«"]Мнёвники[»"]|[«"]Мневники[»"]|[«"]Народное Ополчение[»"]/gi,
    },
    medics: {
      place: "м. Щукинская",
      crest: "../assets/crests/medics.jpg",
      stations: /[«"]Щукинская[»"]|[«"]Октябрьское поле[»"]/gi,
    },
    thistle: {
      place: "м. Владыкино",
      crest: "../assets/crests/thistle.jpg",
      stations: /[«"]Владыкино[»"]|[«"]Петровско-Разумовская[»"]|[«"]Тимирязевская[»"]/gi,
    },
    circus: {
      place: "м. Тверская",
      crest: "../assets/crests/circus.jpg",
      stations: /[«"]Тверская[»"]|[«"]Охотный ряд[»"]|[«"]Театральная[»"]/gi,
    },
    printers: {
      place: "м. Савёловская",
      crest: "../assets/crests/printers.jpg",
      stations: /[«"]Савёловская[»"]|[«"]Савеловская[»"]/gi,
    },
    vodniki: {
      place: "м. Речной вокзал",
      crest: "../assets/crests/vodniki.jpg",
      stations: /[«"]Речной вокзал[»"]|[«"]Водный стадион[»"]|[«"]Войковская[»"]/gi,
    },
    boatmen: {
      place: "Москва-река",
      crest: "../assets/crests/boatmen.jpg",
      stations: /Москва-?рек\w*/gi,
    },
    geologists: {
      place: "Метро-2",
      crest: "../assets/crests/geologists.jpg",
      stations: /[«"]?Метро-2[»"]?/gi,
    },
  };

  const crestImg = (f) =>
    `<img class="text-crest" src="${f.crest}" alt="" width="28" height="28" loading="lazy" title="${escapeHtml(f.place)}" />`;

  // Crest before metro station names only; no community name labels.
  const decorateStations = (text) => {
    let out = escapeHtml(text);
    for (const f of Object.values(FACTIONS)) {
      if (!f.stations) continue;
      const re = new RegExp(f.stations.source, f.stations.flags);
      out = out.replace(re, (m) => `${crestImg(f)}<span class="text-station">${m}</span>`);
    }
    return out;
  };

  const saveCelebrated = () => {
    sessionStorage.setItem("vl-celebrated-ch", JSON.stringify([...celebrated]));
  };

  const hideDone = () => {
    if (!doneRoot) return;
    doneRoot.hidden = true;
    document.body.classList.remove("chapter-done-open");
  };

  const showDone = () => {
    if (!doneRoot || !book || celebrated.has(index)) return;
    celebrated.add(index);
    saveCelebrated();
    const last = index >= book.chapters.length - 1;
    const nextTitle = last ? "" : book.chapters[index + 1].title;
    if (doneKicker) doneKicker.textContent = last ? "Часть 1 прочитана" : "Глава прочитана";
    if (doneTitle) doneTitle.textContent = last ? "Дочитали до края" : "Так держать";
    if (doneText) {
      doneText.textContent = last
        ? "Часть 2 пока закрыта. Можно вернуться к любой главе или на сайт."
        : `Дальше — «${nextTitle}». Не отпускайте Василису.`;
    }
    if (doneNext) {
      doneNext.hidden = last;
      doneNext.textContent = "Читать дальше →";
    }
    doneRoot.hidden = false;
    document.body.classList.add("chapter-done-open");
  };

  const watchChapterEnd = () => {
    if (endObserver) {
      endObserver.disconnect();
      endObserver = null;
    }
    celebrateArmed = false;
    const marker = articleEl.querySelector(".chapter-end-mark");
    if (!marker || celebrated.has(index)) return;

    // Arm after a short delay so short chapters don't fire immediately on load.
    window.setTimeout(() => {
      celebrateArmed = true;
    }, 1200);

    endObserver = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.6);
        if (!hit || !celebrateArmed) return;
        endObserver.disconnect();
        endObserver = null;
        showDone();
      },
      { threshold: [0.6], rootMargin: "0px 0px -8% 0px" }
    );
    endObserver.observe(marker);
  };

  const renderChapter = () => {
    if (!book) return;
    hideDone();
    index = Math.max(0, Math.min(index, book.chapters.length - 1));
    const chapter = book.chapters[index];
    const parts = [`<h2>${escapeHtml(chapter.title)}</h2>`];

    chapter.paragraphs.forEach((p) => {
      if (p.type === "break") {
        parts.push(`<div class="scene-break" aria-hidden="true">•••</div>`);
        return;
      }
      parts.push(`<p>${decorateStations(p.text)}</p>`);
    });

    parts.push(`<div class="chapter-end-mark" aria-hidden="true"></div>`);
    const html = parts.join("");
    articleEl.innerHTML = html;
    navEl.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === book.chapters.length - 1;
    const url = new URL(location.href);
    url.searchParams.set("part", String(part));
    url.searchParams.set("ch", String(index));
    history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (progressEl) progressEl.style.width = `${((index + 1) / book.chapters.length) * 100}%`;
    watchChapterEnd();
  };

  const buildNav = () => {
    navEl.innerHTML = book.chapters
      .map(
        (ch, i) =>
          `<button type="button" data-i="${i}">${escapeHtml(ch.title)}</button>`
      )
      .join("");
    navEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-i]");
      if (!btn) return;
      index = Number(btn.dataset.i);
      renderChapter();
    });
  };

  prevBtn.addEventListener("click", () => {
    index -= 1;
    renderChapter();
  });
  nextBtn.addEventListener("click", () => {
    index += 1;
    renderChapter();
  });
  fontDown.addEventListener("click", () => {
    fontScale = Math.max(0.85, fontScale - 0.08);
    applyFont();
  });
  fontUp.addEventListener("click", () => {
    fontScale = Math.min(1.4, fontScale + 0.08);
    applyFont();
  });

  if (doneNext) {
    doneNext.addEventListener("click", () => {
      hideDone();
      if (!book || index >= book.chapters.length - 1) return;
      index += 1;
      renderChapter();
    });
  }
  if (doneClose) doneClose.addEventListener("click", hideDone);
  if (doneRoot) {
    doneRoot.addEventListener("click", (e) => {
      if (e.target === doneRoot) hideDone();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideDone();
  });

  fetch(dataUrl)
    .then((r) => {
      if (!r.ok) throw new Error("Не удалось загрузить текст");
      return r.json();
    })
    .then((data) => {
      book = data;
      titleEl.textContent = data.title;
      partEl.textContent = `Часть ${part} · ${data.chapters.length} глав`;
      buildNav();
      applyFont();
      renderChapter();
    })
    .catch((err) => {
      articleEl.innerHTML = `<p>Ошибка загрузки: ${escapeHtml(err.message)}</p>`;
    });
})();
