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

  /* Mobile / Tablet Viewport (< 992px) — VERTICAL ACTIVE SEQUENCE
     Bố cục xếp dọc giữ nguyên. 5 vòng tròn lần lượt "active" rồi loop:
       1 → 2 → 3 → 4 → 5 → (nghỉ ngắn) → 1 …
     Mỗi thời điểm CHỈ 1 vòng active. Toàn bộ phần "da" của trạng thái active
     (border emerald sáng, glow, scale 1.03, số nổi hơn, transition 260ms) nằm
     trong CSS của `assets/css/go4ai.css` — JS chỉ bật/tắt class `.is--active`,
     nên không có inline style nào tranh chấp với các theme `!important` của
     trang.

     Vì sao KHÔNG dùng GSAP cho transform ở nhánh này: theme gốc của từng vòng
     (`border` / `box-shadow` / `background` trong <style> của trang) đều
     `!important`, mà inline style do GSAP ghi thì KHÔNG thắng được `!important`
     của stylesheet. Class + CSS là cách duy nhất ghi đè an toàn.

     Motion chỉ chạy khi section Bằng chứng nằm trong viewport (onToggle).
     Desktop/laptop KHÔNG bị ảnh hưởng: nhánh này chỉ áp dụng ≤991px. */
  mm.add('(max-width: 991px) and (prefers-reduced-motion: no-preference)', function () {
    root.classList.remove('motion-impact');

    var section = document.querySelector('.impact-section');
    var seq = [item1, item2, item3, item4, accent].filter(Boolean);

    seq.forEach(function (el) {
      el.style.pointerEvents = '';
      /* Bỏ transform/opacity inline còn sót lại (do nhánh desktop ghi khi
         resize desktop → mobile) để CSS `.is--active` điều khiển được
         transform. Base CSS của go4ai.css đã lo scale(1) cho accent nên
         clearProps không làm vòng thứ 5 biến mất. */
      gsap.set(el, { clearProps: 'transform,opacity' });
    });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accentText) gsap.set(accentText, { opacity: 1 });

    /* Nhịp: mỗi vòng active 1500ms (spec 1200–1600ms), transition do CSS lo
       (260ms, spec 220–320ms). Vòng cuối giữ thêm 400ms rồi mới loop về vòng
       đầu (spec 300–500ms). */
    var STEP = 1500;
    var TAIL = 400;

    var idx = 0;
    var timer = null;

    function paint(active) {
      for (var k = 0; k < seq.length; k++) {
        seq[k].classList.toggle('is--active', k === active);
      }
    }

    function tick() {
      paint(idx);
      var hold = STEP + (idx === seq.length - 1 ? TAIL : 0);
      idx = (idx + 1) % seq.length;
      timer = setTimeout(tick, hold);
    }

    function startSeq() { if (!timer) tick(); }
    function stopSeq() { if (timer) { clearTimeout(timer); timer = null; } }

    var st = ScrollTrigger.create({
      trigger: section || list,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) {
        if (self.isActive) { startSeq(); } else { stopSeq(); }
      }
    });

    // Section đã nằm trong viewport ngay lúc khởi tạo (reload giữa trang).
    if (st.isActive) startSeq();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    return function () {
      stopSeq();
      if (st) st.kill();
      idx = 0;
      seq.forEach(function (el) {
        el.classList.remove('is--active');
        el.style.pointerEvents = '';
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
