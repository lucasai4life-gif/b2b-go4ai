/* ============================================================================
   app-case-system.js — Trang "Ứng dụng thực tế"
   High-Tech Enterprise AI × Cinematic Case Study Experience — motion layer
   ----------------------------------------------------------------------------
   GO4AI / b2b-go4ai
   Requires: GSAP 3 + ScrollTrigger (loaded before this file).
   Loaded only on ung-dung-thuc-te.html.

   Motion language (4 groups only):
     01 / REVEAL  — title, paragraph
     02 / FLOW    — pipeline, workflow, timeline
     03 / DATA    — metric, number
     04 / VERIFY  — impact, evidence, result

   ── BOOT CONTRACT (content visible by default) ────────────────────────────
   The page NEVER ships with a hidden state. `<html>` has no `app-motion` class
   in the markup. This file adds it ONLY after it has verified:
       · window.gsap exists
       · window.ScrollTrigger exists
       · the DOM this module animates exists
   and it adds it in the same synchronous tick as the initial `gsap.set()`
   calls, so nothing ever flashes hidden-then-visible.

   If any of those checks fails, or any step throws, the module switches the
   document to `app-motion-fallback` — a CSS state that forces every motion
   element back to its final, visible form.

   An independent inline watchdog in <head> covers the case where this file
   never loads at all (404, blocked, network error).

   MOTION FAILURE ≠ PAGE FAILURE. The page must never be blank.
   ========================================================================= */
(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     0. PAGE GUARD + HARD REQUIREMENTS
  -------------------------------------------------------------------------- */
  var root = document.documentElement;
  var PAGE = document.querySelector('.app-hero');
  if (!PAGE) return; /* not this page — stay completely inert */

  /* This file executed. The inline watchdog in <head> reads this flag. */
  window.__acsSystemReady = true;

  var MOTION_CLASS = 'app-motion';
  var FALLBACK_CLASS = 'app-motion-fallback';

  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mqReduce && mqReduce.matches);

  /* --------------------------------------------------------------------------
     1. UTILITIES
  -------------------------------------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function fmtVi(n) { return n.toLocaleString('vi-VN'); }

  /* Everything the motion layer is allowed to hide. Used both for the
     `clearProps` sweep and as the source of truth for the CSS fallback. */
  var MOTION_SELECTOR = [
    '.acs-hero-bg__grid', '.acs-hero-bg__glow', '.acs-hero-bg__beam', '.acs-hero-bg__lines',
    '.acs-hero-seq', '.acs-line__i', '.app-hero__desc',
    '.app-flow-step', '.app-flow-sep',
    '.acs-corners i', '.acs-case-meta', '.acs-title-rule',
    '.cs-case__media > *',
    '.case__tag', '.cs-case__title', '.case-timeline', '.case-timeline__item',
    '.cs-case__metric-row', '.cs-sales-impact', '.cs-pipeline-strip', '.cs-hub-impact',
    '.cs-auto-flow', '.cs-hub-impact-box', '.cs-sales-sync-badge', '.app-case-disclaimer',
    '.cs-sales-metric-card__from', '.cs-sales-metric-card__arrow', '.cs-sales-metric-card__to',
    '.case__action'
  ].join(',');

  /* Switch the document to its final, fully visible static state. */
  function forceStatic(gsapRef) {
    root.classList.remove(MOTION_CLASS);
    root.classList.add(FALLBACK_CLASS);
    if (gsapRef) {
      /* Clear any inline styles a half-finished timeline may have left behind.
         The CSS fallback also uses !important, so this is belt-and-braces. */
      try { gsapRef.set(qsa(MOTION_SELECTOR), { clearProps: 'all' }); } catch (e) { /* ignore */ }
    }
  }

  /* Turn the motion gate on. Must be called in the same synchronous tick as
     the initial gsap.set() calls so no frame is painted in between. */
  function enableMotion() {
    root.classList.remove(FALLBACK_CLASS);
    root.classList.add(MOTION_CLASS);
  }

  function hasRequiredDom() {
    if (!qs('.app-hero__title')) return false;
    if (qsa('.acs-line__i').length < 2) return false;
    if (!qs('.app-flow-bar')) return false;
    if (!qsa('.cs-case').length) return false;
    if (!qsa('.cs-case__title').length) return false;
    return true;
  }

  /* ==========================================================================
     A. VIDEO CARD INTERACTION (independent of GSAP)
     ========================================================================== */
  function initVideoCards() {
    qsa('[data-video-card]').forEach(function (card) {
      var video   = qs('video', card);
      var poster  = qs('.case-video-card__poster', card);
      var playBtn = qs('.case-video-card__play-btn', card);
      if (!video || !poster || !playBtn) return;

      playBtn.addEventListener('click', function () {
        var hasSource = video.currentSrc || qs('source', video) || video.src;
        if (hasSource) {
          poster.style.opacity = '0';
          setTimeout(function () { poster.style.display = 'none'; }, 300);
          video.play().catch(function () {});
        } else {
          playBtn.style.transform = 'scale(0.93)';
          setTimeout(function () { playBtn.style.transform = ''; }, 150);
          var badge = qs('.case-video-card__badge span:last-child', card);
          if (badge) {
            var orig = badge.textContent;
            badge.textContent = 'CHỜ NGUỒN VIDEO';
            setTimeout(function () { badge.textContent = orig; }, 2000);
          }
        }
      });
    });
  }

  /* ==========================================================================
     B. CASE INDEX RAIL — DESKTOP (independent of GSAP)
     ========================================================================== */
  function initRail() {
    var rail = qs('#acs-rail');
    var library = qs('.cs-library');
    if (!rail || !library) return;

    var list    = qs('.acs-rail__list', rail);
    var items   = qsa('.acs-rail__item', rail);
    var countEl = qs('.acs-rail__count', rail);
    var cases   = qsa('.cs-case', library);
    if (!items.length || !cases.length) return;

    var total = cases.length;
    var activeIndex = -1;
    var raf = null;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function setActive(idx) {
      if (idx === activeIndex) return;
      activeIndex = idx;

      items.forEach(function (it, i) {
        it.classList.toggle('is--active', i === idx);
        it.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });

      if (countEl) countEl.textContent = 'CASE ' + pad(idx + 1) + ' / ' + pad(total);

      var item = items[idx];
      if (item && list) {
        var listRect = list.getBoundingClientRect();
        var itemRect = item.getBoundingClientRect();
        var centre = (itemRect.top + itemRect.height / 2) - listRect.top;
        var p = listRect.height ? clamp(centre / listRect.height, 0, 1) : 0;

        if (reduce) {
          list.style.setProperty('--acs-rail-fill', String(p));
        } else {
          var current = parseFloat(list.style.getPropertyValue('--acs-rail-fill')) || 0;
          var start = current;
          var t0 = performance.now();
          var dur = 420;
          (function step(now) {
            var t = clamp((now - t0) / dur, 0, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            list.style.setProperty('--acs-rail-fill', String(start + (p - start) * eased));
            if (t < 1) requestAnimationFrame(step);
          })(t0);
        }
      }
    }

    function update() {
      raf = null;
      var libRect = library.getBoundingClientRect();
      var vh = window.innerHeight;

      var visible = libRect.top < vh * 0.62 && libRect.bottom > vh * 0.28;
      rail.classList.toggle('is--visible', visible);
      rail.setAttribute('aria-hidden', visible ? 'false' : 'true');
      items.forEach(function (it) { it.tabIndex = visible ? 0 : -1; });

      if (!visible) return;

      var anchor = vh * 0.42;
      var idx = -1;
      for (var i = 0; i < cases.length; i++) {
        if (cases[i].getBoundingClientRect().top <= anchor) idx = i;
      }
      if (idx < 0) idx = 0;
      setActive(idx);
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { setActive(i); });
    });

    update();
  }

  /* ==========================================================================
     C. HERO DEPLOYMENT PIPELINE — AUTO ACTIVE (independent of GSAP)
     ========================================================================== */
  function initPipeline() {
    var bar = qs('.app-flow-bar');
    if (!bar) return;

    var steps = qsa('.app-flow-step', bar);
    var seps  = qsa('.app-flow-sep', bar);
    if (!steps.length) return;

    var current = -1;
    var timer = null;
    var hovered = false;
    var started = false;

    function activate(idx) {
      if (idx < 0 || idx >= steps.length) idx = 0;
      current = idx;
      steps.forEach(function (s, i) { s.classList.toggle('is--active', i === idx); });

      var feed = idx - 1;
      seps.forEach(function (s, i) {
        if (i !== feed) { s.classList.remove('is--pulse'); return; }
        s.classList.remove('is--pulse');
        void s.offsetWidth; /* restart the pulse animation */
        s.classList.add('is--pulse');
        setTimeout(function () { s.classList.remove('is--pulse'); }, 650);
      });
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); timer = setInterval(next, 1000); }
    function next() { if (!hovered) activate((current + 1) % steps.length); }

    /* reduced motion → static final state (endpoint highlighted, no cycle) */
    if (reduce) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is--active', i === steps.length - 1);
      });
      return;
    }

    var isDesktop = window.matchMedia && window.matchMedia('(min-width: 992px)').matches;
    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () {
        if (!isDesktop) return;
        hovered = true;
        stop();
        activate(i);
      });
    });
    bar.addEventListener('mouseleave', function () {
      if (!hovered) return;
      hovered = false;
      start();
    });

    window.__acsStartPipeline = function () {
      if (started) return;
      started = true;
      activate(0);
      start();
    };

    setTimeout(function () {
      if (!started && typeof window.__acsStartPipeline === 'function') window.__acsStartPipeline();
    }, 4200);
  }

  /* ==========================================================================
     D. HERO BOOT SEQUENCE — 0.0s → ~2.4s (runs once, never loops)
     ========================================================================== */
  function initHeroBoot(gsap) {
    var grid   = qs('.acs-hero-bg__grid');
    var glow   = qs('.acs-hero-bg__glow');
    var beam   = qs('.acs-hero-bg__beam');
    var lines  = qs('.acs-hero-bg__lines');
    var eyebrow = qs('.app-hero__eyebrow');
    var l1     = qs('.acs-line--1 .acs-line__i');
    var l2     = qs('.acs-line--2 .acs-line__i');
    var desc   = qs('.app-hero__desc');
    var steps  = qsa('.app-flow-step');
    var seps   = qsa('.app-flow-sep');

    gsap.set([l1, l2].filter(Boolean), { yPercent: 118, opacity: 0, filter: 'blur(7px)' });
    if (eyebrow) gsap.set(eyebrow, { autoAlpha: 0, y: 10 });
    if (desc) gsap.set(desc, { autoAlpha: 0, y: 14 });
    if (steps.length) gsap.set(steps, { autoAlpha: 0, y: 12 });
    if (seps.length) gsap.set(seps, { autoAlpha: 0 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (grid)  tl.to(grid,  { opacity: 1, duration: 0.9 }, 0);
    if (glow)  tl.to(glow,  { opacity: 1, duration: 1.0 }, 0.05);
    if (beam)  tl.to(beam,  { opacity: 1, duration: 0.85 }, 0.12);
    if (lines) tl.to(lines, { opacity: 0.85, duration: 1.05 }, 0.22);

    if (eyebrow) tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.3);

    if (l1) tl.to(l1, {
      yPercent: 0, opacity: 1, filter: 'blur(0px)',
      duration: 0.85, ease: 'power3.out'
    }, 0.55);

    if (l2) {
      tl.to(l2, {
        yPercent: 0, opacity: 1, filter: 'blur(0px)',
        duration: 0.9, ease: 'power3.out'
      }, 1.12);
      tl.call(function () { l2.classList.add('is--sweep'); }, null, 1.72);
    }

    if (desc) tl.to(desc, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.52);

    if (steps.length) {
      tl.to(steps, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06 }, 1.82);
    }
    if (seps.length) {
      tl.to(seps, { autoAlpha: 1, duration: 0.4, stagger: 0.06 }, 1.88);
    }

    tl.call(function () {
      if (typeof window.__acsStartPipeline === 'function') window.__acsStartPipeline();
    }, null, 2.34);

    /* Watchdog: if the hero timeline never advanced, the page must not stay
       blank — drop the motion layer and fall back to the static state. */
    setTimeout(function () {
      if (tl.progress() === 0) forceStatic(gsap);
    }, 2600);

    return tl;
  }

  /* ==========================================================================
     E. HERO DEPTH PARALLAX — pointer reactive (desktop, non-reduced only)
     ========================================================================== */
  function initHeroParallax() {
    if (reduce) return;
    if (!(window.matchMedia && window.matchMedia('(min-width: 992px)').matches)) return;

    var grid = qs('.acs-hero-bg__grid');
    var glow = qs('.acs-hero-bg__glow');
    if (!grid && !glow) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, running = false;

    function tick() {
      tx += (cx - tx) * 0.06;
      ty += (cy - ty) * 0.06;
      if (grid) grid.style.transform = 'translate3d(' + (tx * 7).toFixed(2) + 'px,' + (ty * 4).toFixed(2) + 'px,0)';
      if (glow) glow.style.transform = 'translate3d(' + (-tx * 12).toFixed(2) + 'px,' + (-ty * 7).toFixed(2) + 'px,0)';
      if (running) raf = requestAnimationFrame(tick);
    }

    PAGE.addEventListener('mousemove', function (e) {
      var r = PAGE.getBoundingClientRect();
      cx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      cy = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });

    PAGE.addEventListener('mouseleave', function () { cx = 0; cy = 0; });

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(tick); }
        else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.05 });
    io.observe(PAGE);
  }

  /* ==========================================================================
     F. CASE NUMBER PARALLAX — decorative system index
     ========================================================================== */
  function initCaseIndexParallax(gsap) {
    if (reduce) return;
    qsa('.cs-case').forEach(function (caseEl) {
      var badge = qs('.cs-case__num-badge', caseEl);
      if (!badge) return;
      gsap.fromTo(badge, { y: 16 }, {
        y: -24,
        ease: 'none',
        scrollTrigger: { trigger: caseEl, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ==========================================================================
     G. CASE REVEAL — BOOT → PROCESS → OUTPUT → RESULT
     ========================================================================== */
  function initCaseReveal(gsap) {
    qsa('.cs-case').forEach(function (caseEl) {
      var tag    = qs('.case__tag', caseEl);
      var title  = qs('.cs-case__title', caseEl);
      var rule   = qs('.acs-title-rule', caseEl);
      var media  = qs('.case-video-embed', caseEl) || qs('.case-video-card', caseEl) || qs('.case-image-card', caseEl);
      var tl0    = qs('.case-timeline', caseEl);
      var items  = qsa('.case-timeline__item', caseEl);
      var action = qs('.case__action', caseEl);

      var tl = gsap.timeline({
        scrollTrigger: { trigger: caseEl, start: 'top 78%', once: true }
      });

      tl.call(function () { caseEl.classList.add('is--active'); }, null, 0);
      tl.call(function () { caseEl.classList.add('is--revealed'); }, null, 0);

      if (tag) {
        tl.fromTo(tag, { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.05);
      }

      /* REVEAL — kinetic title: mask from the bottom + blur → sharp */
      if (title) {
        tl.fromTo(title,
          { y: 38, autoAlpha: 0, filter: 'blur(6px)', clipPath: 'inset(100% 0% 0% 0%)' },
          { y: 0, autoAlpha: 1, filter: 'blur(0px)', clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.85, ease: 'power3.out' }, 0.18);
      }

      if (rule) {
        tl.fromTo(rule, { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.8);
      }

      /* PROCESS — media reveal. Clip-path lives on the inner media box, never
         on `.cs-case__media`, so the sticky behaviour stays untouched. */
      if (media) {
        tl.fromTo(media,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power3.out',
            onComplete: function () { gsap.set(media, { clearProps: 'clipPath' }); } }, 0.32);
      }

      /* FLOW — timeline layers activate in order */
      if (tl0) {
        tl.fromTo(tl0, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0.6);
      }
      if (items.length) {
        tl.fromTo(items, { y: 16 }, { y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' }, 0.64);
      }

      /* DATA / VERIFY — metrics, impact, CTA */
      var metrics = qsa('.cs-case__metric-row, .cs-sales-impact, .cs-pipeline-strip, .cs-hub-impact, .cs-auto-flow', caseEl);
      metrics.forEach(function (m, i) {
        tl.fromTo(m, { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 1.0 + i * 0.12);
      });

      if (action) {
        tl.fromTo(action, { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 1.34);
      }
    });
  }

  /* ==========================================================================
     H. TIMELINE — SCROLL-ACTIVATED PROCESSING
     ========================================================================== */
  function initTimelineScrub(gsap, ST) {
    qsa('.cs-case').forEach(function (caseEl) {
      var timeline = qs('.case-timeline', caseEl);
      if (!timeline) return;
      var fill = qs('.acs-tl-fill', timeline);
      var items = qsa('.case-timeline__item', timeline);
      if (!items.length) return;

      var last = -1;

      function update() {
        var anchor = window.innerHeight * 0.58;
        var idx = 0;
        for (var i = 0; i < items.length; i++) {
          if (items[i].getBoundingClientRect().top <= anchor) idx = i;
        }

        if (idx !== last) {
          last = idx;
          items.forEach(function (it, i) {
            it.classList.toggle('is--past', i < idx);
            it.classList.toggle('is--active', i === idx);
            it.classList.toggle('is--next', i > idx);
          });
        }

        if (fill) {
          var tlRect = timeline.getBoundingClientRect();
          var itRect = items[idx].getBoundingClientRect();
          var dotTop = (itRect.top - tlRect.top) + 9;
          var p = tlRect.height ? clamp(dotTop / tlRect.height, 0, 1) : 0;
          fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
        }
      }

      ST.create({
        trigger: caseEl,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: update,
        onRefresh: update
      });
      update();
    });
  }

  /* ==========================================================================
     I. WORKFLOW / PIPELINE — SEQUENTIAL DATA FLOW
     ========================================================================== */
  function initWorkflowFlow(gsap) {
    /* 02 / FLOW — chip chains (Vai trò → Bài toán → … → KPI) */
    qsa('.cs-flow-chips').forEach(function (container) {
      var chips  = qsa('.cs-flow-chip', container);
      var arrows = qsa('.cs-flow-arrow', container);
      if (chips.length < 2) return;

      var tl = gsap.timeline({
        scrollTrigger: { trigger: container, start: 'top 88%', once: true }
      });

      chips.forEach(function (chip, i) {
        var t = i * 0.42;
        tl.call(function () {
          chips.forEach(function (c) { c.classList.remove('is--active'); });
          chip.classList.add('is--active');
        }, null, t);

        if (arrows[i]) {
          tl.call(function () {
            var a = arrows[i];
            a.classList.remove('is--pulse');
            void a.offsetWidth;
            a.classList.add('is--pulse');
          }, null, t + 0.2);
        }

        tl.call(function () { chip.classList.add('is--done'); }, null, t + 0.36);
      });

      tl.call(function () {
        chips.forEach(function (c, i) {
          c.classList.toggle('is--active', i === chips.length - 1);
          c.classList.add('is--done');
        });
      }, null, chips.length * 0.42);
    });

    /* pipeline nodes / hub flow / automation flow */
    qsa('.cs-pipeline-strip, .cs-hub-flow, .cs-auto-flow').forEach(function (container) {
      var nodes = qsa('.cs-pipeline__node, .cs-auto-flow__node', container);
      if (nodes.length < 2) return;

      var tl = gsap.timeline({
        scrollTrigger: { trigger: container, start: 'top 90%', once: true }
      });
      nodes.forEach(function (node, i) {
        tl.call(function () {
          nodes.forEach(function (n) { n.classList.remove('is--active'); });
          node.classList.add('is--active');
        }, null, i * 0.24);
      });
      tl.call(function () {
        nodes.forEach(function (n, i) {
          n.classList.toggle('is--active', i === nodes.length - 1);
        });
      }, null, nodes.length * 0.24 + 0.1);
    });
  }

  /* ==========================================================================
     J. DATA MOMENTS — COUNT-UP + OLD → TARGET SEQUENCES
     ========================================================================== */
  function countUp(el, target, suffix, duration, done) {
    var start = performance.now();
    (function step(now) {
      var t = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * eased);
      el.textContent = (target >= 1000 ? fmtVi(val) : String(val)) + suffix;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = (target >= 1000 ? fmtVi(target) : String(target)) + suffix;
        if (done) done();
      }
    })(start);
  }

  function initMetrics(gsap, ST) {
    /* Case 01 — AI Enablement: 0 → 3.000+ / 14+ / 10+ */
    var countEls = qsa('[data-acs-count]');
    if (countEls.length) {
      countEls.forEach(function (el) {
        var suffix = el.getAttribute('data-acs-suffix') || '';
        el.textContent = '0' + suffix;
      });

      var host = countEls[0].closest('.cs-case') || countEls[0];
      ST.create({
        trigger: host,
        start: 'top 68%',
        once: true,
        onEnter: function () {
          countEls.forEach(function (el, i) {
            var target = parseFloat(el.getAttribute('data-acs-count'));
            var suffix = el.getAttribute('data-acs-suffix') || '';
            if (isNaN(target)) return;
            var chip = el.closest('.cs-metric-chip');
            if (chip) chip.classList.add('is--active');

            setTimeout(function () {
              countUp(el, target, suffix, target >= 1000 ? 1600 : 1250, function () {
                if (chip) {
                  chip.classList.add('is--scan');
                  setTimeout(function () { chip.classList.remove('is--scan'); }, 950);
                }
              });
            }, i * 150);
          });
        }
      });
    }

    /* Case 03, 04, 07: old value → arrow → target value → badges → supporting text */
    qsa('.cs-sales-metric-card').forEach(function (card, ci) {
      var from  = qs('.cs-sales-metric-card__from', card);
      var arrow = qs('.cs-sales-metric-card__arrow', card);
      var to    = qs('.cs-sales-metric-card__to', card);
      if (!from || !to) return;

      var impactUnit = card.closest('.cs-sales-impact');
      var badges     = impactUnit ? qs('.cs-impact-badges', impactUnit) : null;
      var supporting = impactUnit ? qs('.cs-impact-supporting', impactUnit) : null;

      gsap.set([from, arrow, to].filter(Boolean), { autoAlpha: 0, y: 10 });
      if (badges) gsap.set(badges, { autoAlpha: 0, y: 8 });
      if (supporting) gsap.set(supporting, { autoAlpha: 0, y: 8 });

      ST.create({
        trigger: card,
        start: 'top 86%',
        once: true,
        onEnter: function () {
          var tl = gsap.timeline({ delay: ci * 0.16 });
          tl.call(function () { card.classList.add('is--active'); }, null, 0);
          tl.to(from, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.05);
          if (arrow) {
            tl.to(arrow, { autoAlpha: 1, y: 0, scale: 1.15, duration: 0.35, ease: 'back.out(1.5)' }, 0.3);
            tl.call(function () {
              arrow.classList.add('is--pulse');
              setTimeout(function () { arrow.classList.remove('is--pulse'); }, 700);
            }, null, 0.32);
          }
          tl.to(to, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }, 0.5);
          tl.call(function () { to.classList.add('is--pulsed'); }, null, 0.72);
          if (badges) {
            tl.to(badges, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.88);
          }
          if (supporting) {
            tl.to(supporting, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.05);
          }
        }
      });
    });
  }

  /* ==========================================================================
     K. VERIFY — impact boxes settle with a one-off confirmation
     ========================================================================== */
  function initVerify(gsap, ST) {
    qsa('.cs-hub-impact-box, .cs-sales-sync-badge, .app-case-disclaimer').forEach(function (el) {
      gsap.set(el, { autoAlpha: 0, y: 12 });
      ST.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: function () {
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     L. STATIC FINAL STATE — used by every non-animated path
     ========================================================================== */
  function initStatic() {
    qsa('.cs-case').forEach(function (caseEl) {
      caseEl.classList.add('is--active', 'is--revealed');
      var fill = qs('.acs-tl-fill', caseEl);
      if (fill) fill.style.transform = 'scaleY(1)';
      qsa('.case-timeline__item', caseEl).forEach(function (it, i, arr) {
        it.classList.add(i === arr.length - 1 ? 'is--active' : 'is--past');
      });
      qsa('.cs-flow-chip', caseEl).forEach(function (c) { c.classList.add('is--done'); });
      qsa('.cs-pipeline__node, .cs-auto-flow__node', caseEl).forEach(function (n) {
        n.classList.add('is--active');
      });
      qsa('.cs-metric-chip', caseEl).forEach(function (c) { c.classList.add('is--active'); });
      qsa('.cs-sales-metric-card', caseEl).forEach(function (c) { c.classList.add('is--active'); });
    });

    /* metrics must show their final values */
    qsa('[data-acs-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-acs-count'));
      var suffix = el.getAttribute('data-acs-suffix') || '';
      if (!isNaN(target)) el.textContent = (target >= 1000 ? fmtVi(target) : String(target)) + suffix;
    });
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  function boot() {
    /* 1. Non-GSAP behaviour first — always safe, always useful. */
    try {
      initVideoCards();
      initRail();
      initPipeline();
    } catch (e) {
      /* never let a decoration break the page */
      if (window.console && console.warn) console.warn('[app-case-system] non-motion init:', e);
    }

    /* 2. Decide whether the motion layer may run at all. */
    if (reduce) { forceStatic(null); initStatic(); return; }

    var gsap = window.gsap;
    var ST   = window.ScrollTrigger;

    if (!gsap || !ST || typeof gsap.timeline !== 'function') {
      forceStatic(null);
      initStatic();
      return;
    }

    /* 3. Verify before hiding anything. */
    try {
      gsap.registerPlugin(ST);
      if (!hasRequiredDom()) throw new Error('required DOM missing');

      /* 4. Gate ON + initial states in the same synchronous tick, so no frame
            is ever painted in the hidden state. */
      enableMotion();

      initHeroBoot(gsap);
      initHeroParallax();
      initCaseIndexParallax(gsap);
      initCaseReveal(gsap);
      initTimelineScrub(gsap, ST);
      initWorkflowFlow(gsap);
      initMetrics(gsap, ST);
      initVerify(gsap, ST);
    } catch (err) {
      /* MOTION FAILURE ≠ PAGE FAILURE */
      forceStatic(gsap);
      initStatic();
      if (window.console && console.warn) console.warn('[app-case-system] motion disabled:', err);
      return;
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); });
    }
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* This script sits at the very end of <body>, so every element this module
     touches is already parsed. Booting synchronously lets the gate and the
     initial gsap.set() calls land in the same tick — the hidden state is never
     painted, and if the script is ever moved to <head> the page guard above
     simply makes the module inert (content stays visible). */
  boot();
})();
