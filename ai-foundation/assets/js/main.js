/* ==========================================================================
   GO4AI — AI FOUNDATION 18.11.2026 (LANDING PAGE 02)
   Motion + Enrollment form.

   FAILSAFE FIRST: every piece of content is visible in HTML/CSS by default.
   This file only ADDS motion. If JS fails, is blocked, or IntersectionObserver
   is missing, the page still reads end-to-end. Reduced-motion is respected.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------ 1 · reveal */
  if (canObserve && !reduceMotion) {
    doc.classList.add('has-motion');

    var reveals = document.querySelectorAll('.reveal, .reveal-line, .portrait-fade');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');

        /* Light up the two system visuals when they enter the viewport. */
        if (entry.target.id === 'jp-plate') { entry.target.classList.add('is-lit'); }
        if (entry.target.id === 'wow-system') { entry.target.classList.add('is-lit'); }

        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach(function (el) { observer.observe(el); });

    /* Stagger the six evidence nodes — no animation library dependency. */
    document.querySelectorAll('.ev-step').forEach(function (node, i) {
      node.style.transitionDelay = (i * 80) + 'ms';
    });

    /* Infinite signal flows run ONLY while their system is on screen.
       .is-lit is a one-shot reveal (also applied by the 4s failsafe, even if
       the user never scrolled there); .is-onscreen is toggled both ways so
       off-screen sections never burn animation frames. */
    var visibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-onscreen'); }
        else { entry.target.classList.remove('is-onscreen'); }
      });
    }, { threshold: 0 });

    document.querySelectorAll('#jp-plate, #wow-system, .ev-flow').forEach(function (el) {
      visibilityObserver.observe(el);
    });

    /* Hard failsafe: never leave content invisible, whatever happens. */
    window.setTimeout(function () {
      document.querySelectorAll('.reveal, .reveal-line, .portrait-fade').forEach(function (el) {
        el.classList.add('is-visible');
      });
      var plate = document.getElementById('jp-plate');
      var system = document.getElementById('wow-system');
      if (plate) { plate.classList.add('is-lit'); }
      if (system) { system.classList.add('is-lit'); }
    }, 4000);
  }

  /* --------------------------------------------- 2 · 5-session activation */
  var sj = document.getElementById('sj');
  if (sj && !reduceMotion) {
    var items = Array.prototype.slice.call(sj.querySelectorAll('.sj-item'));
    var ticking = false;

    var updateJourney = function () {
      var rect = sj.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var start = vh * 0.86;
      var distance = rect.height + start - vh * 0.28;
      var travelled = start - rect.top;
      var pct = distance > 0 ? travelled / distance : 1;
      pct = Math.max(0, Math.min(1, pct));

      sj.style.setProperty('--sj-progress', (pct * 100).toFixed(2) + '%');

      /* Five stations sit at 0 / .25 / .50 / .75 / 1.00 of the rail.
         Light one after another as the signal passes it. */
      items.forEach(function (item, i) {
        var threshold = items.length > 1 ? (i / (items.length - 1)) : 0;
        if (pct >= threshold - 0.02) { item.classList.add('is-active'); }
        else { item.classList.remove('is-active'); }
      });

      ticking = false;
    };

    var onScroll = function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(updateJourney);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateJourney();

    /* If the scroll machinery ever breaks, keep every session legible. */
    window.setTimeout(function () {
      if (!sj.style.getPropertyValue('--sj-progress')) {
        sj.style.setProperty('--sj-progress', '100%');
        items.forEach(function (item) { item.classList.add('is-active'); });
      }
    }, 4000);
  }

  /* ------------------------------------------------------- 3 · enrollment */
  /*
    INTEGRATION HOOK — no network call is made out of the box.
    Set data-endpoint on #rsvp-form to the lead-capture endpoint, e.g.
      <form ... data-endpoint="/api/leads">
    Payload (JSON): ho_ten, dien_thoai, nghe_nghiep, muc_tieu, muc_do,
                    dong_y, su_kien ("AI_FOUNDATION_18_11_2026").
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
        showStatus('Vui lòng điền Họ tên, Số điện thoại/Zalo và xác nhận đồng ý trước khi gửi đăng ký.', true);
        if (!name) { form.elements.ho_ten.focus(); }
        else if (!phone) { form.elements.dien_thoai.focus(); }
        else { form.elements.dong_y.focus(); }
        return;
      }

      var endpoint = form.getAttribute('data-endpoint') || '';
      var payload = {
        ho_ten: name,
        dien_thoai: phone,
        nghe_nghiep: form.elements.nghe_nghiep.value.trim(),
        muc_tieu: form.elements.muc_tieu.value.trim(),
        muc_do: form.elements.muc_do.value.trim(),
        dong_y: consent,
        su_kien: 'AI_FOUNDATION_18_11_2026'
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
        showStatus('Cảm ơn ' + name + '. Ban tổ chức sẽ liên hệ xác nhận đăng ký khóa học AI Foundation 18/11/2026.');
        form.reset();
      }).catch(function () {
        showStatus('Không thể gửi đăng ký lúc này. Vui lòng thử lại hoặc liên hệ Ban tổ chức.', true);
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();
