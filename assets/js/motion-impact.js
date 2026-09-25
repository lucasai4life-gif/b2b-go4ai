/* ============================================================================
   Bằng chứng — chuyển động port từ section "Tác động" của b2b.go4ai.org
   ============================================================================

   SPEC GỐC (không đoán — trích từ bundle runtime của theme LucasGo4ai):

     File : 30-websites/themes/LucasGo4ai-theme/tai-nguyen/
            cdn.prod.website-files.com/692db0eaf3c473ac91a06392/js/
            webflow.schunk.f47de7179923cc70.js

     Action list  : "a-17"  title "Impact Circles"
     Event        : "e-42" / "e-58"  SCROLLING_IN_VIEW + GENERAL_CONTINUOUS_ACTION
     Continuous   : group "a-17-p", type SCROLL_PROGRESS, smoothing 80
                    startsEntering true · addStartOffset true · offset 30
                    startsExiting false · addEndOffset   true · offset 30
     Action items : duration 500 (vô nghĩa khi đã scrub)

     keyframe 30  .impact-item.is--01..04  TRANSFORM_MOVE  → (0, 0)
     keyframe 40  .impact-content          STYLE_OPACITY  → 1
     keyframe 60  .impact-item.is--01      TRANSFORM_MOVE  → ( 50,  50)
                  .impact-item.is--02      TRANSFORM_MOVE  → (-50,  50)
                  .impact-item.is--03      TRANSFORM_MOVE  → ( 50, -50)
                  .impact-item.is--04      TRANSFORM_MOVE  → (-50, -50)
                  .impact-content          STYLE_OPACITY  → 0
     keyframe 70  .impact-item-accent      TRANSFORM_SCALE → 0
     keyframe 80  .impact-item-accent      TRANSFORM_SCALE → 1

   Đọc hình học: b2b xếp bốn vòng tròn thành lưới 2x2 (mỗi vòng rộng 50%), nên
   "±50%" chính là dịch đúng MỘT ô. Vòng accent của b2b nằm position:absolute ở
   giữa và bị ẩn lúc nghỉ (CSS `transform: scale(0)`), nên kết cục của section là:
   bốn vòng tròn trôi vào giữa, nhãn mờ đi, rồi chiếc đĩa accent lớn lên ở đúng
   chỗ chúng vừa để lại.

   DỊCH SANG ban-ket.html:

   ban-ket dùng lưới 2x2 trong giai đoạn ghim (xem khối <style> ở <head> của
   ban-ket.html để biết vì sao KHÔNG dùng lưới 3x3 của bản tĩnh — tóm tắt: lưới
   3x3 cần listW = 3 x đường kính vòng tròn nên không vừa 100svh, ép vào thì chữ
   bị cắt). Lưới 2x2 là hình học THẬT của b2b, nên phép dịch dùng lại đúng con số
   của b2b: ±50% — khoảng cách từ tâm một ô góc tới tâm khung = nửa bề rộng chính
   nó. Không phải suy diễn, không phải quy đổi đơn vị.

   smoothing 80  →  scrub: 0.8
   kf 0..100     → timeline time 0..1 (pad bằng một tween rỗng ở vị trí 1)

   ⛔ ĐỔI SO VỚI b2b, có chủ ý — ghi rõ để không ai tưởng là port thiếu:
      b2b dùng --green-500 (#08906c) cho đĩa accent và cho .impact-bg khi hover.
      Trắng trên #08906c chỉ đạt 4,03:1, dưới ngưỡng AA 4,5:1 (đã đo ở phiên
      trước, xem README §6.1 mục 5). Ở đây dùng --green-700 (#06694f) cho cả hai
      chỗ mang chữ ⇒ 6,69:1.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;

  var api = { mode: 'pending', timeline: null, trigger: null, build: null };
  window.__go4aiImpact = api;

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    root.classList.remove('motion-impact');                   // không có GSAP ⇒ trả về tĩnh
    api.mode = 'no-gsap';
    return;
  }

  var track  = document.querySelector('[data-impact-track]') || document.querySelector('.impact-animation-track');
  var list   = document.querySelector('[data-impact-list]') || document.querySelector('.impact-list');
  if (!track || !list) return;

  var items   = list.querySelectorAll('.impact-item');
  var labels  = list.querySelectorAll('.impact-content, .impact-item__content');
  var accent  = list.querySelector('.impact-item-accent, .impact-accent');
  var accentText = accent && (accent.querySelector('.impact-item-accent-text') || accent.querySelector('p'));
  if (items.length !== 4 || !accent || !accentText) return;

  gsap.registerPlugin(ScrollTrigger);
  api.mode = 'gsap';

  /* Hướng dịch của từng vòng: ô 1/1 → (+1,+1), 1/2 → (-1,+1), 2/1 → (+1,-1),
     2/2 → (-1,-1). Đúng thứ tự khai báo trong markup.
     50% = nửa bề rộng chính nó = khoảng cách từ tâm ô góc tới tâm khung trong lưới 2x2. */
  var DIRS = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  var SHIFT = 50;

  var mm = gsap.matchMedia();

  /* Cùng điều kiện với gate ở <head> và với @media của khối CSS. */
  mm.add('(min-width: 992px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', function () {
    root.classList.add('motion-impact');

    var pinEl = document.querySelector('.impact-section') || document.querySelector('.impact-pin');
    var headerEl = document.querySelector('.site-header');
    function syncHeaderH() {
      if (pinEl && headerEl) {
        pinEl.style.setProperty('--header-h',
          Math.round(headerEl.getBoundingClientRect().height) + 'px');
      }
    }
    syncHeaderH();
    ScrollTrigger.addEventListener('refreshInit', syncHeaderH);

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',        // track 250vh − section 100svh = 150vh ghim
        scrub: 0.8,                  // IX2 smoothing 80
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          list.classList.toggle('is--scrubbing', self.progress > 0.28);
        },
      },
    });

    // kf30 → kf60: bốn vòng tròn trôi vào ô giữa
    items.forEach(function (item, i) {
      tl.fromTo(item,
        { xPercent: 0, yPercent: 0 },
        { xPercent: DIRS[i][0] * SHIFT, yPercent: DIRS[i][1] * SHIFT, duration: 0.30 }, 0.30);
    });

    // kf40 → kf60: nhãn mờ đi trong lúc chúng tụ lại
    tl.fromTo(labels, { opacity: 1 }, { opacity: 0, duration: 0.20 }, 0.40);

    // kf70 → kf80: đĩa accent lớn lên đúng chỗ chúng vừa để lại
    tl.fromTo(accent, { scale: 0 }, { scale: 1, duration: 0.12 }, 0.68);

    // Chữ trong đĩa hiện ra khi đĩa đã đủ lớn
    tl.fromTo(accentText, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.80);

    /* Pad timeline tới đúng 1 để kf 30/40/60/70/80 ánh xạ 1:1 sang tiến độ cuộn. */
    tl.to({}, { duration: 0.12 }, 0.88);

    api.timeline = tl;
    api.trigger = tl.scrollTrigger;
    api.build = 'built';

    // Font nạp sau làm đổi chiều cao ⇒ đo lại điểm bắt đầu/kết thúc.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    return function () {
      api.timeline = null;
      api.trigger = null;
      api.build = 'reverted';
      list.classList.remove('is--scrubbing');
      ScrollTrigger.removeEventListener('refreshInit', syncHeaderH);
    };
  });
})();
