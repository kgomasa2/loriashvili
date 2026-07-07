/* ============================================================
   LORIASHVILI — interactions
   - chaotic per-letter weight on SHOP headings
   - auto-cycling images (hero rectangle + about oval)
   - project heading hover: green x-height fill + preview photo
   - telegram band: image trail following the cursor
   ============================================================ */
(function () {
  "use strict";

  /* ---- image sets ---- */
  var CYCLE = {
    hero:  ["/assets/art/couch.jpg", "/assets/art/kingkong.jpg", "/assets/art/mune.jpg", "/assets/art/staffie.jpg", "/assets/art/whisper.jpg"],
    about: ["/assets/art/couch.jpg", "/assets/art/dogs.jpg", "/assets/art/couple.jpg", "/assets/art/whisper.jpg", "/assets/art/mune.jpg"]
  };
  var TG = [];
  for (var t = 1; t <= 18; t++) TG.push("/assets/tg/t" + t + ".jpg");

  function preload(list) { list.forEach(function (s) { var i = new Image(); i.src = s; }); }

  /* ---- 1. chaotic per-letter weights (Bitcount variable font) ---- */
  function initScramble(el) {
    var text = el.textContent;
    el.textContent = "";
    var letters = text.split("").map(function (ch) {
      var u = document.createElement("u");
      u.textContent = ch;
      el.appendChild(u);
      return u;
    });
    var phase = letters.map(function () { return Math.random() * Math.PI * 2; });
    var speed = letters.map(function () { return 0.5 + Math.random() * 1.6; });
    setInterval(function () {
      var now = Date.now() / 600;
      letters.forEach(function (u, k) {
        var w = 200 + Math.round((Math.sin(now * speed[k] + phase[k]) * 0.5 + 0.5) * 700);
        u.style.fontWeight = w;
        u.style.fontVariationSettings = '"wght" ' + w;
      });
    }, 110);
  }

  /* ---- 2. auto-cycling image layers ---- */
  function initCycle(el, offset) {
    var set = CYCLE[el.getAttribute("data-cycle")];
    if (!set || !set.length) return;
    preload(set);
    var layers = [document.createElement("img"), document.createElement("img")];
    layers.forEach(function (im) { im.alt = ""; el.appendChild(im); });
    var front = 0, i = 0;
    layers[0].src = set[0];
    layers[0].classList.add("on");
    setTimeout(function () {
      setInterval(function () {
        i = (i + 1) % set.length;
        var back = 1 - front;
        layers[back].src = set[i];
        layers[back].classList.add("on");
        layers[front].classList.remove("on");
        front = back;
      }, 3200);
    }, offset);
  }

  /* ---- 3. project heading hover -> preview photo ---- */
  function initProjects() {
    var photo = document.querySelector(".d-proj-photo");
    if (!photo) return;
    var img = photo.querySelector("img");
    var heads = document.querySelectorAll(".d-p[data-img]");
    var imgs = [];
    heads.forEach(function (h) { imgs.push(h.getAttribute("data-img")); });
    preload(imgs);
    heads.forEach(function (h) {
      var target = h.querySelector("span") || h;
      target.addEventListener("mouseenter", function () {
        img.src = h.getAttribute("data-img");
        // sit the preview just above the green plate of the hovered heading
        var remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
        photo.style.top = (h.offsetTop - photo.offsetHeight - remPx * 2) + "px";
        photo.classList.add("show");
        h.classList.add("active");
      });
      target.addEventListener("mouseleave", function () {
        photo.classList.remove("show");
        h.classList.remove("active");
      });
    });
  }

  /* ---- 4. telegram cursor trail ---- */
  function initTrail(band) {
    preload(TG);
    var idx = 0, last = 0;
    band.addEventListener("pointermove", function (e) {
      var now = e.timeStamp || Date.now();
      if (now - last < 85) return;
      last = now;
      var r = band.getBoundingClientRect();
      var img = document.createElement("img");
      img.className = "tg-trail";
      img.src = TG[idx % TG.length];
      idx++;
      img.style.left = (e.clientX - r.left) + "px";
      img.style.top = (e.clientY - r.top) + "px";
      img.style.setProperty("--r", (Math.random() * 24 - 12) + "deg");
      band.appendChild(img);
      setTimeout(function () { img.remove(); }, 1100);
    });
  }

  /* ---- 5. mobile burger menu ---- */
  function initBurger() {
    var burger = document.querySelector(".m-burger");
    var overlay = document.querySelector(".m-menu-overlay");
    if (!burger || !overlay) return;
    function setOpen(open) {
      overlay.classList.toggle("open", open);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }
    burger.addEventListener("click", function () { setOpen(!overlay.classList.contains("open")); });
    var close = overlay.querySelector(".m-menu-overlay__close");
    if (close) close.addEventListener("click", function () { setOpen(false); });
    overlay.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---- 6. newsletter popup (first visit per session, all pages) ---- */
  function initNewsletter() {
    try { if (sessionStorage.getItem("nl_seen")) return; } catch (e) {}
    var wrap = document.createElement("div");
    wrap.className = "nl-backdrop";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Newsletter");
    wrap.innerHTML =
      '<div class="nl-pop">' +
        '<img class="nl-pop__logo" src="/assets/logo-header.svg" alt="SL">' +
        '<h2 class="nl-pop__title">Can i have your e-mail?</h2>' +
        '<p class="nl-pop__text">Since I keep getting banned from social media, leave me your email so I can still reach you — about new books, work, or upcoming shows.<br>XX</p>' +
        '<form class="nl-pop__form" novalidate>' +
          '<input class="nl-pop__input" type="email" placeholder="Your email" autocomplete="email" required>' +
          '<button class="nl-pop__btn" type="submit">Continue</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";
    try { sessionStorage.setItem("nl_seen", "1"); } catch (e) {}
    requestAnimationFrame(function () { wrap.classList.add("open"); });

    function close() {
      wrap.classList.remove("open");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { if (wrap.parentNode) wrap.remove(); }, 320);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    document.addEventListener("keydown", onKey);
    wrap.querySelector(".nl-pop__form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = wrap.querySelector(".nl-pop__input");
      if (!input.value || input.validity.typeMismatch || !input.validity.valid) { input.focus(); return; }
      /* no backend yet — acknowledge and dismiss */
      close();
    });
  }

  /* ---- 7. horizontal wheel scroll for the homepage card carousel ---- */
  function initHScroll() {
    document.querySelectorAll(".d-cards").forEach(function (row) {
      row.addEventListener("wheel", function (e) {
        if (!e.deltaY) return;
        var max = row.scrollWidth - row.clientWidth;
        if (max <= 1) return;
        var atStart = row.scrollLeft <= 0;
        var atEnd = row.scrollLeft >= max - 1;
        if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
        row.scrollLeft += e.deltaY;
        e.preventDefault();
      }, { passive: false });
    });
  }

  /* ---- 8. data-href: headings / cards navigate on click ---- */
  function initClickThrough() {
    document.querySelectorAll("[data-href]").forEach(function (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;   // let real links win
        var href = el.getAttribute("data-href");
        if (href) location.href = href;
      });
    });
  }

  /* ---- 9. fit long card titles so cards never break ---- */
  function fitOne(el, minPx) {
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = "";
    var size = parseFloat(getComputedStyle(el).fontSize);
    var guard = 0;
    while (el.scrollWidth > el.clientWidth + 1 && size > (minPx || 12) && guard++ < 80) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
  }
  function fitCardTitles() {
    document.querySelectorAll(".s-card__name, .d-card__name").forEach(function (el) { fitOne(el, 14); });
  }
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function initFit() {
    fitCardTitles();
    window.addEventListener("load", fitCardTitles);
    window.addEventListener("resize", debounce(fitCardTitles, 150));
    var grid = document.querySelector(".s-grid");
    if (grid && window.MutationObserver) {
      new MutationObserver(fitCardTitles).observe(grid, { childList: true });
    }
  }

  /* ---- 10. inclusive (monochrome) mode toggle ---- */
  function initInclusive() {
    var KEY = "incl_mode", on = false;
    try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}
    document.body.classList.toggle("inclusive", on);
    var btn = document.createElement("button");
    btn.className = "incl-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle inclusive high-contrast mode");
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    btn.addEventListener("click", function () {
      on = !on;
      document.body.classList.toggle("inclusive", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    });
    document.body.appendChild(btn);
  }

  /* ---- boot ---- */
  function boot() {
    document.querySelectorAll("[data-scramble]").forEach(initScramble);
    document.querySelectorAll("[data-cycle]").forEach(function (el, k) { initCycle(el, k * 800); });
    initProjects();
    initBurger();
    initNewsletter();
    initHScroll();
    initClickThrough();
    initFit();
    initInclusive();
    document.querySelectorAll(".d-band--telegram, .m-telegram").forEach(initTrail);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
