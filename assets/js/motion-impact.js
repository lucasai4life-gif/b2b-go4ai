/* ============================================================================
   Bằng chứng / Evidence — Scroll-driven Assemble Motion System
   b2b.go4ai.org — v2.3.0
   Cloned directly from source: lucasgo4ai.life (Webflow interaction a-17 / e-58)
   
   Behavior:
   A. DESKTOP (>= 992px) — unchanged pinned assemble sequence:
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
   B. TABLET (768–991px) — legacy vertical active sequence (auto-loop, unchanged).
   C. MOBILE (<= 767px) — scroll-driven evidence reveal, NO auto-loop:
      story order is question -> 3.000+ -> 14+ -> 10+ -> ~70% (CSS `order`, DOM
      untouched). Each circle reveals once when it crosses ~70% of the viewport
      height, then stays visible. Metrics 3.000+ / 14+ / 10+ count up exactly
      once (900–1400ms); ~70% only fades/glows. Runs on plain
      IntersectionObserver + CSS classes — deliberately independent of GSAP so
      the mobile experience survives a GSAP load failure. If anything is
      missing, no CSS hides anything and the section stays static & visible.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  var api = { mode: 'pending', timeline: null, trigger: null, build: null, reveal: 'pending' };
  window.__go4aiImpact = api;

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

  /* ==========================================================================
     MOBILE / TABLET (≤ 991px) — SCROLL-DRIVEN EVIDENCE REVEAL
     Không auto-loop. Mỗi vòng chỉ reveal khi nó thực sự đi vào vùng active
     của viewport (mốc ~70% chiều cao viewport), rồi giữ visible vĩnh viễn.

     991px là breakpoint mobile THẬT của section: từ ≤991px bố cục đã là một cột
     dọc 5 vòng tròn full-width ("Mobile Evidence Layout" trong <style> của
     trang), nên cả dải dùng chung trải nghiệm này.

     Nhánh này CỐ TÌNH không dùng GSAP: nó là trải nghiệm nền của mobile nên
     không được phụ thuộc vào việc gsap.min.js nạp được. Thuần
     IntersectionObserver + class CSS ⇒ nếu JS chết thì CSS cũng không ẩn gì
     (cổng `html.evidence-reveal` chỉ được gắn khi IO đã sẵn sàng).
     ========================================================================== */
  var REVEAL_Q = '(max-width: 991px) and (prefers-reduced-motion: no-preference)';
  var mqlReveal = (typeof window.matchMedia === 'function') ? window.matchMedia(REVEAL_Q) : null;
  var teardownReveal = null;

  /* "3.000+" -> { target: 3000, suffix: '+' } ; "14+" -> 14 ; "10+" -> 10.
     "~70%" KHÔNG khớp (không bắt đầu bằng chữ số) ⇒ trả null ⇒ không count-up,
     đúng như spec: chỉ fade/scale/glow cho phần trăm. */
  function parseMetric(raw) {
    var m = /^\s*(\d[\d.,]*)([^\d]*)\s*$/.exec(String(raw));
    if (!m) return null;
    var target = parseInt(m[1].replace(/[.,]/g, ''), 10);
    if (!isFinite(target) || target <= 0) return null;
    return { target: target, suffix: m[2] };
  }

  function mountReveal() {
    if (typeof window.IntersectionObserver !== 'function') {
      root.classList.remove('evidence-reveal');
      api.reveal = 'no-io';
      return null;
    }

    var seq = [accent, item1, item2, item3, item4].filter(Boolean);
    var metrics = [];

    /* Text gốc được nhớ lại một lần (data-evidence-text) để hoàn nguyên khi
       rời mobile — không bao giờ sửa nội dung/số liệu trong HTML. */
    items.forEach(function (item) {
      var num = item.querySelector('.text--number');
      if (!num) return;
      if (typeof num.dataset.evidenceText === 'undefined') {
        num.dataset.evidenceText = num.textContent;
      }
      var parsed = parseMetric(num.dataset.evidenceText);
      if (parsed) {
        metrics.push({ el: num, target: parsed.target, suffix: parsed.suffix, raf: 0, done: false });
      }
    });

    function metricFor(el) {
      var num = el.querySelector('.text--number');
      for (var i = 0; i < metrics.length; i++) {
        if (metrics[i].el === num) return metrics[i];
      }
      return null;
    }

    function fmt(v, target) {
      return (target >= 1000 ? v.toLocaleString('vi-VN') : String(v));
    }

    /* Count-up đúng 1 lần, 900–1400ms, giữ format gốc (3.000+). */
    function runCountUp(rec, host) {
      if (rec.done) return;
      rec.done = true;
      var el = rec.el;
      var target = rec.target;
      var dur = target >= 1000 ? 1200 : 950;
      var t0 = 0;

      function frame(now) {
        if (!t0) t0 = now;
        var t = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(target * eased), target) + rec.suffix;
        if (t < 1) {
          rec.raf = window.requestAnimationFrame(frame);
          return;
        }
        rec.raf = 0;
        el.textContent = fmt(target, target) + rec.suffix;
        /* Emphasis/glow nhẹ đúng 1 lần, sau khi số đã đứng yên. */
        if (host) {
          host.classList.add('is--emphasis');
          window.setTimeout(function () { host.classList.remove('is--emphasis'); }, 760);
        }
      }
      rec.raf = window.requestAnimationFrame(frame);
    }

    function reveal(el) {
      if (el.classList.contains('is--revealed')) return;
      el.classList.add('is--revealed');
      list.classList.add('has--revealed');
      var rec = metricFor(el);
      if (rec) runCountUp(rec, el);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target);
      });
    }, {
      root: null,
      /* Đáy root bị cắt 30% ⇒ mốc kích hoạt nằm ở ~70% chiều cao viewport. */
      rootMargin: '0px 0px -30% 0px',
      threshold: 0
    });

    /* Cổng runtime: chỉ ẩn vòng tròn SAU khi đã chắc chắn IO sẽ reveal được. */
    root.classList.remove('motion-impact'); // ≤991px không bao giờ ở chế độ pin
    root.classList.add('evidence-reveal');
    api.reveal = 'built';

    /* Vòng nào đã ở trên mốc kích hoạt ngay lúc mount (reload giữa trang,
       deep-link #bang-chung) thì reveal luôn, không chờ cuộn. */
    var triggerY = window.innerHeight * 0.7;
    seq.forEach(function (el) {
      if (el.getBoundingClientRect().top <= triggerY) reveal(el);
      else io.observe(el);
    });

    return function teardownReveal() {
      io.disconnect();
      metrics.forEach(function (rec) {
        if (rec.raf) { window.cancelAnimationFrame(rec.raf); rec.raf = 0; }
        if (typeof rec.el.dataset.evidenceText !== 'undefined') {
          rec.el.textContent = rec.el.dataset.evidenceText;
        }
        rec.done = false;
      });
      seq.forEach(function (el) { el.classList.remove('is--revealed', 'is--emphasis'); });
      list.classList.remove('has--revealed');
      root.classList.remove('evidence-reveal');
      api.reveal = 'reverted';
    };
  }

  function syncReveal() {
    if (mqlReveal.matches) {
      if (!teardownReveal) teardownReveal = mountReveal();
    } else if (teardownReveal) {
      teardownReveal();
      teardownReveal = null;
    }
  }

  if (!mqlReveal) {
    api.reveal = 'no-matchmedia';
  } else {
    syncReveal();
    if (typeof mqlReveal.addEventListener === 'function') mqlReveal.addEventListener('change', syncReveal);
    else if (typeof mqlReveal.addListener === 'function') mqlReveal.addListener(syncReveal);
  }

  /* ==========================================================================
     DESKTOP (≥ 992px) + TABLET (768–991px) — GSAP + ScrollTrigger
     ========================================================================== */
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    root.classList.remove('motion-impact');
    api.mode = 'no-gsap';
    return;
  }

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

  /* Tablet Viewport (768–991px) — VERTICAL ACTIVE SEQUENCE
     Ở dải này bố cục vẫn là lưới 2×2 + đĩa accent ở giữa, nên giữ nguyên
     trải nghiệm cũ: 5 vòng lần lượt "active" rồi loop:
       1 → 2 → 3 → 4 → 5 → (nghỉ ngắn) → 1 …
     Mỗi thời điểm CHỈ 1 vòng active. Toàn bộ phần "da" của trạng thái active
     (border emerald sáng, glow, scale 1.03, số nổi hơn, transition 260ms) nằm
     trong CSS của `assets/css/go4ai.css` — JS chỉ bật/tắt class `.is--active`,
     nên không có inline style nào tranh chấp với các theme `!important` của
     trang.

     Dải ≤767px KHÔNG vào nhánh này nữa — mobile dùng scroll-driven reveal ở
     khối phía trên. Hai dải loại trừ nhau nên không chồng lấn.

     Vì sao KHÔNG dùng GSAP cho transform ở nhánh này: theme gốc của từng vòng
     (`border` / `box-shadow` / `background` trong <style> của trang) đều
     `!important`, mà inline style do GSAP ghi thì KHÔNG thắng được `!important`
     của stylesheet. Class + CSS là cách duy nhất ghi đè an toàn.

     Motion chỉ chạy khi section Bằng chứng nằm trong viewport (onToggle).
     Desktop/laptop KHÔNG bị ảnh hưởng: nhánh này chỉ áp dụng ≤991px. */
  mm.add('(min-width: 768px) and (max-width: 991px) and (prefers-reduced-motion: no-preference)', function () {
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
