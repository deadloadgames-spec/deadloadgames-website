// Dead Load Games: the pages' four small jobs. No keys, no tracking.

// 1. The email address is put together here, in the visitor's browser, so
//    spam bots reading the page's code never see it whole.
(function () {
  document.querySelectorAll("a.email").forEach(function (a) {
    var address = a.dataset.u + "@" + a.dataset.d;
    a.href = "mailto:" + address;
    a.textContent = address;
  });
})();

// 2. Engineering-drawing dimension lines (oblique ticks), measured from the
//    page itself. Values are CSS millimetres: the web defines 96 px to the
//    inch, so 1 mm = 96 / 25.4 px. They redraw whenever the window changes
//    size. On narrow screens only the widths are shown.
//    The home page's are drawn from its game cards. Other pages mark what to
//    measure: data-dim (a width), data-dimchain (a row of its children) and
//    data-dimv (section heights down the left).
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var PX_PER_MM = 96 / 25.4;
  var sheet = document.querySelector(".sheet");
  var svg = document.querySelector("svg.dims");
  if (!sheet || !svg) return;

  function mm(px) { return String(Math.round(px / PX_PER_MM)); }
  function make(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    svg.appendChild(e);
    return e;
  }
  function line(x1, y1, x2, y2) { make("line", { x1: x1, y1: y1, x2: x2, y2: y2 }); }
  function tick(x, y) { line(x - 4.5, y + 4.5, x + 4.5, y - 4.5); }

  // A row of horizontal dimensions: points xs, dimension line at y,
  // extension lines from the object's edge at objY.
  function hChain(xs, y, objY) {
    var above = objY > y;
    xs.forEach(function (x) { line(x, objY + (above ? -3 : 3), x, y + (above ? -5 : 5)); });
    line(xs[0] - 6, y, xs[xs.length - 1] + 6, y);
    for (var i = 0; i < xs.length - 1; i++) {
      var a = xs[i], b = xs[i + 1];
      tick(a, y); tick(b, y);
      var t = make("text", { x: (a + b) / 2, y: y - 5, "text-anchor": "middle" });
      t.textContent = mm(b - a);
    }
  }

  // A column of vertical dimensions: points ys, dimension line at x,
  // extension lines from the object's edge at objX.
  function vChain(ys, x, objX) {
    var leftOf = objX > x;
    ys.forEach(function (y) { line(objX + (leftOf ? -3 : 3), y, x + (leftOf ? -5 : 5), y); });
    line(x, ys[0] - 6, x, ys[ys.length - 1] + 6);
    for (var i = 0; i < ys.length - 1; i++) {
      var a = ys[i], b = ys[i + 1];
      tick(x, a); tick(x, b);
      var t = make("text", { transform: "translate(" + (x - 5) + "," + ((a + b) / 2) + ") rotate(-90)", "text-anchor": "middle" });
      t.textContent = mm(b - a);
    }
  }

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("width", sheet.clientWidth);
    svg.setAttribute("height", sheet.clientHeight);
    var base = svg.getBoundingClientRect();
    function rel(el) {
      var r = el.getBoundingClientRect();
      return { l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top };
    }
    function q(selector) { return rel(document.querySelector(selector)); }

    var tbEl = document.querySelector(".titleblock");
    if (!tbEl) return;
    var tb = rel(tbEl);
    var wide = window.matchMedia("(min-width: 821px)").matches;

    var cards = document.querySelectorAll(".games .card");
    if (cards.length >= 2) {
      var c1 = rel(cards[0]), c2 = rel(cards[1]);
      if (wide) {
        // Across the two game cards and the gap between them.
        hChain([c1.l, c1.r, c2.l, c2.r], c1.t - 18, c1.t);
        // Section heights down the left margin.
        var sections = [q(".dim").t, q("#games").t];
        if (document.querySelector("#news")) sections.push(q("#news").t);
        sections.push(q("#about").t, q(".two").t, tb.t, tb.b);
        vChain(sections, c1.l - 24, c1.l);
        // The picture height in the right margin.
        var art2 = rel(cards[1].querySelector(".art"));
        vChain([art2.t, art2.b], c2.r + 30, c2.r);
      } else {
        // Narrow screens: just the width of the first card.
        hChain([c1.l, c1.r], c1.t - 18, c1.t);
      }
    }

    // Other pages: whatever they mark.
    document.querySelectorAll("[data-dim]").forEach(function (el) {
      var r = rel(el);
      hChain([r.l, r.r], r.t - 18, r.t);
    });
    if (wide) {
      document.querySelectorAll("[data-dimchain]").forEach(function (el) {
        var kids = [].slice.call(el.children).map(rel);
        if (!kids.length) return;
        var row = kids.filter(function (k) { return Math.abs(k.t - kids[0].t) < 2; });
        var xs = [];
        row.forEach(function (k) { xs.push(k.l, k.r); });
        hChain(xs, kids[0].t - 18, kids[0].t);
      });
      var marks = document.querySelectorAll("[data-dimv]");
      if (marks.length) {
        var ys = [].map.call(marks, function (el) { return rel(el).t; });
        ys.push(tb.t, tb.b);
        var left = q("main").l;
        vChain(ys, left - 24, left);
      }
    }

    // The overall width under the title block.
    hChain([tb.l, tb.r], tb.b + 24, tb.b);
  }

  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  window.addEventListener("load", draw);
  window.addEventListener("resize", draw);
})();

// 3. Trailers play in a pop-up. The YouTube player is only loaded when
//    someone clicks, so the page stays fast. Without this script, the
//    buttons simply open the first video on YouTube.
//    Each button lists its videos as  data-videos="Label:YouTubeID,Label:YouTubeID".
//    With more than one, the pop-up shows a tab for each (first one plays).
(function () {
  var dialog = document.querySelector("dialog.player");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var screen = dialog.querySelector(".video");
  var tabs = dialog.querySelector(".tabs");

  function closePlayer() { if (dialog.open) dialog.close(); }
  dialog.addEventListener("close", function () { screen.innerHTML = ""; tabs.innerHTML = ""; });
  dialog.querySelector(".close").addEventListener("click", closePlayer);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closePlayer(); });

  function play(video, title) {
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(video.id) + "?autoplay=1&rel=0";
    frame.title = title + (video.label ? " (" + video.label + ")" : "");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    screen.innerHTML = "";
    screen.appendChild(frame);
  }

  document.querySelectorAll("a.trailer").forEach(function (a) {
    var videos = (a.dataset.videos || "").split(",").map(function (pair) {
      var i = pair.indexOf(":");
      return { label: pair.slice(0, i).trim(), id: pair.slice(i + 1).trim() };
    }).filter(function (v) { return v.id; });
    if (!videos.length) return;

    a.addEventListener("click", function (e) {
      e.preventDefault();
      var title = a.dataset.title || "Trailer";
      dialog.querySelector(".lbl").textContent = a.dataset.detail || "";
      dialog.querySelector("b").textContent = title;
      tabs.innerHTML = "";
      var buttons = [];
      function choose(n) {
        buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", i === n ? "true" : "false"); });
        play(videos[n], title);
      }
      if (videos.length > 1) {
        videos.forEach(function (v, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "tab";
          b.textContent = v.label;
          b.addEventListener("click", function () { choose(i); });
          tabs.appendChild(b);
          buttons.push(b);
        });
      }
      choose(0);
      dialog.showModal();
    });
  });
})();

// 4. The press kit's short gameplay loops play only while they're on screen,
//    and only fetch their video once they get there. Without this script,
//    or for visitors who ask for less motion, they keep their play button.
(function () {
  var loops = document.querySelectorAll("video.loop");
  if (!loops.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.controls = true; });
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  loops.forEach(function (v) { v.controls = false; watcher.observe(v); });
})();
