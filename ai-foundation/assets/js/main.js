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
