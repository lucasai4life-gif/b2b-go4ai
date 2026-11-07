/* ==========================================================================
   GO4AI — SME EXECUTIVE 14.11.2026
   Motion + RSVP. Failsafe first: all content is visible in HTML/CSS by default,
   this file only ADDS hiding. If anything here fails, the page still reads.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  /* ---------------------------------------------------------------- motion */
  if (canObserve && !reduceMotion) {
    doc.classList.add('has-motion');

    var reveals = document.querySelectorAll('.reveal, .reveal-line, .portrait-fade');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach(function (el) { observer.observe(el); });

    /* Stagger the four AI-flow nodes without inventing a library dependency. */
    document.querySelectorAll('.flow-node').forEach(function (node, i) {
      node.style.setProperty('--d', i);
    });

    /* Hard failsafe: never leave content invisible, whatever happens. */
    window.setTimeout(function () {
      document.querySelectorAll('.reveal, .reveal-line, .portrait-fade').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 4000);
  }

  /* ------------------------------------------------------ timeline progress */
  var timeline = document.getElementById('timeline');
  var fill = document.getElementById('timeline-fill');
  if (timeline && fill) {
    var updateTimeline = function () {
      var rect = timeline.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var start = vh * 0.82;
      var distance = rect.height + start - vh * 0.25;
      var travelled = start - rect.top;
      var pct = distance > 0 ? travelled / distance : 1;
      pct = Math.max(0, Math.min(1, pct));
      fill.style.height = (pct * 100).toFixed(2) + '%';
    };
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateTimeline(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateTimeline();
  }

  /* ------------------------------------------------------------------ RSVP */
  /*
    INTEGRATION HOOK — no network call is made out of the box.
    Set data-endpoint on #rsvp-form to the lead-capture endpoint, e.g.
      <form ... data-endpoint="/api/leads">
    The payload is JSON: ho_ten, dien_thoai, chuc_danh, doanh_nghiep,
    van_de_quan_tam, dong_y, su_kien ("SME_EXECUTIVE_14_11_2026").
    Nothing is sent until the endpoint is explicitly configured — this avoids
    posting test data into the production D1 / Telegram channel.
  */
  var form = document.getElementById('rsvp-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    var showStatus = function (message, isError) {
      status.textContent = message;
      status.className = 'form-status is-visible' + (isError ? ' is-error' : '');
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = form.elements.ho_ten.value.trim();
      var phone = form.elements.dien_thoai.value.trim();
      var consent = form.elements.dong_y.checked;

      if (!name || !phone || !consent) {
        showStatus('Vui lòng điền Họ tên, Điện thoại/Zalo và xác nhận đồng ý trước khi gửi đăng ký.', true);
        if (!name) { form.elements.ho_ten.focus(); }
        else if (!phone) { form.elements.dien_thoai.focus(); }
        return;
      }

      var endpoint = form.getAttribute('data-endpoint') || '';
      var payload = {
        ho_ten: name,
        dien_thoai: phone,
        chuc_danh: form.elements.chuc_danh.value.trim(),
        doanh_nghiep: form.elements.doanh_nghiep.value.trim(),
        van_de_quan_tam: form.elements.van_de_quan_tam.value,
        dong_y: consent,
        su_kien: 'SME_EXECUTIVE_14_11_2026'
      };

      if (!endpoint) {
        showStatus('Chế độ xem trước giao diện — biểu mẫu chưa kết nối hệ thống tiếp nhận đăng ký. Thông tin chưa được gửi.');
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      showStatus('Đang gửi đăng ký…');
      window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        showStatus('Cảm ơn ' + name + '. Ban tổ chức sẽ liên hệ xác nhận tham dự sự kiện 14/11/2026.');
        form.reset();
      }).catch(function () {
        showStatus('Không thể gửi đăng ký lúc này. Vui lòng thử lại hoặc liên hệ Ban tổ chức.', true);
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();


/* ==========================================================================
   UPGRADE v2 — THE EXECUTIVE ROOM motion
   Refined, finite motion only. Everything here is additive: no element is
   hidden by this file, and reduced-motion / no-JS keep the hero fully legible.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointerDesktop = window.matchMedia && window.matchMedia('(min-width: 981px)').matches;
  if (reduce || !finePointerDesktop || !document.documentElement.classList.contains('has-motion')) {
    return;
  }

  var stage = document.querySelector('.er-stage');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.er-figure'));
  if (!stage || !figures.length) { return; }

  var ticking = false;
  var update = function () {
    var rect = stage.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    /* 0 when the stage is just entering, 1 when it has fully passed */
    var progress = (vh - rect.top) / (vh + rect.height);
    progress = Math.max(0, Math.min(1, progress));

    figures.forEach(function (figure) {
      var depth = parseFloat(figure.getAttribute('data-depth')) || 1;
      /* total travel stays inside the requested 8–14px band */
      var amplitude = 8 + depth * 1.5;
      var py = (0.5 - progress) * amplitude;
      figure.style.setProperty('--py', py.toFixed(2) + 'px');
    });
    ticking = false;
  };

  var onScroll = function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
