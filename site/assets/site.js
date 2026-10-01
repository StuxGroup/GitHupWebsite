/* GitHup website: dev banner, live demo preview, copy buttons. No dependencies. */
(function () {
  "use strict";

  var LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  // Live data straight from the repo (updated every check); /demo/summary.json is the copy
  // published with each site build.
  var LIVE = "https://raw.githubusercontent.com/StuxGroup/GitHupWebsite/main/data/summary.json";
  var LOCAL_SUMMARY = "/demo/summary.json";

  // Dev-only banners, in the shared site-banner component. dev-mode.js sets DEV_MODE (true only in
  // the local build dev-server makes); ?banner=soon,maintenance,site previews the other styles.
  if (window.DEV_MODE) {
    var copy = {
      maintenance: ["Maintenance", "GitHup is being updated and will be back shortly."],
      soon: ["Coming soon", "GitHup is launching soon."],
      dev: ["Dev mode", "Local preview of the GitHup website. Run <code>dev-server.sh --no-dev-mode</code> to see it as production does."],
      site: ["Notice", "A site notice for the GitHup website appears here."]
    };
    var want = (new URLSearchParams(location.search).get("banner") || "").split(",");
    var box = document.createElement("div");
    box.className = "site-banners";
    box.setAttribute("data-site-banners", "");
    ["maintenance", "soon", "dev", "site"].forEach(function (v) {
      if (v !== "dev" && want.indexOf(v) < 0) return;
      var d = document.createElement("div");
      d.className = "site-banner site-banner--" + v;
      d.setAttribute("role", "note");
      d.innerHTML = '<span class="site-banner-label"></span><span class="site-banner-text">' + copy[v][1] + "</span>";
      d.firstChild.textContent = copy[v][0];
      box.appendChild(d);
    });
    document.body.insertBefore(box, document.body.firstChild);
    document.documentElement.classList.add("has-site-banner");
    var bs = document.createElement("script");
    bs.src = "/assets/site-banner.js";
    document.body.appendChild(bs);
  }

  // Theme toggle: follows the system until clicked, then remembers the choice under the same
  // key GitHup status pages use, so the site and /demo/ stay in step.
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var darkMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function effectiveTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return darkMq && !darkMq.matches ? "light" : "dark";
  }
  function syncThemeBtn() {
    if (!themeBtn) return;
    var dark = effectiveTheme() === "dark";
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeBtn.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " theme");
    themeBtn.title = themeBtn.getAttribute("aria-label");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("githup-theme", next); } catch (e) {}
      syncThemeBtn();
    });
  }
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener("change", syncThemeBtn);
  syncThemeBtn();

  // Copy buttons on code blocks (delegated, so blocks rendered later work too).
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-copy]");
    if (!btn) return;
    var pre = document.getElementById(btn.getAttribute("data-copy"));
    if (!pre || !navigator.clipboard) return;
    navigator.clipboard.writeText(pre.textContent).then(function () {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy"; }, 1600);
    });
  });

  // Footer version link: the website's own VERSION.md, published with the site.
  var versionLinks = document.querySelectorAll("[data-site-version]");
  if (versionLinks.length && window.fetch) {
    fetch("/VERSION.md", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (v) {
      v = v.trim().replace(/^v/i, "");
      if (!/^\d+\.\d+\.\d+/.test(v)) return;
      Array.prototype.forEach.call(versionLinks, function (a) {
        a.textContent = "v" + v;
        a.setAttribute("title", "Website v" + v + ": changelogs");
      });
    }).catch(function () {});
  }

  // Docs table of contents: always open on wide screens, collapsible on narrow ones, and
  // highlights the section being read. docs.js fills it in after rendering the README, then
  // fires "githup:docs-ready".
  function initToc() {
    var toc = document.querySelector(".toc details");
    if (!toc || toc.hasAttribute("data-ready")) return;
    toc.setAttribute("data-ready", "");
    var wide = window.matchMedia ? window.matchMedia("(min-width: 981px)") : null;
    var syncToc = function () { if (!wide || wide.matches) toc.open = true; };
    // The HTML ships it open (so it works without JS); phones start with it folded away.
    if (wide && !wide.matches) toc.open = false;
    syncToc();
    if (wide && wide.addEventListener) wide.addEventListener("change", syncToc);
    toc.addEventListener("click", function (e) {
      if (e.target.closest("a") && wide && !wide.matches) toc.open = false;
    });
    var tocLinks = {};
    Array.prototype.forEach.call(toc.querySelectorAll("a[href^='#']"), function (a) {
      tocLinks[a.getAttribute("href").slice(1)] = a;
    });
    var heads = document.querySelectorAll(".prose h2[id], .prose h3[id]");
    if ("IntersectionObserver" in window && heads.length) {
      var current = null;
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
        var pick = null;
        for (var i = 0; i < heads.length; i++) {
          if (visible[heads[i].id]) { pick = heads[i].id; break; }
        }
        if (!pick) return;
        if (current && tocLinks[current]) tocLinks[current].classList.remove("active");
        current = pick;
        if (tocLinks[current]) tocLinks[current].classList.add("active");
      }, { rootMargin: "-80px 0px -60% 0px" });
      Array.prototype.forEach.call(heads, function (h) { io.observe(h); });
    }
  }
  document.addEventListener("githup:docs-ready", initToc);
  if (!document.querySelector(".docs-page[data-readme]")) initToc();

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
    // Problems first, so an outage is always visible in the preview.
    var rank = { down: 0, degraded: 1 };
    mons = mons.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) {
      var ra = a.m.status in rank ? rank[a.m.status] : 2, rb = b.m.status in rank ? rank[b.m.status] : 2;
      return ra - rb || a.i - b.i;
    }).map(function (x) { return x.m; });
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

/* Footer copyright: the start year alone in the first year, then START–CURRENT. */
(function () {
  function run() {var y=new Date().getFullYear();document.querySelectorAll('[data-copyright-years]').forEach(function(e){var s=parseInt(e.getAttribute('data-start'),10);e.textContent=s>=y?String(y):s+'–'+y;});}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
