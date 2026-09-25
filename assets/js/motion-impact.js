/* ============================================================================
   Bằng chứng / Evidence — Cinematic Dark Evidence Motion System
   b2b.go4ai.org — v2.0.0
   
   FIX DỨT ĐIỂM (theo Spec J1 - J7):
   - KHÔNG bao giờ animate opacity của .impact-content hay labels xuống < 1
   - Final state luôn là: scale 1, opacity 1, filter none
   - 4 circles scale .72 -> 1, opacity 0 -> 1 khi vào viewport
   - Scroll backward hoặc refresh giữa trang: Text & số luôn đọc rõ 100%
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

  var items   = list.querySelectorAll('.impact-item');
  var labels  = list.querySelectorAll('.impact-content, .impact-item__content');
  var accent  = list.querySelector('.impact-item-accent, .impact-accent');
  var accentText = accent && (accent.querySelector('.impact-item-accent-text') || accent.querySelector('p'));
  if (items.length !== 4) return;

  gsap.registerPlugin(ScrollTrigger);
  api.mode = 'gsap';

  var mm = gsap.matchMedia();

  /* Desktop Viewport with smooth scroll scrub */
  mm.add('(min-width: 992px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', function () {
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

    // Initial state: circles enter scale .72 -> 1, labels 100% opaque
    gsap.set(items, { scale: 0.72, opacity: 0, xPercent: 0, yPercent: 0 });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accent) gsap.set(accent, { scale: 0, opacity: 0 });
    if (accentText) gsap.set(accentText, { opacity: 1 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          list.classList.toggle('is--scrubbing', self.progress > 0.05);
        },
      },
    });

    // 1. Circles scale in .72 -> 1, opacity 0 -> 1 (kf 0 -> 0.35)
    tl.to(items, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      stagger: 0.05,
      ease: 'power2.out',
    }, 0);

    // 2. Labels ALWAYS stay at opacity: 1 (explicitly guaranteed)
    tl.to(labels, {
      opacity: 1,
      duration: 0.01,
      ease: 'none',
    }, 0.35);

    // 3. Center accent badge reveals at center intersection (kf 0.35 -> 0.60)
    // Sits in the center gap without covering text
    if (accent) {
      tl.to(accent, {
        scale: 1,
        opacity: 1,
        duration: 0.25,
        ease: 'back.out(1.4)',
      }, 0.35);
    }

    // 4. Hold showcase state: All 4 circles stay at scale 1, opacity 1, 100% legible
    tl.to(items, {
      duration: 0.40,
      scale: 1,
      opacity: 1,
    }, 0.60);

    // Ensure final state is 100% visible
    tl.set(items, { scale: 1, opacity: 1 });
    tl.set(labels, { opacity: 1, filter: 'none' });
    if (accent) tl.set(accent, { scale: 1, opacity: 1 });

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
    };
  });

  /* Mobile / Tablet / Reduced Motion: Instant 100% visibility */
  mm.add('(max-width: 991px), (prefers-reduced-motion: reduce)', function () {
    root.classList.remove('motion-impact');
    gsap.set(items, { scale: 1, opacity: 1, xPercent: 0, yPercent: 0 });
    gsap.set(labels, { opacity: 1, filter: 'none' });
    if (accent) gsap.set(accent, { scale: 1, opacity: 1 });
  });

})();
