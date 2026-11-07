/* ==========================================================================
   GO4AI — AI BUILDER 21.11.2026 (LANDING PAGE 03)
   Motion system + Builder Application form.

   FAILSAFE FIRST: every piece of content is visible in HTML/CSS by default.
   This file only ADDS motion. If JS fails, is blocked, or IntersectionObserver
   is missing, the page still reads end-to-end. Reduced-motion gets the static
   final state (all rails drawn, all nodes active, all test states settled).
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  var SYSTEM_IDS = ['we-plate', 'dl', 'uc', 'qa', 'ms'];
  var RAIL_IDS = ['dl', 'bp'];

  /* ------------------------------------------------- static final state */
  function settleEverything() {
    document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
      el.classList.add('is-visible');
    });
    SYSTEM_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.add('is-lit'); }
    });
    document.querySelectorAll('.dl-layer, .bp-item').forEach(function (el) {
      el.classList.add('is-active');
    });
    document.querySelectorAll('.qa-state').forEach(function (el) {
      el.classList.add('is-on');
    });
    RAIL_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.style.setProperty('--' + id + '-progress', '100%'); }
    });
  }

  /* Reduced motion: no observer, no animation — just the finished diagram. */
  if (reduceMotion) {
    settleEverything();
  }

  /* ------------------------------------------- 1 · editorial reveal + IO */
  if (canObserve && !reduceMotion) {
    doc.classList.add('has-motion');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var target = entry.target;
        target.classList.add('is-visible');

        if (target.id === 'we-plate' ||
            target.id === 'dl' ||
            target.id === 'uc' ||
            target.id === 'qa' ||
            target.id === 'ms') {
          target.classList.add('is-lit');
        }

        /* Test states settle once, in a quiet sequence, when QA is visible. */
        if (target.id === 'qa') { activateTestStates(); }

        observer.unobserve(target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
      observer.observe(el);
    });
    SYSTEM_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { observer.observe(el); }
    });

    /* Autonomous (infinite) animations run ONLY while their system is on
       screen. is-lit is a one-shot reveal; is-onscreen is toggled both ways. */
    var visibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-onscreen'); }
        else { entry.target.classList.remove('is-onscreen'); }
      });
    }, { threshold: 0 });

    SYSTEM_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { visibilityObserver.observe(el); }
    });

    /* Hard failsafe: never leave content invisible, whatever happens. */
    window.setTimeout(function () {
      document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
        el.classList.add('is-visible');
      });
      SYSTEM_IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.classList.add('is-lit'); }
      });
      document.querySelectorAll('.qa-state').forEach(function (el) {
        el.classList.add('is-on');
      });
    }, 4000);
  }

  /* ------------------------------------------- 2 · QA test-state sequence */
  var testStatesRan = false;
  function activateTestStates() {
    if (testStatesRan || reduceMotion) { return; }
    testStatesRan = true;
    var states = document.querySelectorAll('.qa-state');
    states.forEach(function (state, i) {
      window.setTimeout(function () { state.classList.add('is-on'); }, 320 + i * 360);
    });
  }

  /* --------------------------------- 3 · scroll-driven rail + active node */
  /*
    Both #dl (deliverable layers) and #bp (5-session build pipeline) use the
    same engine: a rail fills from 0 → 100% as the section travels through the
    viewport, and each node lights up as the signal passes it (01 → 05).
  */
  function attachRail(id, itemSelector) {
    var rail = document.getElementById(id);
    if (!rail) { return null; }
    var items = Array.prototype.slice.call(rail.querySelectorAll(itemSelector));
    var ticking = false;

    var update = function () {
      var rect = rail.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var start = vh * 0.86;
      var distance = rect.height + start - vh * 0.28;
      var travelled = start - rect.top;
      var pct = distance > 0 ? travelled / distance : 1;
      pct = Math.max(0, Math.min(1, pct));

      rail.style.setProperty('--' + id + '-progress', (pct * 100).toFixed(2) + '%');

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
      window.requestAnimationFrame(update);
    };

    if (!reduceMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }

    return { rail: rail, items: items, update: update };
  }

  var rails = [];
  if (!reduceMotion) {
    rails.push(attachRail('dl', '.dl-layer'));
    rails.push(attachRail('bp', '.bp-item'));
  }

  /* If the scroll machinery ever breaks, keep every stage legible + drawn. */
  window.setTimeout(function () {
    rails.forEach(function (entry) {
      if (!entry) { return; }
      var prop = '--' + (entry.rail.id === 'dl' ? 'dl' : 'bp') + '-progress';
      if (!entry.rail.style.getPropertyValue(prop)) {
        entry.rail.style.setProperty(prop, '100%');
      }
      entry.items.forEach(function (item) { item.classList.add('is-active'); });
    });
  }, 4000);

  /* --------------------------------------------- 4 · builder application */
  /*
    INTEGRATION HOOK — no network call is made out of the box.
    Set data-endpoint on #rsvp-form to the lead-capture endpoint, e.g.
      <form ... data-endpoint="/api/leads">
    Payload (JSON): ho_ten, dien_thoai, doanh_nghiep, tac_vu, so_lan_lap,
                    thoi_gian_xu_ly, ai_dang_dung, dong_y,
                    su_kien ("AI_BUILDER_21_11_2026").
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
        showStatus('Vui lòng điền Họ tên, Số điện thoại/Zalo và xác nhận đồng ý trước khi gửi bài toán.', true);
        if (!name) { form.elements.ho_ten.focus(); }
        else if (!phone) { form.elements.dien_thoai.focus(); }
        else { form.elements.dong_y.focus(); }
        return;
      }

      var endpoint = form.getAttribute('data-endpoint') || '';
      var payload = {
        ho_ten: name,
        dien_thoai: phone,
        doanh_nghiep: form.elements.doanh_nghiep.value.trim(),
        tac_vu: form.elements.tac_vu.value.trim(),
        so_lan_lap: form.elements.so_lan_lap.value.trim(),
        thoi_gian_xu_ly: form.elements.thoi_gian_xu_ly.value.trim(),
        ai_dang_dung: form.elements.ai_dang_dung.value.trim(),
        dong_y: consent,
        su_kien: 'AI_BUILDER_21_11_2026'
      };

      if (!endpoint) {
        showStatus('Chế độ xem trước giao diện — biểu mẫu chưa kết nối hệ thống tiếp nhận đăng ký. Thông tin chưa được gửi.');
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      showStatus('Đang gửi bài toán…');
      window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        showStatus('Cảm ơn ' + name + '. Ban tổ chức sẽ liên hệ xác nhận đăng ký khóa học AI Builder 21/11/2026.');
        form.reset();
      }).catch(function () {
        showStatus('Không thể gửi bài toán lúc này. Vui lòng thử lại hoặc liên hệ Ban tổ chức.', true);
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();
