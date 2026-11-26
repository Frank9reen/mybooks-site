(function (m, e, t, r, i, k, a) {
  m[i] =
    m[i] ||
    function () {
      (m[i].a = m[i].a || []).push(arguments);
    };
  m[i].l = 1 * new Date();
  for (var j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === r) return;
  }
  (k = e.createElement(t)),
    (a = e.getElementsByTagName(t)[0]),
    (k.async = 1),
    (k.src = r),
    a.parentNode.insertBefore(k, a);
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=114670066", "ym");

var VL_METRIKA_ID = 114670066;

ym(VL_METRIKA_ID, "init", {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: "dataLayer",
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true,
});

window.vlGoalQueue = window.vlGoalQueue || [];

window.vlGoal = function (name, params) {
  if (!name) return;
  try {
    if (typeof ym === "function") {
      if (params) ym(VL_METRIKA_ID, "reachGoal", name, params);
      else ym(VL_METRIKA_ID, "reachGoal", name);
    } else {
      window.vlGoalQueue.push([name, params]);
    }
  } catch (err) {
    /* ignore */
  }
};

(function flushGoalQueue() {
  var q = window.vlGoalQueue || [];
  if (!q.length || typeof ym !== "function") return;
  window.vlGoalQueue = [];
  q.forEach(function (item) {
    var name = item[0];
    var params = item[1];
    if (params) ym(VL_METRIKA_ID, "reachGoal", name, params);
    else ym(VL_METRIKA_ID, "reachGoal", name);
  });
})();
