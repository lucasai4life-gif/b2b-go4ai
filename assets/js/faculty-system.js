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
     2. Capability system map — one subsystem lane active at a time
     3. Enablement flow       — ROLE → … → AI PASSPORT walk
     4. PROVE workflow        — P → R → O → V → E walk with the QC gate at V
     5. Faculty node pulse    — handled in CSS, gated on `html.fc-motion`
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

  function onVisible(el, enter, leave) {
    if (!hasIO) { enter(); return null; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) enter();
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

  /* ── 2. CAPABILITY SYSTEM MAP — one subsystem lane active at a time ─────
     The 6 rail nodes and the 3 subsystem lanes share `data-fc-stage`, so a
     single toggle lights the pair of levels and the lane that owns them. */
  function capabilityMap() {
    var map = document.querySelector('[data-fc-map]');
    if (!map) return;

    var members = map.querySelectorAll('[data-fc-stage]');
    if (!members.length) return;

    var zones = [[], [], []];
    for (var i = 0; i < members.length; i++) {
      var s = parseInt(members[i].getAttribute('data-fc-stage'), 10);
      if (s >= 0 && s < 3) zones[s].push(members[i]);
    }

    var current = -1;

    function paint(next) {
      if (next === current) return;
      current = next;
      for (var z = 0; z < 3; z++) {
        var on = (z === next);
        for (var k = 0; k < zones[z].length; k++) {
          zones[z][k].classList.toggle('is--active', on);
        }
      }
    }

    var tick = null;
    function start() {
      if (tick) return;
      paint(0);
      tick = every(3000, function () { paint((current + 1) % 3); });
    }
    function stop() {
      if (!tick) return;
      window.clearInterval(tick);
      tick = null;
    }

    onVisible(map, start, stop);
    if (!hasIO) start();
  }

  /* ── 3. ENABLEMENT FLOW — ROLE → … → AI PASSPORT ─────────────────────── */
  function enablementFlow() {
    var flow = document.querySelector('[data-fc-flow]');
    if (!flow) return;
    walker(flow, flow.querySelectorAll('.fc-flow__step'), { step: 1250 });
  }

  /* ── 4. PROVE WORKFLOW — P → R → O → V → E, QC gate at V ─────────────── */
  function proveWorkflow() {
    var wf = document.querySelector('[data-fc-prove]');
    if (!wf) return;
    walker(wf, wf.querySelectorAll('.fc-wf__node'), { step: 1500 });
  }

  /* ── 5. SCROLL REVEAL ────────────────────────────────────────────────── */
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
      var probe = document.querySelector('.fc-reveal');
      if (!probe) return;
      var op = window.getComputedStyle(probe).opacity;
      if (op !== '0') return;
      root.classList.remove('fc-motion');
      root.classList.add('fc-motion-fallback');
      for (var i = 0; i < timers.length; i++) window.clearInterval(timers[i]);
    }, 3200);
  }

  function init() {
    try { bootPanel(); } catch (e) {}
    try { capabilityMap(); } catch (e) {}
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
