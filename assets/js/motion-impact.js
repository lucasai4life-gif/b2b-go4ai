/* ============================================================================
   Bằng chứng / Evidence — Scroll-driven Assemble Motion System
   b2b.go4ai.org — v2.2.0
   Cloned directly from source: lucasgo4ai.life (Webflow interaction a-17 / e-58)
   
   Behavior:
   1. Initial state: 4 circles rest in 2x2 grid (x: 0, y: 0), 100% visible & legible.
   2. Pinned sticky sequence:
      - 0.00 -> 0.20: Hold initial 2x2 grid position.
      - 0.20 -> 0.65: Circles converge into exact center intersection:
        · .is--01: (0%, 0%) -> (+50%, +50%)
        · .is--02: (0%, 0%) -> (-50%, +50%)
        · .is--03: (0%, 0%) -> (+50%, -50%)
        · .is--04: (0%, 0%) -> (-50%, -50%)
      - 0.65 -> 0.80: Center accent circle scales from 0 to 1, accent text fades to 1.
      - 0.80 -> 1.00: Hold final converged composition.
   3. Reverse scroll: Reverses smoothly frame-for-frame.
   4. Text & numbers: Always sharp, opaque, no blur, high contrast.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  var api = { mode: 'pending', timeline: null, trigger: null, build: null };
  window.__go4aiImpact = api;

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    root.classList.remove('motion-impact');
    api.mode = 'no-gsap';
    return;
  }

  var track = document.querySelector('[data-impact-track]') || document.querySelector('.impact-animation-track');
  var list  = document.querySelector('[data-impact-list]') || document.querySelector('.impact-list');
  if (!track || !list) return;

  var item1 = list.querySelector('.impact-item.is--01');
  var item2 = list.querySelector('.impact-item.is--02');
  var item3 = list.querySelector('.impact-item.is--03');
  var item4 = list.querySelector('.impact-item.is--04');
  var items = [item1, item2, item3, item4].filter(Boolean);
  var labels = list.querySelectorAll('.impact-content, .impact-item__content');
  var accent = list.querySelector('.impact-item-accent, .impact-accent');
  var accentText = accent && (accent.querySelector('.impact-item-accent-text') || accent.querySelector('p'));
  if (items.length !== 4) return;

  gsap.registerPlugin(ScrollTrigger);
  api.mode = 'gsap';

  // Exact Webflow convergence vectors from source a-17:
  // Item 01 (top-left) moves down-right (+50%, +50%)
  // Item 02 (top-right) moves down-left (-50%, +50%)
  // Item 03 (bottom-left) moves up-right (+50%, -50%)
  // Item 04 (bottom-right) moves up-left (-50%, -50%)
  var CONVERGE = [
    { x:  50, y:  50 },
    { x: -50, y:  50 },
    { x:  50, y: -50 },
    { x: -50, y: -50 }
  ];

  var mm = gsap.matchMedia();

  /* Desktop Viewport (>= 992px) */
  mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', function () {
    root.classList.add('motion-impact');

    var pinEl = document.querySelector('.impact-section');
    var headerEl = document.querySelector('.site-header');

    function syncHeaderH() {
      if (pinEl && headerEl) {
        pinEl.style.setProperty('--header-h', Math.round(headerEl.getBoundingClientRect().height) + 'px');
      }
    }
    syncHeaderH();
    ScrollTrigger.addEventListener('refreshInit', syncHeaderH);

    // Initial state:
    // Circles are in their natural 2x2 grid positions (x: 0, y: 0), scale: 1, opacity: 1
    items.forEach(function (item) {
      gsap.set(item, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        opacity: 1,
        pointerEvents: ''
      });
    });
    // Labels 100% visible, crisp and readable at all times
    gsap.set(labels, { opacity: 1, filter: 'none' });
    // Center accent starts at scale 0
    if (accent) gsap.set(accent, { scale: 0, opacity: 1, transformOrigin: '50% 50%' });
    if (accentText) gsap.set(accentText, { opacity: 0 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8, // Matches Webflow smoothing: 80
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          list.classList.toggle('is--scrubbing', self.progress > 0.05);
          var moving = self.progress > 0.15 && self.progress < 0.75;
          items.forEach(function (item) {
            item.style.pointerEvents = moving ? 'none' : '';
          });
        },
      },
    });

    // Timeline duration 1.0 (normalized scroll progress):
    // Phase 1: Hold initial 2x2 state (0.00 -> 0.18)
    tl.to(items, {
      xPercent: 0,
      yPercent: 0,
      duration: 0.18,
      ease: 'none'
    }, 0);

    // Phase 2: Converge towards center (0.18 -> 0.64) - Webflow kf 30 -> 60
    items.forEach(function (item, i) {
      tl.to(item, {
        xPercent: CONVERGE[i].x,
        yPercent: CONVERGE[i].y,
        duration: 0.46,
        ease: 'power1.inOut'
      }, 0.18);
    });

    // Content stays 100% visible & sharp
    tl.to(labels, { opacity: 1, duration: 0.01 }, 0);

    // Phase 3: Center accent scales up (0.64 -> 0.80) - Webflow kf 70 -> 80
    if (accent) {
      tl.to(accent, {
        scale: 1,
        duration: 0.16,
        ease: 'power2.out'
      }, 0.64);
    }
    if (accentText) {
      tl.to(accentText, {
        opacity: 1,
        duration: 0.12,
        ease: 'power1.out'
      }, 0.68);
    }

    // Phase 4: Hold final composition (0.80 -> 1.00)
    tl.to(items, {
      xPercent: function (i) { return CONVERGE[i].x; },
      yPercent: function (i) { return CONVERGE[i].y; },
      duration: 0.20,
      ease: 'none'
    }, 0.80);

    api.timeline = tl;
    api.trigger = tl.scrollTrigger;
    api.build = 'built';

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    return function () {
      api.timeline = null;
      api.trigger = null;
      api.build = 'reverted';
      list.classList.remove('is--scrubbing');
      ScrollTrigger.removeEventListener('refreshInit', syncHeaderH);
      items.forEach(function (item) {
        item.style.pointerEvents = '';
        gsap.set(item, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0 });
      });
      gsap.set(labels, { opacity: 1, filter: 'none' });
      if (accent) gsap.set(accent, { scale: 1, opacity: 1 });
      if (accentText) gsap.set(accentText, { opacity: 1 });
    };
  });

  /* Mobile / Tablet Viewport (< 992px) — Smooth Organic Float Motion
     Cùng ngôn ngữ chuyển động với bản desktop (dịch chuyển dọc, ease mềm, loop
     vô hạn) — chỉ giảm biên độ cho vừa viewport.

     Bản trước dùng biên độ cố định ±3.5px trên vòng tròn ~342px (≈1%) nên mắt
     gần như không thấy ⇒ bị đọc là "đứng yên". Nay biên độ bám theo kích thước
     vòng tròn thật (~9–10px) và MỌI vòng luôn dịch cùng một chiều, nên độ nén
     lớn nhất giữa hai vòng kề nhau = AMP < khoảng cách 16px ⇒ không bao giờ
     chồng lấn. Chỉ dùng trục y ⇒ không phát sinh overflow ngang.

     Motion chỉ chạy khi section Bằng chứng nằm trong viewport (onToggle). */
  mm.add('(max-width: 991px) and (prefers-reduced-motion: no-preference)', function () {
    root.classList.remove('motion-impact');

    var section = document.querySelector('.impact-section');
    var all5 = [item1, item2, item3, item4, accent].filter(Boolean);
    all5.forEach(function (el) {
      el.style.pointerEvents = '';
      gsap.set(el, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0, y: 0 });
    });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accentText) gsap.set(accentText, { opacity: 1 });

    // Biên độ theo kích thước vòng tròn thực tế (342–352px ở mọi viewport
    // mobile/tablet) ⇒ ~10px: đủ thấy, vẫn "nhẹ, mượt, enterprise".
    var circleW = (all5[0] && all5[0].getBoundingClientRect().width) || 320;
    var AMP = Math.max(8, Math.min(12, circleW * 0.03));
    var PERIOD = 5.6;

    var floatTweens = [];
    var revealed = false;

    function buildFloats() {
      if (floatTweens.length) return;
      all5.forEach(function (el, idx) {
        floatTweens.push(gsap.to(el, {
          y: '+=' + AMP,
          duration: PERIOD,
          delay: idx * 0.5, // lệch pha ~32°/vòng ⇒ sóng chạy nhẹ xuống dưới
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          paused: true
        }));
      });
    }

    function setFloats(playing) {
      for (var i = 0; i < floatTweens.length; i++) {
        if (playing) { floatTweens[i].play(); } else { floatTweens[i].pause(); }
      }
    }

    function revealOnce() {
      if (revealed) return;
      revealed = true;
      gsap.fromTo(all5,
        { opacity: 0.35, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out' }
      );
    }

    buildFloats();

    var st = ScrollTrigger.create({
      trigger: section || list,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) {
        if (self.isActive) revealOnce();
        setFloats(self.isActive);
      }
    });

    // Section đã nằm trong viewport ngay lúc khởi tạo (reload giữa trang).
    if (st.isActive) {
      revealOnce();
      setFloats(true);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    return function () {
      if (st) st.kill();
      for (var i = 0; i < floatTweens.length; i++) { floatTweens[i].kill(); }
      floatTweens = [];
      all5.forEach(function (el) {
        el.style.pointerEvents = '';
        gsap.set(el, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0, y: 0 });
      });
      gsap.set(labels, { opacity: 1, filter: 'none' });
      if (accentText) gsap.set(accentText, { opacity: 1 });
    };
  });

  /* Prefers-reduced-motion: Instant 100% visibility, completely static */
  mm.add('(prefers-reduced-motion: reduce)', function () {
    root.classList.remove('motion-impact');
    items.forEach(function (item) {
      item.style.pointerEvents = '';
      gsap.set(item, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0, y: 0 });
    });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accent) gsap.set(accent, { scale: 1, opacity: 1, y: 0 });
    if (accentText) gsap.set(accentText, { opacity: 1 });
  });

})();
