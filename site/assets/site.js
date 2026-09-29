/* GitHup website: dev banner, live demo preview, copy buttons. No dependencies. */
(function () {
  "use strict";

  var LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  var NODEV = /(?:^|[?&])nodev=1(?:&|$)/.test(location.search);
  // Live data straight from the repo (updated every check); /demo/summary.json is the copy
  // published with each site build.
  var LIVE = "https://raw.githubusercontent.com/StuxGroup/GitHupWebsite/main/data/summary.json";
  var LOCAL_SUMMARY = "/demo/summary.json";

  // Dev banner: on for local previews, unless ?nodev=1 asks for the production look.
  var banner = document.getElementById("dev-banner");
  if (banner && LOCAL && !NODEV) banner.classList.add("on");

  // Copy buttons on code blocks.
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (btn) {
    btn.addEventListener("click", function () {
      var pre = document.getElementById(btn.getAttribute("data-copy"));
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1600);
      });
    });
  });

  // Live demo preview on the home page.
  var list = document.getElementById("demo-monitors");
  if (!list) return;
  var OVERALL = {
    up: "All systems operational", degraded: "Degraded performance", partial: "Partial outage",
    down: "Major outage", unknown: "Waiting for the first check"
  };
  var ICON = { up: "✓", degraded: "!", partial: "!", down: "✕", unknown: "?" };

  function get(url) {
    return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }
  function pct(v) {
    if (typeof v !== "number") return "—";
    return (Math.floor(v * 100) / 100).toFixed(2) + "%";
  }
  function ago(ts) {
    if (!ts) return "never";
    var s = Math.max(0, Math.round(Date.now() / 1000 - ts));
    if (s < 90) return "just now";
    if (s < 5400) return Math.round(s / 60) + " min ago";
    if (s < 129600) return Math.round(s / 3600) + " h ago";
    return Math.round(s / 86400) + " days ago";
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function render(summary) {
    var status = OVERALL[summary.status] ? summary.status : "unknown";
    var hero = document.getElementById("demo-banner");
    hero.className = "banner st-" + status;
    hero.querySelector(".dot").textContent = ICON[status];
    hero.querySelector(".txt").textContent = OVERALL[status];
    var mons = summary.monitors || [];
    if (!mons.length) return;
    list.textContent = "";
    mons.slice(0, 6).forEach(function (m) {
      var st = ["up", "degraded", "down"].indexOf(m.status) >= 0 ? m.status : "unknown";
      var li = el("li", "mon");
      var dot = el("span", "sd st-" + st);
      dot.setAttribute("aria-hidden", "true");
      li.appendChild(dot);
      var nm = el("span", "nm", m.name || m.slug);
      nm.appendChild(el("span", "sr-only", " (" + st + ")"));
      li.appendChild(nm);
      var up = el("span", "up");
      up.appendChild(el("strong", "", pct(m.uptime && m.uptime["90d"])));
      up.appendChild(document.createTextNode(" 90 d"));
      li.appendChild(up);
      li.appendChild(el("span", "ms", m.ms ? m.ms + " ms" : "—"));
      list.appendChild(li);
    });
    document.getElementById("demo-updated").textContent = "Updated " + ago(summary.updated);
  }
  var first = LOCAL ? get(LOCAL_SUMMARY) : get(LIVE).catch(function () { return get(LOCAL_SUMMARY); });
  first.then(render).catch(function () {
    document.getElementById("demo-updated").textContent = "Live data unavailable right now";
  });
})();
