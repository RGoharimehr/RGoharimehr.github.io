/* ============================================================
   content.js — hydrates the site from content.json (edited via admin.html).
   If content.json is missing or fails to load, the static HTML in
   index.html is left untouched, so the site always works.
   ============================================================ */
(function () {
  var LB = { flat: [], i: 0, el: null, img: null, cap: null, count: null };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function q(sel, root) { return (root || document).querySelector(sel); }

  function setText(sel, val) { var e = q(sel); if (e && val != null) e.textContent = val; }
  function setHTML(sel, val) { var e = q(sel); if (e && val != null) e.innerHTML = val; }
  function setAttr(sel, attr, val) { var e = q(sel); if (e && val != null) e.setAttribute(attr, val); }

  function head(sectionSel, tag, title) {
    setText(sectionSel + " .section-head .tag", tag);
    setText(sectionSel + " .section-head h2", title);
  }

  function render(c) {
    /* ---- Hero ---- */
    if (c.hero) {
      var h = c.hero;
      setText(".hero .eyebrow", h.eyebrow);
      var h1 = q(".hero h1");
      if (h1) h1.innerHTML = esc(h.name) + '<br><span class="accent">' + esc(h.titleAccent) + "</span>";
      setText(".hero .lead", h.lead);
      var btns = document.querySelectorAll(".hero .btn-row a");
      if (btns[0]) { btns[0].textContent = h.primaryBtnText; btns[0].setAttribute("href", h.primaryBtnHref); }
      if (btns[1]) { btns[1].textContent = h.cvBtnText; btns[1].setAttribute("href", h.cvBtnHref); }
      setAttr(".hero-visual img", "src", h.photo);
      setAttr(".hero-visual img", "alt", h.name);
      setText(".hero-visual .label", h.photoCaption);
    }

    /* ---- About ---- */
    if (c.about) {
      head("#about", c.about.tag, c.about.title);
      var copy = q("#about .about-copy");
      if (copy && c.about.paragraphs) {
        copy.innerHTML = "";
        c.about.paragraphs.forEach(function (p) { copy.appendChild(el("p", null, esc(p))); });
      }
      setText("#about .about-video-badge", c.about.badge);
    }

    /* ---- Research ---- */
    if (c.research) {
      head("#research", c.research.tag, c.research.title);
      var rg = q("#research .research-grid");
      if (rg && c.research.cards) {
        rg.innerHTML = "";
        c.research.cards.forEach(function (card) {
          rg.appendChild(el("div", "research-card",
            '<div class="icon">' + esc(card.icon) + "</div><h3>" + esc(card.title) + "</h3><p>" + esc(card.text) + "</p>"));
        });
      }
    }

    /* ---- Skills ---- */
    if (c.skills) {
      head("#skills", c.skills.tag, c.skills.title);
      var sg = q("#skills .about-grid");
      if (sg && c.skills.groups) {
        sg.innerHTML = "";
        c.skills.groups.forEach(function (g) {
          var col = el("div");
          col.appendChild(el("h4", "skills-label", esc(g.label)));
          var tags = el("div", "tags");
          g.items.forEach(function (t) { tags.appendChild(el("span", "tag-pill", esc(t))); });
          col.appendChild(tags);
          sg.appendChild(col);
        });
      }
    }

    /* ---- Publications ---- */
    if (c.publications) {
      head("#publications", c.publications.tag, c.publications.title);
      var pl = q("#publications .pub-list");
      if (pl && c.publications.items) {
        pl.innerHTML = "";
        c.publications.items.forEach(function (p) {
          pl.appendChild(el("div", "pub-item",
            '<div class="pub-year">' + esc(p.year) + "</div><div><h4>" + esc(p.title) + "</h4><p>" + (p.authors || "") + "</p></div>"));
        });
      }
      var sch = q("#publications .btn-ghost");
      if (sch && c.publications.scholarUrl) sch.setAttribute("href", c.publications.scholarUrl);
    }

    /* ---- Experience & Education ---- */
    if (c.experience) {
      head("#experience", c.experience.tag, c.experience.title);
      var cols = document.querySelectorAll("#experience .exp-grid .timeline");
      function fillTimeline(tl, items) {
        if (!tl || !items) return;
        tl.innerHTML = "";
        items.forEach(function (it) {
          tl.appendChild(el("div", "tl-item",
            '<div class="meta">' + esc(it.meta) + "</div><h4>" + esc(it.title) + "</h4><p>" + esc(it.text) + "</p>"));
        });
      }
      fillTimeline(cols[0], c.experience.jobs);
      fillTimeline(cols[1], c.experience.education);
    }

    /* ---- Projects ---- */
    if (c.projects) {
      head("#projects", c.projects.tag, c.projects.title);
      var pg = q("#projects .project-grid");
      if (pg && c.projects.items) {
        pg.innerHTML = "";
        c.projects.items.forEach(function (p) {
          var tags = (p.tags || []).map(function (t) { return '<span class="tag-pill">' + esc(t) + "</span>"; }).join("");
          pg.appendChild(el("div", "project-card",
            '<div class="project-thumb"></div><div class="project-body"><h4>' + esc(p.title) + "</h4><p>" + esc(p.text) + '</p><div class="tags">' + tags + "</div></div>"));
        });
      }
    }

    /* ---- Events (with lightbox) ---- */
    if (c.events) {
      head("#events", c.events.tag, c.events.title);
      var list = q("#events-list");
      if (list && c.events.items) {
        list.innerHTML = "";
        LB.flat = [];
        c.events.items.forEach(function (ev) {
          var block = el("div", "event-block");
          if (ev.role) block.appendChild(el("span", "event-role", esc(ev.role)));
          block.appendChild(el("h4", null, esc(ev.title)));
          block.appendChild(el("p", "event-meta", esc(ev.meta)));
          if (ev.photos && ev.photos.length) {
            var g = el("div", "event-gallery");
            ev.photos.forEach(function (ph) {
              var idx = LB.flat.length; LB.flat.push(ph);
              var fig = el("figure", "event-shot");
              var im = el("img"); im.src = ph.src; im.alt = ph.caption || ev.title; im.loading = "lazy";
              fig.appendChild(im);
              if (ph.caption) fig.appendChild(el("figcaption", null, esc(ph.caption)));
              fig.addEventListener("click", function () { openLB(idx); });
              g.appendChild(fig);
            });
            block.appendChild(g);
          } else {
            block.appendChild(el("div", "event-empty", "<span>📷</span><span>Photos coming soon</span>"));
          }
          list.appendChild(block);
        });
      }
    }

    /* ---- Videos ---- */
    if (c.videos) {
      head("#videos", c.videos.tag, c.videos.title);
      var vg = q("#videos .video-grid");
      if (vg && c.videos.items) {
        vg.innerHTML = "";
        c.videos.items.forEach(function (v) {
          vg.appendChild(el("div", "video-card",
            '<div class="video-frame"><video controls preload="none"><source src="' + esc(v.src) + '" type="video/mp4"></video></div>' +
            '<div class="video-body"><h4>' + esc(v.title) + "</h4><p>" + esc(v.desc) + "</p></div>"));
        });
      }
    }

    /* ---- Tools ---- */
    if (c.tools) {
      head("#tools", c.tools.tag, c.tools.title);
      var tg = q("#tools .tool-grid");
      if (tg && c.tools.items) {
        tg.innerHTML = "";
        c.tools.items.forEach(function (t) {
          var a = el("a", "tool-card",
            '<div class="icon">' + esc(t.icon) + "</div><h4>" + esc(t.title) + "</h4><p>" + esc(t.desc) + '</p><span class="tool-status">' + esc(t.status) + "</span>");
          a.setAttribute("href", t.href || "#");
          tg.appendChild(a);
        });
      }
    }

    /* ---- Contact ---- */
    if (c.contact) {
      setText("#contact .contact-box h2", c.contact.title);
      setText("#contact .contact-box p", c.contact.text);
      var cl = q("#contact .contact-links");
      if (cl) {
        cl.innerHTML = "";
        var email = el("a", "btn btn-primary", "Email Me");
        email.setAttribute("href", "mailto:" + (c.contact.email || ""));
        cl.appendChild(email);
        (c.contact.links || []).forEach(function (lnk) {
          var a = el("a", "btn btn-ghost", esc(lnk.label));
          a.setAttribute("href", lnk.href); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
          cl.appendChild(a);
        });
      }
    }

    /* ---- Footer ---- */
    setText("footer", c.footer);
  }

  /* ---- Lightbox ---- */
  function openLB(i) { LB.i = i; updateLB(); LB.el.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeLB() { LB.el.classList.remove("open"); document.body.style.overflow = ""; }
  function stepLB(d) { if (!LB.flat.length) return; LB.i = (LB.i + d + LB.flat.length) % LB.flat.length; updateLB(); }
  function updateLB() {
    var ph = LB.flat[LB.i];
    LB.img.src = ph.src; LB.img.alt = ph.caption || "";
    LB.cap.textContent = ph.caption || "";
    LB.count.textContent = (LB.i + 1) + " / " + LB.flat.length;
  }
  function wireLB() {
    LB.el = q("#lightbox"); if (!LB.el) return;
    LB.img = q("img", LB.el); LB.cap = q("figcaption", LB.el); LB.count = q(".lb-count", LB.el);
    q(".lb-close", LB.el).addEventListener("click", closeLB);
    q(".lb-prev", LB.el).addEventListener("click", function (e) { e.stopPropagation(); stepLB(-1); });
    q(".lb-next", LB.el).addEventListener("click", function (e) { e.stopPropagation(); stepLB(1); });
    LB.el.addEventListener("click", function (e) { if (e.target === LB.el) closeLB(); });
    document.addEventListener("keydown", function (e) {
      if (!LB.el.classList.contains("open")) return;
      if (e.key === "Escape") closeLB();
      else if (e.key === "ArrowLeft") stepLB(-1);
      else if (e.key === "ArrowRight") stepLB(1);
    });
  }

  function boot() {
    wireLB();
    fetch("content.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("no content.json"); return r.json(); })
      .then(function (c) { try { render(c); } catch (e) { console.warn("content render failed", e); } })
      .catch(function () { /* keep static HTML */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
