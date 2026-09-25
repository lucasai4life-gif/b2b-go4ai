/* ============================================================================
   Bằng chứng / Evidence — Scroll-driven Assemble Motion System
   b2b.go4ai.org — v2.1.0
   
   Task 3 Spec:
   - Các circle KHÔNG đứng sẵn 2x2 từ đầu
   - Các circle di chuyển theo scroll
   - Từng circle vào vị trí (scale/position thay đổi mượt)
   - Cuối sequence assemble thành composition hoàn chỉnh (lưới 2x2)
   - Center accent xuất hiện đúng timing ở giao điểm trung tâm
   - Scroll ngược thì animation reverse đúng
   - Giữ nguyên 4 màu tương phản hiện tại (Circle 01: nền tối; Circle 02: emerald;
     Circle 03: mint sáng + chữ tối; Circle 04: nền tối + viền/glow ~70% emerald)
   - Text & số luôn luôn sắc nét và đọc rõ 100% (opacity: 1)
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

  var items   = Array.from(list.querySelectorAll('.impact-item'));
  var labels  = list.querySelectorAll('.impact-content, .impact-item__content');
  var accent  = list.querySelector('.impact-item-accent, .impact-accent');
  var accentText = accent && (accent.querySelector('.impact-item-accent-text') || accent.querySelector('p'));
  if (items.length !== 4) return;

  gsap.registerPlugin(ScrollTrigger);
  api.mode = 'gsap';

  // Vector offset for each circle when entering (top-left, top-right, bottom-left, bottom-right)
  // They start displaced outward and glide into (0, 0)
  var DIRS = [
    [-38, -38], // 01 top-left
    [ 38, -38], // 02 top-right
    [-38,  38], // 03 bottom-left
    [ 38,  38]  // 04 bottom-right
  ];

  var mm = gsap.matchMedia();

  /* Desktop Viewport with smooth scroll scrub */
  mm.add('(min-width: 992px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', function () {
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

    // Initial state: circles enter offset, scale 0.82, opacity 0.25, labels 100% visible
    items.forEach(function (item, i) {
      gsap.set(item, {
        xPercent: DIRS[i][0],
        yPercent: DIRS[i][1],
        scale: 0.82,
        opacity: 0.25
      });
    });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accent) gsap.set(accent, { scale: 0, opacity: 0 });
    if (accentText) gsap.set(accentText, { opacity: 0 });

    var tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          list.classList.toggle('is--scrubbing', self.progress > 0.05);
        },
      },
    });

    // 1. Circles glide into their exact 2x2 positions (kf 0 -> 0.60) with smooth stagger
    items.forEach(function (item, i) {
      var startT = i * 0.08;
      tl.to(item, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        opacity: 1,
        duration: 0.44,
        ease: 'power2.out'
      }, startT);
    });

    // Labels guaranteed 100% sharp throughout
    tl.to(labels, { opacity: 1, duration: 0.01 }, 0);

    // 2. Center accent pops in at center intersection as composition assembles (kf 0.55 -> 0.78)
    if (accent) {
      tl.to(accent, {
        scale: 1,
        opacity: 1,
        duration: 0.22,
        ease: 'back.out(1.5)'
      }, 0.55);
    }
    if (accentText) {
      tl.to(accentText, {
        opacity: 1,
        duration: 0.15,
        ease: 'power1.out'
      }, 0.65);
    }

    // 3. Showcase hold: All 4 circles and center accent held in perfect assembled composition (kf 0.78 -> 1.0)
    tl.to(items, {
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      opacity: 1,
      duration: 0.22,
      ease: 'none'
    }, 0.78);

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
      // Guarantee fallback state is 100% visible
      gsap.set(items, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0 });
      gsap.set(labels, { opacity: 1, filter: 'none' });
      if (accent) gsap.set(accent, { scale: 1, opacity: 1 });
      if (accentText) gsap.set(accentText, { opacity: 1 });
    };
  });

  /* Mobile / Tablet / Reduced Motion: Instant 100% visibility */
  mm.add('(max-width: 991px), (prefers-reduced-motion: reduce)', function () {
    root.classList.remove('motion-impact');
    gsap.set(items, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0 });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accent) gsap.set(accent, { scale: 1, opacity: 1 });
    if (accentText) gsap.set(accentText, { opacity: 1 });
  });

})();
