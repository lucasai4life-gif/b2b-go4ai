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
     · No hover-only affordance on touch, no touch freezing, no layout shift.

   FOUR MOTION SYSTEMS
     1. Hero boot reveal      — staggered `fcBoot` on the hero stack
     2. 6-level auto-active   — capability path cycles TRAIN → DESIGN → ARCHITECT
     3. PROVE sequence        — P → R → O → V → E highlight walk
     4. Faculty node pulse    — handled in CSS, gated on `html.fc-motion`
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

  function every(ms, fn, key) {
    var t = window.setInterval(fn, ms);
    timers.push(t);
    return t;
  }

  function onVisible(el, enter, leave) {
    if (!hasIO) { enter(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) enter();
        else if (leave) leave();
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    io.observe(el);
    return io;
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

  /* ── 2. CAPABILITY PATH — AUTO-ACTIVE 01-02 → 03-04 → 05-06 ──────────── */
  function capabilityPath() {
    var rail = document.querySelector('[data-fc-path]');
    if (!rail) return;

    var nodes = rail.querySelectorAll('[data-fc-stage]');
    var track = rail.querySelector('.fc-path__track i');
    if (!nodes.length) return;

    var zones = [];
    for (var z = 0; z < 3; z++) zones.push([]);
    for (var i = 0; i < nodes.length; i++) {
      var s = parseInt(nodes[i].getAttribute('data-fc-stage'), 10);
      if (s >= 0 && s < 3) zones[s].push(nodes[i]);
    }

    var current = -1;

    function paint(next) {
      if (next === current) return;
      current = next;
      for (var s = 0; s < 3; s++) {
        var on = (s === next);
        for (var k = 0; k < zones[s].length; k++) {
          zones[s][k].classList.toggle('is--active', on);
        }
      }
      if (track) track.style.transform = 'translateX(' + (next * 100) + '%)';
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

    onVisible(rail, start, stop);
    if (!hasIO) start();
  }

  /* ── 3. PROVE SEQUENCE — P → R → O → V → E ───────────────────────────── */
  function proveSequence() {
    var list = document.querySelector('[data-fc-prove]');
    if (!list) return;

    var steps = list.querySelectorAll('li');
    if (!steps.length) return;

    var at = -1;
    function paint(next) {
      if (next === at) return;
      at = next;
      for (var i = 0; i < steps.length; i++) {
        steps[i].classList.toggle('is--active', i === next);
      }
    }

    var tick = null;
    function start() {
      if (tick) return;
      paint(0);
      tick = every(1400, function () { paint((at + 1) % steps.length); });
    }
    function stop() {
      if (!tick) return;
      window.clearInterval(tick);
      tick = null;
    }

    onVisible(list, start, stop);
    if (!hasIO) start();
  }

  /* ── 4. SCROLL REVEAL ────────────────────────────────────────────────── */
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
        var stagger = parseInt(el.getAttribute('data-fc-delay') || '0', 10);
        if (stagger > 0) window.setTimeout(function () { el.classList.add('is--in'); }, stagger);
        else el.classList.add('is--in');
        io.unobserve(el);
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
    try { capabilityPath(); } catch (e) {}
    try { proveSequence(); } catch (e) {}
    try { reveals(); } catch (e) {}
    try { failsafe(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
