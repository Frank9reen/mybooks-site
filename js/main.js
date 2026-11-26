(() => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // CTA → читалка
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="read/index.html"], a[href*="read/index.html?"]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!/read\/index\.html/.test(href)) return;
    if (typeof window.vlGoal === "function") {
      window.vlGoal("read_cta_click", { href });
    } else {
      window.vlGoalQueue = window.vlGoalQueue || [];
      window.vlGoalQueue.push(["read_cta_click", { href }]);
    }
  });
})();
