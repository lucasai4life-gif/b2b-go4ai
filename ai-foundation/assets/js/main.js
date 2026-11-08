/* ==========================================================================
   GO4AI — AI FOUNDATION 18.11.2026 · THE AI CAPABILITY STUDIO

   Motion: portfolio assembly · artifact fan-out · 03→14 counter ·
           session state change · gold progress ribbon · evidence folder ·
           clip text reveal · gold line draw · subtle parallax · magnetic CTA.

   FAILSAFE FIRST: every piece of content is visible in HTML/CSS by default.
   This file only ADDS motion. If JS fails, is blocked, or IntersectionObserver
   is missing, the page still reads end-to-end and shows the finished state.
   Nothing loops infinitely, and reduced motion is respected.
   Form validation / submit behaviour is unchanged.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canObserve = 'IntersectionObserver' in window;
  var canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var deck = $('#deck');
  var deckNum = $('#deck-num');
  var deckDen = $('#deck-den');
  var deckStatus = $('#deck-status');
  var folder = $('#folder');
  var ribbon = $('#ribbon');
  var chaos = $('#chaos');
  var wallCounter = $('#wall-counter');
  var traySession = $('#tray-session');
  var valueNumbers = $('#value-numbers');
  var clusters = $$('.cluster');
  var sessions = $$('.sess');
  var artifacts = $$('.artifact');
  var buildNum = $('#build-num');
  var buildBar = $('#build-bar');
  var slots = $$('#tray .slot');
  var trayStack = $$('.tray-stack i');
  var googleSec = $('#google-track');
  var motionOn = canObserve && !reduceMotion;

  if (motionOn) { doc.classList.add('has-motion'); }

  /* Snapshot the final counter values up front so the hard failsafe can
     always restore them, even if the section was never scrolled into view. */
  $$('.vn').forEach(function (vn) {
    if (!vn.hasAttribute('data-final')) { vn.setAttribute('data-final', vn.getAttribute('data-n')); }
  });

  /* --------------------------------------------------- 1 · PORTFOLIO ASSEMBLY */
  var deckDone = false;
  var deckTimers = [];

  function deckFinal() {
    if (!deckNum) { return; }
    deckNum.textContent = '14';
    deckDen.textContent = ' OUTPUTS';
    deckStatus.textContent = 'PORTFOLIO READY';
    deckDone = true;
    if (deck) { deck.classList.add('is-complete'); }
  }

  /* Phase 1–2: scattered artifacts appear and align (CSS keyframes).
     Phase 3: 03/14 → 07/14 → 11/14 → 14/14 counter.
     Phase 4: stack seals into a complete AI Capability Portfolio. */
  function deckRun() {
    if (!deckNum || deckDone) { return; }
    if (reduceMotion) { deckFinal(); return; }
    var seq = [3, 7, 11, 14];
    var i = 0;
    deckNum.textContent = '03';
    deckDen.textContent = ' / 14';
    deckStatus.textContent = 'ASSEMBLING PORTFOLIO';
    var timer = window.setInterval(function () {
      i += 1;
      if (i >= seq.length) {
        window.clearInterval(timer);
        deckFinal();
        return;
      }
      deckNum.textContent = pad(seq[i]);
      if (i === seq.length - 1) {
        window.clearInterval(timer);
        deckTimers.push(window.setTimeout(deckFinal, 260));
      }
    }, 560);
  }

  /* ------------------------------------------------------ 2 · REVEAL / SCENES */
  if (motionOn) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        el.classList.add('is-visible');

        if (el === deck) {
          el.classList.add('is-lit');
          deckTimers.push(window.setTimeout(deckRun, 1100));
        }
        if (el === folder) {
          el.classList.add('is-lit');
          deckTimers.push(window.setTimeout(function () { folder.classList.add('is-sealed'); }, 4300));
        }
        if (el === ribbon) { el.classList.add('is-lit'); }
        if (el === chaos) { el.classList.add('is-aligned'); }
        if (el === valueNumbers) { runValueNumbers(); }

        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    $$('.reveal, .clip-reveal').forEach(function (el) { io.observe(el); });
    [deck, folder, ribbon, chaos, valueNumbers].forEach(function (el) { if (el) { io.observe(el); } });
  } else {
    /* No observer / reduced motion: show the completed portfolio at once. */
    deckFinal();
    if (folder) { folder.classList.add('is-lit', 'is-sealed'); }
    if (ribbon) { ribbon.classList.add('is-lit'); }
    if (chaos) { chaos.classList.add('is-aligned'); }
  }

  /* Hard failsafe — never leave content invisible, whatever happens. */
  window.setTimeout(function () {
    $$('.reveal, .clip-reveal').forEach(function (el) { el.classList.add('is-visible'); });
    if (deck) { deck.classList.add('is-lit', 'is-complete'); }
    if (folder) { folder.classList.add('is-lit', 'is-sealed'); }
    if (ribbon) { ribbon.classList.add('is-lit'); }
    if (chaos) { chaos.classList.add('is-aligned'); }
    if (wallCounter) { wallCounter.setAttribute('data-n', '14'); }
    if (!deckDone) { deckFinal(); }
    valueFinal();
  }, 4600);

  /* ------------------------------------------- 3 · VALUE NUMBERS COUNT-UP */
  var valueDone = false;
  function valueFinal() {
    if (!valueNumbers || valueDone) { return; }
    valueDone = true;
    $$('.vn', valueNumbers).forEach(function (vn) {
      var final = vn.getAttribute('data-final');
      if (final !== null) { vn.setAttribute('data-n', final); }
    });
  }
  function runValueNumbers() {
    if (!valueNumbers || valueDone) { return; }
    var items = $$('.vn', valueNumbers);
    items.forEach(function (vn) { vn.setAttribute('data-final', vn.getAttribute('data-n')); });
    if (reduceMotion) { valueFinal(); return; }
    valueDone = true;
    var start = null;
    var duration = 1000;
    var targets = items.map(function (vn) {
      var raw = vn.getAttribute('data-final');
      return { el: vn, alpha: isNaN(parseInt(raw, 10)), end: parseInt(raw, 10) || 0, raw: raw };
    });
    function frame(ts) {
      if (start === null) { start = ts; }
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      targets.forEach(function (t) {
        if (!t.alpha) { t.el.setAttribute('data-n', pad(Math.round(t.end * eased))); }
      });
      if (p < 1) { window.requestAnimationFrame(frame); }
      else { targets.forEach(function (t) { t.el.setAttribute('data-n', t.raw); }); }
    }
    window.requestAnimationFrame(frame);
  }

  /* ------------------------------------------- 4 · CAPABILITY WALL COUNTER */
  function updateWall() {
    if (!wallCounter || !clusters.length) { return; }
    var vh = window.innerHeight || doc.clientHeight;
    var active = 0;
    clusters.forEach(function (cluster, i) {
      if (cluster.getBoundingClientRect().top < vh * 0.66) { active = i; }
    });
    var n = parseInt(clusters[active].getAttribute('data-count'), 10) || 14;
    wallCounter.setAttribute('data-n', pad(n));
    clusters.forEach(function (cluster, i) { cluster.classList.toggle('is-active', i <= active); });
  }

  /* ------------------------------------------- 5 · SESSION STATE (03 → 14) */
  var buildCurrent = -1;

  function setBuild(n, index) {
    if (n === buildCurrent) { return; }
    buildCurrent = n;
    if (buildNum) { buildNum.textContent = pad(n); }
    if (buildBar) { buildBar.style.setProperty('--p', (n / 14 * 100).toFixed(2) + '%'); }
    slots.forEach(function (slot, i) { slot.classList.toggle('is-filled', i < n); });
    trayStack.forEach(function (sheet, i) { sheet.classList.toggle('is-lit', i <= index); });
    if (traySession) { traySession.setAttribute('data-n', pad(index + 1)); }
  }

  function updateBuild() {
    if (!sessions.length) { return; }
    var vh = window.innerHeight || doc.clientHeight;
    var active = -1;
    sessions.forEach(function (sess, i) {
      if (sess.getBoundingClientRect().top < vh * 0.62) { active = i; }
    });
    if (active < 0) { active = 0; }
    sessions.forEach(function (sess, i) { sess.classList.toggle('is-active', i === active); });
    setBuild(parseInt(sessions[active].getAttribute('data-count'), 10) || 14, active);
  }

  /* ---------------------------------------------- 6 · GOLD PROGRESS RIBBON */
  function updateRibbon() {
    if (!googleSec) { return; }
    var rect = googleSec.getBoundingClientRect();
    var vh = window.innerHeight || doc.clientHeight;
    var p = (vh * 0.86 - rect.top) / (rect.height * 0.92);
    p = Math.max(0, Math.min(1, p));
    googleSec.style.setProperty('--g', (p * 100).toFixed(1) + '%');
    $$('.mod', googleSec).forEach(function (mod, i) {
      mod.classList.toggle('is-on', p >= (i + 1) / 5 - 0.06);
    });
  }

  /* ------------------------------------------------- 7 · SCROLL LOOP (rAF) */
  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      updateBuild();
      updateWall();
      updateRibbon();
      ticking = false;
    });
  }

  if (!reduceMotion) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  } else {
    setBuild(14, 4);
    sessions.forEach(function (sess) { sess.classList.add('is-active'); });
    if (googleSec) { googleSec.style.setProperty('--g', '100%'); }
    if (wallCounter) { wallCounter.setAttribute('data-n', '14'); }
    valueFinal();
  }

  /* ---------------------------------------------------- 8 · HERO INTERACTION */
  if (deck) {
    if (!canHover && !reduceMotion) {
      deck.addEventListener('click', function () { deck.classList.toggle('is-fanned'); });
    }
    if (canHover && !reduceMotion) {
      var stage = $('.deck-stage', deck);
      deck.addEventListener('mousemove', function (e) {
        if (!stage) { return; }
        var r = deck.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--px', (x * 12).toFixed(2) + 'px');
        stage.style.setProperty('--py', (y * 12).toFixed(2) + 'px');
      });
      deck.addEventListener('mouseleave', function () {
        if (!stage) { return; }
        stage.style.setProperty('--px', '0px');
        stage.style.setProperty('--py', '0px');
      });
    }
  }

  if (canHover && !reduceMotion) {
    $$('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 6 + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ------------------------------------------- 9 · MOBILE SINGLE-OPEN ACCORDION */
  var mobileMQ = window.matchMedia('(max-width: 760px)');
  var syncing = false;

  function syncDisclosure() {
    syncing = true;
    var mobile = mobileMQ.matches;
    sessions.forEach(function (sess, i) { sess.open = mobile ? i === 0 : true; });
    artifacts.forEach(function (art) { art.open = !mobile; });
    syncing = false;
  }

  function singleOpen(list) {
    list.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (syncing || !item.open || !mobileMQ.matches) { return; }
        syncing = true;
        list.forEach(function (other) { if (other !== item) { other.open = false; } });
        syncing = false;
      });
    });
  }

  syncDisclosure();
  singleOpen(sessions);
  singleOpen(artifacts);
  if (mobileMQ.addEventListener) { mobileMQ.addEventListener('change', syncDisclosure); }
  else if (mobileMQ.addListener) { mobileMQ.addListener(syncDisclosure); }

  /* --------------------------------------------------------- 10 · ENROLLMENT */
  var form = document.getElementById('rsvp-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    var showStatus = function (message, isError) {
      status.textContent = message;
      status.className = 'form-status is-visible' + (isError ? ' is-error' : '');
    };

    var sourceSelect = document.getElementById('f-source');
    var otherFieldWrap = document.getElementById('field-other-source');
    var otherInput = document.getElementById('f-other-source');

    var updateOtherSourceVisibility = function () {
      if (!sourceSelect || !otherFieldWrap || !otherInput) return;
      if (sourceSelect.value === 'Nguồn khác') {
        otherFieldWrap.style.display = 'block';
        otherInput.required = true;
        otherInput.setAttribute('aria-required', 'true');
      } else {
        otherFieldWrap.style.display = 'none';
        otherInput.required = false;
        otherInput.removeAttribute('aria-required');
        otherInput.value = '';
      }
    };

    if (sourceSelect) {
      sourceSelect.addEventListener('change', updateOtherSourceVisibility);
      updateOtherSourceVisibility();
    }

    form.addEventListener('reset', function () {
      setTimeout(updateOtherSourceVisibility, 0);
    });

    document.querySelectorAll('.consent-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });

    var isSubmitting = false;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      var name = form.elements.ho_ten ? form.elements.ho_ten.value.trim() : '';
      var phone = form.elements.dien_thoai ? form.elements.dien_thoai.value.trim() : '';
      var email = form.elements.email ? form.elements.email.value.trim() : '';
      var jobTitle = form.elements.nghe_nghiep ? form.elements.nghe_nghiep.value.trim() : '';
      var company = form.elements.doanh_nghiep ? form.elements.doanh_nghiep.value.trim() : '';
      var aiGoal = form.elements.muc_tieu ? form.elements.muc_tieu.value.trim() : '';
      var aiExperience = form.elements.muc_do ? form.elements.muc_do.value.trim() : '';
      var source = form.elements.nguon_biet_den ? form.elements.nguon_biet_den.value.trim() : '';
      var otherSource = form.elements.nguon_khac ? form.elements.nguon_khac.value.trim() : '';
      var requiredConsent = form.elements.dong_y ? Boolean(form.elements.dong_y.checked) : false;
      var marketingConsent = form.elements.dong_y_marketing ? Boolean(form.elements.dong_y_marketing.checked) : false;

      if (!name || name.length < 2) {
        showStatus('Vui lòng điền Họ tên (tối thiểu 2 ký tự).', true);
        if (form.elements.ho_ten) { form.elements.ho_ten.focus(); }
        return;
      }

      var phoneDigits = phone.replace(/[^\d+]/g, '');
      if (!phone || !/^\+?\d{8,15}$/.test(phoneDigits)) {
        showStatus('Vui lòng điền Số điện thoại / Zalo hợp lệ (8–15 chữ số).', true);
        if (form.elements.dien_thoai) { form.elements.dien_thoai.focus(); }
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showStatus('Vui lòng điền địa chỉ Email hợp lệ hoặc để trống.', true);
        if (form.elements.email) { form.elements.email.focus(); }
        return;
      }

      if (form.elements.nguon_biet_den && form.elements.nguon_biet_den.required && !source) {
        showStatus('Vui lòng chọn: Bạn biết đến chương trình qua đâu?', true);
        form.elements.nguon_biet_den.focus();
        return;
      }

      if (source === 'Nguồn khác' && (!otherSource || otherSource.length < 2)) {
        showStatus('Vui lòng cho biết cụ thể nguồn bạn biết đến chương trình.', true);
        if (form.elements.nguon_khac) { form.elements.nguon_khac.focus(); }
        return;
      }

      if (!requiredConsent) {
        showStatus('Vui lòng đồng ý với Chính sách bảo vệ dữ liệu cá nhân trước khi gửi đăng ký.', true);
        if (form.elements.dong_y) { form.elements.dong_y.focus(); }
        return;
      }

      var searchParams;
      try {
        searchParams = new URLSearchParams(window.location.search || '');
      } catch (e) {
        searchParams = null;
      }
      var getParam = function (k) {
        return searchParams ? (searchParams.get(k) || '') : '';
      };

      var endpoint = form.getAttribute('data-endpoint') || '/api/foundation-leads';
      var payload = {
        full_name: name,
        phone: phone,
        email: email,
        job_title: jobTitle,
        company: company,
        ai_goal: aiGoal,
        ai_experience: aiExperience,
        source: source,
        other_source: source === 'Nguồn khác' ? otherSource : '',
        privacy_consent: requiredConsent,
        marketing_consent: marketingConsent,
        utm_source: getParam('utm_source'),
        utm_medium: getParam('utm_medium'),
        utm_campaign: getParam('utm_campaign'),
        utm_content: getParam('utm_content'),
        utm_term: getParam('utm_term'),
        referrer: document.referrer || '',
        landing_path: window.location.pathname || '/ai-foundation',
        ho_ten: name,
        dien_thoai: phone,
        nghe_nghiep: jobTitle,
        doanh_nghiep: company,
        muc_tieu: aiGoal,
        muc_do: aiExperience,
        nguon_biet_den: source,
        nguon_khac: source === 'Nguồn khác' ? otherSource : '',
        dong_y: requiredConsent,
        dong_y_marketing: marketingConsent,
        su_kien: 'AI_FOUNDATION_18_11_2026'
      };

      window.__lastFoundationPayload = payload;

      var button = form.querySelector('button[type="submit"]');
      isSubmitting = true;
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }
      showStatus('Đang gửi đăng ký…');

      window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || (data && data.success === false)) {
            var errMsg = (data && data.error)
              ? data.error
              : ('Không thể gửi đăng ký lúc này (HTTP ' + res.status + '). Vui lòng thử lại.');
            throw new Error(errMsg);
          }
          return data;
        });
      }).then(function () {
        showStatus('Cảm ơn ' + name + '. Ban tổ chức sẽ liên hệ xác nhận đăng ký khóa học AI Foundation 18/11/2026.');
        form.reset();
        updateOtherSourceVisibility();
      }).catch(function (err) {
        showStatus((err && err.message) ? err.message : 'Không thể gửi đăng ký lúc này. Vui lòng thử lại hoặc liên hệ Ban tổ chức.', true);
      }).then(function () {
        isSubmitting = false;
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      });
    });
  }
})();
