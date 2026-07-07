/* ============================================================
   LORIASHVILI — content hydration
   Fills editable content from /content/*.json into the existing
   markup (matched by the page's own CSS classes). Non-destructive:
   if a fetch fails, the baked-in HTML stays as a fallback.
   Content is edited by the client through the CMS at /admin/.
   ============================================================ */
(function () {
  "use strict";

  var SITE_EMAIL = null;

  /* ---- helpers ---- */
  function getJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path);
      return r.json();
    });
  }
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function abs(p) {
    if (!p) return p;
    return /^(https?:|\/|mailto:|data:)/.test(p) ? p : "/" + p.replace(/^\.?\//, "");
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function specsHTML(s) { return esc(s).replace(/\r?\n/g, "<br>"); }
  function setText(el, t) { if (el && t != null) el.textContent = t; }
  function itemText(t) {
    if (t && typeof t === "object") return t.text != null ? t.text : (t.item != null ? t.item : "");
    return t;
  }
  function fillListEl(ul, items) {
    if (!ul || !items) return;
    ul.innerHTML = "";
    items.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = itemText(t);
      ul.appendChild(li);
    });
  }
  function fillList(sel, items) { fillListEl($(sel), items); }

  /* ---- global: social + contact links (every page) ---- */
  function applyLinks(links) {
    if (!links) return;
    var byText = { instagram: links.instagram, onlyfans: links.onlyfans };
    $all("a").forEach(function (a) {
      var key = (a.textContent || "").trim().toLowerCase();
      if (byText[key]) a.setAttribute("href", byText[key]);
    });
    if (links.email) {
      // update every mailto: link, preserving any ?subject=… query
      $all('a[href^="mailto:"]').forEach(function (a) {
        var h = a.getAttribute("href"), q = h.indexOf("?");
        a.setAttribute("href", "mailto:" + links.email + (q >= 0 ? h.slice(q) : ""));
      });
    }
    if (links.telegram) {
      $all(".d-tg-check, .m-tg-check").forEach(function (a) {
        a.setAttribute("href", links.telegram);
      });
    }
  }

  /* ---- media / exhibitions lists (index + about, desktop + mobile) ---- */
  function fillTextBlocks(site) {
    if (!site) return;
    setText($(".d-hero-bio"), site.heroBio);
    setText($(".m-hero-bio"), site.heroBio);
    setText($(".d-bio"), site.aboutBio);
    setText($(".a-bio"), site.aboutBio);
    setText($(".m-bio"), site.aboutBio);
    fillList(".d-media-list", site.media);
    fillList(".a-media-list", site.media);
    fillList(".d-exh-list", site.exhibitions);
    fillList(".a-exh-list", site.exhibitions);
    // mobile: two generic .m-list (media first, exhibitions second)
    var m = $all(".mobile .m-list");
    if (m[0]) fillListEl(m[0], site.media);
    if (m[1]) fillListEl(m[1], site.exhibitions);
  }

  /* ---- homepage project headings (title + hover preview image) ---- */
  function fillProjects(projects) {
    if (!projects || !projects.items) return;
    projects.items.forEach(function (p) {
      var d = $(".d-p--" + p.key);
      if (d) {
        var span = d.querySelector("span") || d;
        span.textContent = p.title;
        if (p.image) d.setAttribute("data-img", p.image);
      }
      var mob = $(".m-p--" + p.key);
      if (mob) mob.textContent = p.title;
    });
  }

  /* ---- shop grid (/shop/), desktop + mobile ---- */
  function shopCardHTML(it) {
    var url = esc(it.url || "#");
    return '<article class="s-card">' +
      '<a class="s-card__link" href="' + url + '">' +
        '<div class="s-card__media"><img src="' + esc(abs(it.cover)) + '" alt="' + esc(it.name) + '" loading="lazy"><span class="s-card__ovals"></span></div>' +
        '<div class="s-card__row"><h3 class="s-card__name">' + esc(it.name) + '</h3><span class="s-card__price">' + esc(it.price) + '</span></div>' +
      '</a>' +
      '<div class="s-card__foot"><div class="s-card__meta">' +
        '<span class="s-card__pub">' + esc(it.publisher) + '</span>' +
        '<span class="s-card__specs">' + specsHTML(it.specs) + '</span></div>' +
        '<a class="s-card__buy" href="' + url + '">BUY</a></div>' +
    '</article>';
  }
  function fillShopGrid(shop) {
    if (!shop || !shop.items) return;
    var html = shop.items.map(shopCardHTML).join("");
    $all(".s-grid").forEach(function (g) { g.innerHTML = html; });
  }

  /* ---- galleries (preset layouts, filled from JSON) ---- */
  function imgPath(x) {
    if (x && typeof x === "object") return x.image || x.src || x.path || "";
    return x;
  }
  function renderDesktopGallery(el, images, layout) {
    if (!el) return;
    images = (images || []).map(imgPath).filter(Boolean);
    if (!images.length) { el.innerHTML = ""; el.style.display = "none"; return; }
    layout = layout || "standard";
    el.classList.add("cms-gallery");
    el.setAttribute("data-layout", layout);
    el.removeAttribute("style"); // drop any hand-tuned inline height
    el.innerHTML = images.map(function (src) {
      return '<div class="cms-g"><img src="' + esc(abs(src)) + '" alt="" loading="lazy"></div>';
    }).join("");
    if (layout === "standard") classifyStandard(el);
  }
  /* standard preset: tag each cell landscape/portrait once its image loads
     so CSS can lay portraits out 2-up and landscapes full-width */
  function classifyStandard(el) {
    $all(".cms-g img", el).forEach(function (img) {
      function mark() {
        var cell = img.parentNode;
        if (!cell) return;
        cell.classList.add(img.naturalHeight > img.naturalWidth * 1.05 ? "cms-g--port" : "cms-g--land");
      }
      if (img.complete && img.naturalWidth) mark();
      else img.addEventListener("load", mark);
    });
  }
  function renderMobileGallery(el, images) {
    if (!el) return;
    el.innerHTML = (images || []).map(imgPath).filter(Boolean).map(function (src) {
      return '<img src="' + esc(abs(src)) + '" alt="" loading="lazy">';
    }).join("");
  }

  /* ---- shop item detail (/shop/<slug>/) ---- */
  function slugFromPath() {
    var parts = location.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }
  function fillShopItem(shop) {
    if (!shop || !shop.items) return;
    var slug = slugFromPath();
    var it = shop.items.filter(function (x) { return x.slug === slug; })[0];
    if (!it) return;
    $all(".si-name").forEach(function (e) { e.textContent = it.name; });
    $all(".si-price").forEach(function (e) { e.textContent = it.price; });
    $all(".si-specs").forEach(function (e) { e.innerHTML = specsHTML(it.specs); });
    $all(".si-pub").forEach(function (e) { e.textContent = it.publisher; });
    $all(".si-hero").forEach(function (e) { if (it.hero) { e.src = abs(it.hero); e.alt = it.name; } });
    if (SITE_EMAIL) {
      $all(".si-buy").forEach(function (e) {
        e.setAttribute("href", "mailto:" + SITE_EMAIL + "?subject=" + encodeURIComponent("Order: " + it.name));
      });
    }
    renderDesktopGallery($(".desktop .si-gallery"), it.gallery, it.galleryLayout);
    renderMobileGallery($(".mobile .si-m-gallery"), it.gallery);
  }

  /* ---- project detail (/projects/<slug>/) ---- */
  function samePath(a, b) {
    function n(x) { return (x || "").replace(/\/+$/, ""); }
    return n(a) === n(b);
  }
  function fillProjectItem(projects) {
    if (!projects || !projects.items) return;
    var it = projects.items.filter(function (x) { return x.url && samePath(x.url, location.pathname); })[0];
    if (!it) return;
    renderDesktopGallery($(".desktop .pd-gallery"), it.gallery, it.galleryLayout);
    renderMobileGallery($(".mobile .pd-gallery"), it.gallery);
  }

  /* ---- boot ---- */
  Promise.all([
    getJSON("/content/site.json").catch(function () { return null; }),
    getJSON("/content/projects.json").catch(function () { return null; }),
    getJSON("/content/shop.json").catch(function () { return null; })
  ]).then(function (res) {
    var site = res[0], projects = res[1], shop = res[2];
    if (site) {
      SITE_EMAIL = site.links && site.links.email;
      applyLinks(site.links);
      fillTextBlocks(site);
    }
    fillProjects(projects);
    if ($(".s-grid")) fillShopGrid(shop);
    if ($(".si-name")) fillShopItem(shop);
    if ($(".pd-gallery")) fillProjectItem(projects);
  });
})();
