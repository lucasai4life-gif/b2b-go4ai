/* ============================================================================
   LUCAS SYSTEM — motion layer for lucas.html
   ----------------------------------------------------------------------------
   Contract (mirrors the repo-wide motion rule):

     CONTENT VISIBLE BY DEFAULT.
     MOTION FAILURE != PAGE FAILURE.

   The stylesheet hides nothing on its own. Every hidden state lives behind the
   `.lx-motion` class, which this file adds to <body> ONLY after it has verified
   the DOM it needs. If this script never loads, is blocked, throws, or the
   browser reports `prefers-reduced-motion: reduce`, `.lx-motion` is never added
   and the page renders as fully visible static content.

   Escape hatches:
     - try/catch around boot            -> teardown()
     - window 'error' during boot window-> teardown()
     - IntersectionObserver stall probe -> teardown()
     - runtime reduced-motion change    -> teardown()
   teardown() removes `.lx-motion`, settles every reveal target and restores
   every counter to its authored value.
   ========================================================================= */
(function () {
  'use strict';

  var BOOT_WINDOW = 5000;          // ms — errors after this are not ours to police
  var STALL_PROBE = 3200;          // ms — if IO never fires, assume it is broken

  var body = document.body;
  if (!body || !body.classList.contains('lucas-page')) return;

  var mqReduce = null;
  try { mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mqReduce = null; }

  var motionOn   = false;
  var tornDown   = false;
  var ioFired    = false;
  var bootedAt   = Date.now();
  var cycles     = [];
  var counters   = [];
  var io         = null;

  /* ------------------------------------------------------------- utilities */
  function toArray(list) { return Array.prototype.slice.call(list || []); }

  function qsa(sel, root) {
    try { return toArray((root || document).querySelectorAll(sel)); } catch (e) { return []; }
  }

  /* Split "10.000+" / "~70%" / "20 → 100+" into prefix + number + suffix. */
  function splitNumber(raw) {
    var m = /^(.*?)(\d[\d.,]*)(\D*)$/.exec(raw);
    if (!m) return null;
    var num = m[2];
    var sep = num.indexOf('.') !== -1 ? '.' : (num.indexOf(',') !== -1 ? ',' : '');
    var value = parseInt(num.replace(/[.,]/g, ''), 10);
    if (!isFinite(value)) return null;
    return { pre: m[1], post: m[3], value: value, sep: sep };
  }

  function group(n, sep) {
    var s = String(n);
    if (!sep || s.length < 4) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  /* --------------------------------------------------------------- teardown */
  function stopCycles() {
    cycles.forEach(function (c) {
      if (typeof c.stop === 'function') { try { c.stop(); } catch (e) {} }
      if (c.timer) { clearInterval(c.timer); c.timer = null; }
      if (c.rotateTimer) { clearInterval(c.rotateTimer); c.rotateTimer = null; }
      if (c.card) c.card.classList.remove('is--lx-active');
      if (c.root) c.root.classList.remove('is--lx-active');
      if (c.rotateNodes) {
        c.rotateNodes.forEach(function (n) { n.classList.remove(c.rotateClass, 'is--lx-node'); });
      }
    });
    cycles = [];
  }

  function restoreCounts() {
    counters.forEach(function (el) {
      if (el.__lxRaw != null) el.textContent = el.__lxRaw;
    });
  }

  function settleAll() {
    qsa('[data-lx-reveal], [data-lx-stagger], .lx-mask').forEach(function (el) {
      el.classList.add('is--lx-in');
    });
    qsa('[data-lx-count]').forEach(function (el) { el.classList.add('is--lx-counted'); });
  }

  function teardown() {
    if (tornDown) return;
    tornDown = true;
    try { stopCycles(); } catch (e) {}
    try { restoreCounts(); } catch (e) {}
    try { settleAll(); } catch (e) {}
    try { if (io) io.disconnect(); } catch (e) {}
    try { body.classList.remove('lx-motion'); } catch (e) {}
    motionOn = false;
  }

  /* ---------------------------------------------------------- scroll reveal */
  /*
     NOTE: a `clip-path: inset(0 100% 0 0)` element reports no intersection to
     IntersectionObserver, so a mask can never reveal itself. Mask elements are
     therefore watched through their (unclipped) parent and the reveal class is
     applied to the mask itself. `sweepInView()` is a second net on top.
  */
  function initReveal() {
    var direct = qsa('[data-lx-reveal], [data-lx-stagger]');
    var masks = qsa('.lx-mask');

    if (!('IntersectionObserver' in window)) {
      /* no observer -> no motion, but content must be fully visible */
      direct.concat(masks).forEach(function (el) { el.classList.add('is--lx-in'); });
      return false;
    }

    var apply = new WeakMap();   // observed element -> [elements to reveal]
    var observed = [];           // ordered list of hosts to observe

    function pair(host, target) {
      var list = apply.get(host);
      if (!list) { list = []; apply.set(host, list); observed.push(host); }
      if (list.indexOf(target) === -1) list.push(target);
    }

    direct.forEach(function (el) { pair(el, el); });
    masks.forEach(function (el) {
      var host = el.parentElement;
      if (!host || host === document.body) { el.classList.add('is--lx-in'); return; }
      pair(host, el);
    });

    if (!observed.length) return false;

    io = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (apply.get(entry.target) || []).forEach(function (el) { el.classList.add('is--lx-in'); });
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    observed.forEach(function (el) { io.observe(el); });
    return true;
  }

  /* Anything already on screen must never stay hidden, whatever the observer
     does. Runs a couple of times after boot and once on window load. */
  function sweepInView() {
    if (tornDown) return;
    var vh = window.innerHeight || 0;
    qsa('[data-lx-reveal], [data-lx-stagger], .lx-mask').forEach(function (el) {
      if (el.classList.contains('is--lx-in')) return;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('is--lx-in');
    });
  }

  /* --------------------------------------------------------------- count-up */
  function runCount(el, parts) {
    var dur = 1150;
    var t0 = null;
    function frame(ts) {
      if (tornDown) return;
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var v = Math.round(parts.value * easeOutExpo(p));
      el.textContent = parts.pre + group(v, parts.sep) + parts.post;
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = el.__lxRaw;
        el.classList.add('is--lx-counted');
      }
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var els = qsa('[data-lx-count]');
    if (!els.length || !('IntersectionObserver' in window)) return false;

    var seen = [];

    els.forEach(function (el) {
      var raw = (el.textContent || '').trim();
      var parts = splitNumber(raw);
      if (!parts) return;
      el.__lxRaw = raw;
      counters.push(el);
      seen.push({ el: el, parts: parts });
    });

    if (!seen.length) return false;

    var cio = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var hit = null;
        for (var i = 0; i < seen.length; i++) {
          if (seen[i].el === entry.target) { hit = seen[i]; break; }
        }
        if (hit) runCount(hit.el, hit.parts);
        cio.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.4 });

    seen.forEach(function (s) { cio.observe(s.el); });
    return true;
  }

  /* ------------------------------------------------------------ auto-cycles */
  function makeCycle(opts) {
    var root = opts.root;
    var cards = qsa(opts.cardSel, root);
    if (cards.length < 2) return;

    var c = {
      root: root,
      cards: cards,
      index: -1,
      timer: null,
      rotateTimer: null,
      rotateNodes: null,
      rotateClass: opts.rotateClass || 'is--lx-node',
      card: null,
      visible: false,
      hovered: false,
      focused: false,
      manualUntil: 0
    };

    function apply(i) {
      c.cards.forEach(function (card, idx) {
        card.classList.toggle('is--lx-active', idx === i);
      });
      c.index = i;
      c.card = c.cards[i] || null;
      startRotate();
    }

    function startRotate() {
      if (c.rotateTimer) { clearInterval(c.rotateTimer); c.rotateTimer = null; }
      if (c.rotateNodes) {
        c.rotateNodes.forEach(function (n) { n.classList.remove(c.rotateClass, 'is--lx-node'); });
        c.rotateNodes = null;
      }
      var sel = c.card && c.card.getAttribute('data-lx-rotate');
      if (!sel) return;
      /* class applied to the rotating node — per card, so a pipeline can reuse
         its own existing modifier while a tree uses the generic one */
      c.rotateClass = (c.card.getAttribute('data-lx-rotate-class') || opts.rotateClass || 'is--lx-node');
      var nodes = qsa(sel, c.card);
      if (nodes.length < 2) return;
      c.rotateNodes = nodes;
      var ri = 0;
      /* clear any authored highlight so only the rotating node is lit */
      nodes.forEach(function (n) { n.classList.remove(c.rotateClass); });
      nodes[0].classList.add(c.rotateClass);
      c.rotateTimer = setInterval(function () {
        if (tornDown || !c.visible || c.hovered || c.focused) return;
        nodes.forEach(function (n) { n.classList.remove(c.rotateClass); });
        ri = (ri + 1) % nodes.length;
        nodes[ri].classList.add(c.rotateClass);
      }, opts.rotateEvery || 700);
    }

    function step() {
      if (tornDown || !c.visible || c.hovered || c.focused) return;
      if (Date.now() < c.manualUntil) return;
      if (document.hidden) return;
      apply((c.index + 1) % c.cards.length);
    }

    function start() {
      if (c.timer || tornDown) return;
      if (c.index < 0) apply(opts.startAt || 0);
      c.timer = setInterval(step, opts.every || 2400);
    }

    function stop() {
      if (c.timer) { clearInterval(c.timer); c.timer = null; }
    }

    /* visibility gating — no work while off-screen */
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        ioFired = true;
        entries.forEach(function (e) {
          c.visible = e.isIntersecting;
          if (c.visible) start(); else stop();
        });
      }, { threshold: 0.15 });
      vio.observe(root);
    } else {
      c.visible = true;
      start();
    }

    root.addEventListener('mouseenter', function () { c.hovered = true; });
    root.addEventListener('mouseleave', function () { c.hovered = false; });
    root.addEventListener('focusin', function () { c.focused = true; });
    root.addEventListener('focusout', function () {
      if (!root.contains(document.activeElement)) c.focused = false;
    });

    c.apply = apply;
    c.applyNow = function (i) {
      c.manualUntil = Date.now() + 5200;   // user interaction wins for a while
      apply(i);
    };
    cycles.push(c);
    return c;
  }

  function initCardCycles() {
    qsa('[data-lx-cycle]').forEach(function (root) {
      var kind = root.getAttribute('data-lx-cycle');
      if (kind === 'bento') {
        makeCycle({
          root: root,
          cardSel: '.lucas-bento-card',
          every: 2600,
          rotateEvery: 720
        });
      } else if (kind === 'modules') {
        makeCycle({
          root: root,
          cardSel: '.lucas-topic-card',
          every: 2300
        });
      }
    });
  }

  /* ------------------------------------------------------- stepper protocol */
  function initStepper() {
    var stepper = document.querySelector('.journey-stepper');
    if (!stepper) return;
    var btns = qsa('.journey-step-btn', stepper);
    if (btns.length < 2) return;

    var timer = null;
    var manualUntil = 0;
    var visible = false;
    var hovered = false;
    var focused = false;

    function currentIndex() {
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains('is-active')) return i;
      }
      return 0;
    }

    function step() {
      if (tornDown || !visible || hovered || focused || document.hidden) return;
      if (Date.now() < manualUntil) return;
      var next = (currentIndex() + 1) % btns.length;
      /* reuse the page's own handler — single source of truth for step data */
      btns[next].click();
    }

    function start() {
      if (timer || tornDown) return;
      timer = setInterval(step, 1000);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        ioFired = true;
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) start(); else stop();
        });
      }, { threshold: 0.25 });
      vio.observe(stepper);
    } else {
      visible = true;
      start();
    }

    stepper.addEventListener('mouseenter', function () { hovered = true; });
    stepper.addEventListener('mouseleave', function () { hovered = false; });
    stepper.addEventListener('focusin', function () { focused = true; });
    stepper.addEventListener('focusout', function () {
      if (!stepper.contains(document.activeElement)) focused = false;
    });

    /* A real user click always wins over the auto-cycle. Programmatic clicks
       (used by the cycle itself) must NOT arm the manual hold, or the cycle
       would block itself for the whole hold window. */
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (!e || e.isTrusted !== true) return;
        manualUntil = Date.now() + 6000;
      });
    });

    cycles.push({
      root: stepper,
      card: null,
      stop: stop
    });
  }

  /* ---------------------------------------------------------- stall / error */
  function armGuards() {
    window.addEventListener('error', function () {
      if (Date.now() - bootedAt < BOOT_WINDOW) teardown();
    });

    /* If the observer never reports back, the motion layer is not trustworthy. */
    setTimeout(function () {
      if (!tornDown && motionOn && !ioFired) teardown();
    }, STALL_PROBE);

    if (mqReduce && typeof mqReduce.addEventListener === 'function') {
      mqReduce.addEventListener('change', function (e) {
        if (e.matches) teardown();
      });
    }

    document.addEventListener('visibilitychange', function () {
      /* intervals already self-guard on document.hidden */
    });
  }

  /* ------------------------------------------------------------------- boot */
  function boot() {
    if (mqReduce && mqReduce.matches) return;   // static final state

    var ok = false;
    try {
      /* Enable the layer first so the observers below see the real hidden
         state, then verify each subsystem actually wired up. */
      body.classList.add('lx-motion');
      motionOn = true;

      var r1 = initReveal();
      var r2 = initCounters();
      initCardCycles();
      initStepper();

      ok = r1 || r2 || cycles.length > 0;

      /* second and third net: nothing on screen may stay hidden */
      setTimeout(sweepInView, 900);
      setTimeout(sweepInView, 2600);
      window.addEventListener('load', sweepInView);
    } catch (err) {
      teardown();
      return;
    }

    if (!ok) { teardown(); return; }
    armGuards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
