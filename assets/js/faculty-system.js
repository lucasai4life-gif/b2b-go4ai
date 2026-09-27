/* ============================================================================
   ĐỘI NGŨ GIẢNG VIÊN & CHUYÊN GIA AI — page motion controller
   File: assets/js/faculty-system.js

   MOTION CONTRACT (mirrors assets/css/faculty-system.css)
     · Content is visible by default. This file never *creates* the hidden
       state — the inline head script adds `html.fc-motion` first, and only
       when `prefers-reduced-motion` is not `reduce`.
     · If anything in here throws, the inline watchdog drops `fc-motion` and
       the page renders as a complete static document.
     · Every loop pauses when its section leaves the viewport.
     · Animation is limited to transform, opacity and SVG stroke-dashoffset.
       No blur, filter or shadow animation.
     · No hover-only affordance on touch, no touch freezing, no layout shift.

   MOTION SYSTEMS
     1. Hero boot reveal      — staggered `fcBoot` on the hero stack
     2. Capability system map — sequential 01 → 06 scan, lane follows
     3. System layer          — the four platform cards auto-cycle
     4. Enablement flow       — ROLE → … → AI PASSPORT walk
     5. PROVE workflow        — P → R → O → V → E walk with the QC gate at V
     6. Faculty node pulse    — handled in CSS, gated on `html.fc-motion`
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Proof-of-life for the inline head watchdog: if this file never executes,
     `fc-js` is never added and the watchdog unwinds the motion layer. */
  root.classList.add('fc-js');

  if (!root.classList.contains('fc-motion')) return;

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduce = false; }
  if (reduce) return;

  var hasIO = typeof window.IntersectionObserver === 'function';
  var timers = [];

  function every(ms, fn) {
    var t = window.setInterval(fn, ms);
    timers.push(t);
    return t;
  }

  function motionOn() { return root.classList.contains('fc-motion'); }

  function onVisible(el, enter, leave) {
    if (!hasIO) { if (motionOn()) enter(); return null; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        /* The watchdog can drop the motion layer after load. Once it has, a
           section scrolling back into view must not restart its loop — the
           motion contract is that nothing animates without `html.fc-motion`. */
        if (entries[i].isIntersecting) { if (motionOn()) enter(); }
        else if (leave) leave();
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    io.observe(el);
    return io;
  }

  /* Cycles a list of elements through active / done states, pausing whenever
     the host section scrolls out of view. */
  function walker(host, items, opts) {
    if (!host || !items.length) return;
    var step = opts.step || 1400;
    var loop = opts.loop !== false;
    var at = -1;
    var tick = null;

    function paint(next) {
      if (next === at) return;
      at = next;
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('is--active', i === next);
        items[i].classList.toggle('is--done', i < next);
      }
    }

    function start() {
      if (tick) return;
      paint(0);
      tick = every(step, function () {
        if (!loop && at >= items.length - 1) {
          window.clearInterval(tick); tick = null; return;
        }
        paint((at + 1) % items.length);
      });
    }
    function stop() {
      if (!tick) return;
      window.clearInterval(tick);
      tick = null;
    }

    onVisible(host, start, stop);
    if (!hasIO) start();
  }

  /* ── 1. HERO BOOT REVEAL ────────────────────────────────────────────────
     The CSS animation is already running from the `fcBoot` class; this only
     hands the panel's level bars their staged "on" state so the visual reads
     as a boot sequence rather than a static block. */
  function bootPanel() {
    var levels = document.querySelectorAll('.fc-panel__level');
    if (!levels.length) return;
    for (var i = 0; i < levels.length; i++) {
      (function (el, idx) {
        window.setTimeout(function () { el.classList.add('is--on'); }, 620 + idx * 240);
      })(levels[i], i);
    }
  }

  /* ── 2. CAPABILITY SYSTEM MAP — sequential 01 → 06 scan ────────────────
     Walks the six levels one at a time. The lane that owns the current level
     lights with it (the nodes and lanes share `data-fc-stage`), the progress
     bar fills left → right, and levels already passed keep `is--done` so the
     run leaves a trail. Level 06 holds roughly twice a step before looping, so
     the end of the run reads as a completion rather than a jump cut. */
  function capabilityScan() {
    var map = document.querySelector('[data-fc-map]');
    if (!map) return;

    var nodes = map.querySelectorAll('.fc-map__node');
    var lanes = map.querySelectorAll('.fc-lane');
    var bar = map.querySelector('.fc-map__progress');
    if (!nodes.length) return;

    var STEP = 900;          /* per level; 06 then holds for two steps ≈1.8s */
    var at = -1, hold = false, tick = null;

    function stageOf(el) {
      var v = parseInt(el.getAttribute('data-fc-stage'), 10);
      return isNaN(v) ? -1 : v;
    }

    function paint(i) {
      at = i;
      var last = nodes.length - 1;
      for (var k = 0; k < nodes.length; k++) {
        nodes[k].classList.toggle('is--active', k === i);
        nodes[k].classList.toggle('is--done', k < i);
      }
      var st = stageOf(nodes[i]);
      for (var l = 0; l < lanes.length; l++) {
        lanes[l].classList.toggle('is--active', stageOf(lanes[l]) === st);
      }
      if (bar) bar.style.transform = 'scaleX(' + ((i + 1) / nodes.length) + ')';
      map.classList.toggle('is--complete', i === last);
    }

    function start() {
      if (tick) return;
      hold = false;
      paint(0);
      tick = every(STEP, function () {
        if (hold) { hold = false; paint(0); return; }
        var next = at + 1;
        if (next >= nodes.length) { hold = true; return; }
        paint(next);
      });
    }
    function stop() {
      if (!tick) return;
      window.clearInterval(tick);
      tick = null;
    }

    onVisible(map, start, stop);
    if (!hasIO) start();
  }

  /* ── 3. SYSTEM LAYER — the four platform cards cycle while in view ─────
     Each card holds ~1.2s and the last holds an extra beat before the run
     restarts. Hover lives in CSS so it can override the lit card without
     stopping the loop. The fan drop feeding the lit card pulses with it. */
  function systemLayer() {
    var grid = document.querySelector('.fc-arch__grid');
    if (!grid) return;

    var cards = grid.querySelectorAll('.fc-mod');
    if (!cards.length) return;
    var drops = document.querySelectorAll('.fc-arch__fan .fc-arch__drop');

    var STEP = 1200;
    var at = -1, hold = false, tick = null;

    function paint(i) {
      at = i;
      for (var k = 0; k < cards.length; k++) {
        cards[k].classList.toggle('is--active', k === i);
      }
      for (var d = 0; d < drops.length; d++) {
        drops[d].classList.toggle('is--active', d === i);
      }
    }

    function start() {
      if (tick) return;
      hold = false;
      grid.classList.add('is--scanning');
      paint(0);
      tick = every(STEP, function () {
        if (hold) { hold = false; paint(0); return; }
        var next = at + 1;
        if (next >= cards.length) { hold = true; return; }
        paint(next);
      });
    }
    function stop() {
      if (!tick) return;
      window.clearInterval(tick);
      tick = null;
      /* leave nothing lit once the section is out of view */
      grid.classList.remove('is--scanning');
      for (var k = 0; k < cards.length; k++) cards[k].classList.remove('is--active');
      for (var d = 0; d < drops.length; d++) drops[d].classList.remove('is--active');
    }

    onVisible(grid, start, stop);
    if (!hasIO) start();
  }

  /* ── 4. ENABLEMENT FLOW — ROLE → … → AI PASSPORT ─────────────────────── */
  function enablementFlow() {
    var flow = document.querySelector('[data-fc-flow]');
    if (!flow) return;
    walker(flow, flow.querySelectorAll('.fc-flow__step'), { step: 1250 });
  }

  /* ── 5. PROVE WORKFLOW — P → R → O → V → E, QC gate at V ─────────────── */
  function proveWorkflow() {
    var wf = document.querySelector('[data-fc-prove]');
    if (!wf) return;
    walker(wf, wf.querySelectorAll('.fc-wf__node'), { step: 1500 });
  }

  /* ── 6. SCROLL REVEAL ────────────────────────────────────────────────── */
  function reveals() {
    var items = document.querySelectorAll('.fc-reveal');
    if (!items.length) return;

    if (!hasIO) {
      for (var n = 0; n < items.length; n++) items[n].classList.add('is--in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        io.unobserve(el);
        var stagger = parseInt(el.getAttribute('data-fc-delay') || '0', 10);
        /* `el` must be captured per iteration. A closure straight over the loop
           variable resolves to whatever element the callback last touched, so a
           staggered node would light up a sibling and stay hidden itself. */
        if (stagger > 0) {
          (function (node, delay) {
            window.setTimeout(function () { node.classList.add('is--in'); }, delay);
          })(el, stagger);
        } else {
          el.classList.add('is--in');
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);

    /* Anything already on screen at load gets revealed immediately, so a
       restored scroll position can never leave a section blank. */
    window.setTimeout(function () {
      for (var k = 0; k < items.length; k++) {
        var r = items[k].getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) items[k].classList.add('is--in');
      }
    }, 240);
  }

  /* ── SAFETY NET ──────────────────────────────────────────────────────────
     If, for any reason, a `.fc-reveal` element is still at zero opacity after
     the page has settled, drop the whole motion layer rather than leave a
     blank section behind. */
  function failsafe() {
    window.setTimeout(function () {
      /* Judge only what the visitor can actually see right now.
         This used to probe `document.querySelector('.fc-reveal')` — but the
         first `.fc-reveal` lives in a section below the fold, so on a normal
         visit (hero still on screen at 3.2s) it legitimately reads opacity 0.
         The watchdog misread "not scrolled to yet" as "motion is broken" and
         tore the whole layer down, killing every loop on the page. Off-screen
         elements now get no vote; if nothing on screen can be judged, we keep
         the layer. */
      var probes = document.querySelectorAll('.fc-reveal, .fc-boot');
      var judged = 0;
      for (var i = 0; i < probes.length; i++) {
        var r = probes[i].getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
        judged++;
        if (window.getComputedStyle(probes[i]).opacity !== '0') return;
      }
      if (!judged) return;
      root.classList.remove('fc-motion');
      root.classList.add('fc-motion-fallback');
      for (var j = 0; j < timers.length; j++) window.clearInterval(timers[j]);
    }, 3200);
  }

  function init() {
    try { bootPanel(); } catch (e) {}
    try { capabilityScan(); } catch (e) {}
    try { systemLayer(); } catch (e) {}
    try { enablementFlow(); } catch (e) {}
    try { proveWorkflow(); } catch (e) {}
    try { reveals(); } catch (e) {}
    try { failsafe(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
