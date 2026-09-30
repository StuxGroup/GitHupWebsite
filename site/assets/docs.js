/* GitHup website: the /docs/ page. Renders GitHup's README.md (the same file as on GitHub) and
   builds the table of contents from its headings. No dependencies. */
(function () {
  "use strict";

  // The floating v1 tag: the docs for the release every `StuxGroup/GitHup@v1` workflow runs.
  var REF = "v1";
  var README = "https://raw.githubusercontent.com/StuxGroup/GitHup/" + REF + "/README.md";
  var BLOB = "https://github.com/StuxGroup/GitHup/blob/" + REF + "/";
  var RAW = "https://raw.githubusercontent.com/StuxGroup/GitHup/" + REF + "/";
  var LANGS = { yaml: "YAML", yml: "YAML", bash: "Shell", sh: "Shell", shell: "Shell", json: "JSON",
                text: "Text", python: "Python", html: "HTML" };

  var page = document.querySelector(".docs-page[data-readme]");
  var body = document.getElementById("docs-body");
  var tocList = document.getElementById("toc-list");
  if (!page || !body) return;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // GitHub's heading anchors: lowercase, punctuation dropped, spaces to hyphens.
  function slug(text) {
    return text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\w\- ]+/g, "").trim().replace(/ /g, "-");
  }
  // Links relative to the README point into the repo on GitHub, like they do there.
  function href(url, image) {
    if (/^(https?:|mailto:)/i.test(url)) return url;
    if (url.charAt(0) === "#") return url;
    if (/^[\w.\/-]+(#[\w-]*)?$/.test(url)) return (image ? RAW : BLOB) + url.replace(/^\.\//, "");
    return "#";
  }

  function inline(s) {
    var keep = [];
    function stash(html) { keep.push(html); return "\u0000" + (keep.length - 1) + "\u0000"; }
    s = s.replace(/`([^`]+)`/g, function (_, c) { return stash("<code>" + esc(c) + "</code>"); });
    s = s.replace(/\\([\\`*_|\[\]()#+\-.!])/g, function (_, c) { return stash(esc(c)); });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
      return stash('<img src="' + esc(href(url.replace(/&amp;/g, "&"), true)) + '" alt="' + alt + '">');
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, text, url) {
      var target = href(url.replace(/&amp;/g, "&"));
      var ext = /^https?:/i.test(target);
      return '<a href="' + esc(target) + '"' + (ext ? ' rel="noopener"' : "") + ">" + text + "</a>";
    });
    s = s.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, "<em>$1</em>");
    s = s.replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/ {2}$/, "<br>");
    return s.replace(/\u0000(\d+)\u0000/g, function (_, n) { return keep[+n]; });
  }

  // Grey out `# comments` in YAML and shell, but not a # inside quotes ("#3ba7ff").
  function highlight(code, lang) {
    if (["YAML", "Shell"].indexOf(lang) < 0) return esc(code);
    return code.split("\n").map(function (line) {
      var quote = null;
      for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i);
        if (quote) { if (ch === quote) quote = null; continue; }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === "#" && (i === 0 || /\s/.test(line.charAt(i - 1)))) {
          return esc(line.slice(0, i)) + '<span class="c">' + esc(line.slice(i)) + "</span>";
        }
      }
      return esc(line);
    }).join("\n");
  }

  var codeCount = 0;
  function codeBlock(lines, info) {
    var lang = LANGS[(info || "").toLowerCase()] || (info ? info.toUpperCase() : "Code");
    var id = "code-" + (++codeCount);
    return '<div class="code"><div class="code-bar"><span>' + esc(lang) + '</span><button class="copy" type="button" data-copy="' +
      id + '">Copy</button></div><pre id="' + id + '">' + highlight(lines.join("\n"), lang) + "</pre></div>";
  }

  function splitRow(line) {
    var cells = [], cur = "", tick = false;
    line = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (ch === "\\" && line.charAt(i + 1) === "|") { cur += "\\|"; i++; continue; }
      if (ch === "`") tick = !tick;
      if (ch === "|" && !tick) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }
  function table(rows) {
    var head = splitRow(rows[0]);
    var html = '<div class="table-wrap"><table><thead><tr>' +
      head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.slice(2).forEach(function (r) {
      html += "<tr>" + splitRow(r).map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
    });
    return html + "</tbody></table></div>";
  }

  var LIST_RE = /^( {0,3})([-*+]|\d+[.)])\s+(.*)$/;
  function indentOf(line) { return line.match(/^ */)[0].length; }

  // Block-level markdown: headings, paragraphs, fenced code, tables, lists (with nested
  // blocks), block quotes and rules. Enough for GitHup's README, and nothing else.
  function blocks(lines, heads) {
    var html = "", i = 0, para = [];
    function flushPara() {
      if (para.length) { html += "<p>" + inline(para.join("\n")).replace(/\n/g, " ") + "</p>"; para = []; }
    }
    while (i < lines.length) {
      var line = lines[i], m;
      if (!line.trim()) { flushPara(); i++; continue; }
      if ((m = line.match(/^\s*(```+|~~~+)\s*([\w+-]*)/))) {
        flushPara();
        var fence = m[1], pad = indentOf(line), code = [];
        i++;
        while (i < lines.length && lines[i].trim().indexOf(fence) !== 0) {
          code.push(lines[i].slice(Math.min(pad, indentOf(lines[i]))));
          i++;
        }
        i++;
        html += codeBlock(code, m[2]);
        continue;
      }
      if ((m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/))) {
        flushPara();
        var level = m[1].length, text = m[2], id = slug(text);
        if (heads && level <= 3) {
          var n = 1, base = id;
          while (heads.ids[id]) id = base + "-" + (n++);
          heads.ids[id] = true;
          if (level >= 2) heads.list.push({ level: level, id: id, html: inline(text) });
        }
        html += "<h" + level + ' id="' + id + '"><a class="anchor" href="#' + id + '" aria-hidden="true" tabindex="-1">#</a>' +
          inline(text) + "</h" + level + ">";
        i++;
        continue;
      }
      if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); html += "<hr>"; i++; continue; }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        flushPara();
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
        html += table(rows);
        continue;
      }
      if (/^\s*>/.test(line)) {
        flushPara();
        var quote = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*> ?/, ""));
        html += "<blockquote>" + blocks(quote) + "</blockquote>";
        continue;
      }
      if ((m = line.match(LIST_RE)) && !para.length) {
        var ordered = /\d/.test(m[2]), items = [], start = parseInt(m[2], 10);
        while (i < lines.length && (m = lines[i].match(LIST_RE)) && /\d/.test(m[2]) === ordered) {
          var contentPad = m[1].length + m[2].length + 1, item = [m[3]];
          i++;
          // An item runs on over indented lines and blank lines followed by indented ones.
          while (i < lines.length) {
            if (!lines[i].trim()) {
              if (i + 1 < lines.length && indentOf(lines[i + 1]) >= contentPad && lines[i + 1].trim()) { item.push(""); i++; continue; }
              break;
            }
            if (indentOf(lines[i]) >= contentPad) { item.push(lines[i].slice(contentPad)); i++; continue; }
            if (!LIST_RE.test(lines[i]) && !/^\s*(```|#|\|)/.test(lines[i])) { item.push(lines[i].trim()); i++; continue; }
            break;
          }
          items.push(item);
          if (i < lines.length && !lines[i].trim() && i + 1 < lines.length && LIST_RE.test(lines[i + 1])) i++;
        }
        var tag = ordered ? "ol" : "ul";
        html += "<" + tag + (ordered && start !== 1 ? ' start="' + start + '"' : "") + ">";
        items.forEach(function (it) {
          var loose = it.indexOf("") >= 0;
          var inner = blocks(it);
          if (!loose) inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, "$1");
          html += "<li>" + inner + "</li>";
        });
        html += "</" + tag + ">";
        continue;
      }
      para.push(line.trim() === line ? line : line.replace(/^\s+/, ""));
      i++;
    }
    flushPara();
    return html;
  }

  function render(md) {
    md = md.replace(/\r\n/g, "\n");
    var lines = md.split("\n");
    // The README opens with its own logo, title and tagline (this page has those already)
    // and ends with a branding footer after the last rule: keep what's between.
    var first = 0;
    while (first < lines.length && !/^##\s/.test(lines[first])) first++;
    var last = lines.length;
    for (var k = lines.length - 1; k > first; k--) {
      if (/^---\s*$/.test(lines[k])) { last = k; break; }
    }
    var heads = { ids: {}, list: [] };
    body.innerHTML = blocks(lines.slice(first, last), heads) +
      '<p class="docs-note">This page is GitHup\'s <a href="' + BLOB + 'README.md" rel="noopener">README</a>, rendered. ' +
      'Found something unclear or wrong? <a href="https://github.com/StuxGroup/GitHup/issues/new" rel="noopener">Open an Issue</a>.</p>';

    if (tocList) {
      var html = "", open = false;
      heads.list.forEach(function (h) {
        var link = '<a href="#' + h.id + '">' + h.html + "</a>";
        if (h.level === 2) {
          if (open) { html += "</ol></li>"; open = false; }
          html += "<li>" + link;
          var next = heads.list[heads.list.indexOf(h) + 1];
          if (next && next.level === 3) { html += "<ol>"; open = true; } else html += "</li>";
        } else {
          html += "<li>" + link + "</li>";
        }
      });
      if (open) html += "</ol></li>";
      tocList.innerHTML = html;
    }
    page.removeAttribute("aria-busy");
    document.dispatchEvent(new Event("githup:docs-ready"));
    // A deep link (/docs/#groups) can only land once the heading exists.
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  fetch(README, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.text();
  }).then(render).catch(function () {
    page.removeAttribute("aria-busy");
    body.innerHTML = '<p class="docs-note">Couldn\'t load the docs right now. Read them in ' +
      '<a href="https://github.com/StuxGroup/GitHup#readme" rel="noopener">GitHup\'s README on GitHub</a> instead.</p>';
    document.dispatchEvent(new Event("githup:docs-ready"));
  });
})();
