/* ==========================================================================
   GO4AI — AI FOUNDATION 18.11.2026 (LANDING PAGE 02 / REDESIGN 02)

   Concept: BUILD YOUR AI CAPABILITY PORTFOLIO
   Motion: portfolio assembly · artifact fan-out · counter 03→14 ·
           session activation · Google ribbon progress · evidence folder.

   FAILSAFE FIRST: every piece of content is visible in HTML/CSS by default.
   This file only ADDS motion. If JS fails, is blocked, or IntersectionObserver
   is missing, the page still reads end-to-end and shows the finished state.
   Reduced motion is respected.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ------------------------------------------------------- 1 · reveal + IO */
  var deck = $('#deck');
  var deckNum = $('#deck-num');
  var deckDen = $('#deck-den');
  var deckStatus = $('#deck-status');
  var folder = $('#folder');
  var ribbon = $('#ribbon');
  var deckDone = false;

  function deckFinal() {
    if (!deckNum) { return; }
    deckNum.textContent = '14';
    deckDen.textContent = ' OUTPUTS';
    deckStatus.textContent = 'PORTFOLIO READY';
    deckDone = true;
  }

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
      /* Last step: land on "14 OUTPUTS / PORTFOLIO READY" immediately,
         never show 14 while still saying "assembling". */
      if (i === seq.length - 1) {
        window.clearInterval(timer);
        window.setTimeout(deckFinal, 260);
      }
    }, 720);
  }

  function sealFolder() {
    if (!folder) { return; }
    if (reduceMotion) { folder.classList.add('is-lit', 'is-sealed'); return; }
    window.setTimeout(function () { folder.classList.add('is-sealed'); }, 1700);
  }

  if (canObserve && !reduceMotion) {
    doc.classList.add('has-motion');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');

        if (entry.target.id === 'deck') {
          entry.target.classList.add('is-lit');
          window.setTimeout(deckRun, 1350);
        }
        if (entry.target.id === 'folder') {
          entry.target.classList.add('is-lit');
          sealFolder();
        }
        if (entry.target.id === 'ribbon') { entry.target.classList.add('is-lit'); }

        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    $$('.reveal').forEach(function (el) { io.observe(el); });
    if (deck) { io.observe(deck); }
    if (folder) { io.observe(folder); }
    if (ribbon) { io.observe(ribbon); }
  } else {
    /* No observer or reduced motion: show the finished portfolio at once. */
    deckFinal();
    if (folder) { folder.classList.add('is-lit', 'is-sealed'); }
    if (ribbon) { ribbon.classList.add('is-lit'); }
  }

  /* Hard failsafe: never leave content invisible, whatever happens. */
  window.setTimeout(function () {
    $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    if (deck) { deck.classList.add('is-lit'); }
    if (folder) { folder.classList.add('is-lit', 'is-sealed'); }
    if (ribbon) { ribbon.classList.add('is-lit'); }
    if (!deckDone) { deckFinal(); }
  }, 4000);

  /* ------------------------------------- 2 · artifact fan-out (touch tap) */
  if (deck && window.matchMedia && window.matchMedia('(hover: none)').matches) {
    deck.addEventListener('click', function () { deck.classList.toggle('is-fanned'); });
  }

  /* ------------------------------------ 3 · portfolio build journey (03→14) */
  var buildList = $('#build-list');
  var buildNum = $('#build-num');
  var buildBar = $('#build-bar');
  var slots = $$('#tray .slot');
  var sessions = $$('.sess');
  var buildCurrent = 14;

  function setBuild(n) {
    if (n === buildCurrent) { return; }
    buildCurrent = n;
    if (buildNum) { buildNum.textContent = pad(n); }
    if (buildBar) { buildBar.style.setProperty('--p', (n / 14 * 100).toFixed(2) + '%'); }
    slots.forEach(function (slot, i) { slot.classList.toggle('is-filled', i < n); });
  }

  function updateBuild() {
    if (!buildList || !sessions.length) { return; }
    var vh = window.innerHeight || doc.clientHeight;
    var active = -1;
    sessions.forEach(function (sess, i) {
      var rect = sess.getBoundingClientRect();
      if (rect.top < vh * 0.62) { active = i; }
    });
    sessions.forEach(function (sess, i) { sess.classList.toggle('is-active', i === active); });
    setBuild(active < 0 ? 0 : parseInt(sessions[active].getAttribute('data-count'), 10) || 0);
  }

  /* ------------------------------------------- 4 · Google ribbon progress */
  var googleSec = $('#google-track');

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

  /* --------------------------------------- 5 · scroll loop (one rAF frame) */
  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      updateBuild();
      updateRibbon();
      ticking = false;
    });
  }

  if (!reduceMotion) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  } else {
    setBuild(14);
    sessions.forEach(function (sess) { sess.classList.add('is-active'); });
    if (googleSec) { googleSec.style.setProperty('--g', '100%'); }
  }

  /* -------------------------------------------- 6 · mobile accordion sync */
  var mobileMQ = window.matchMedia('(max-width: 760px)');

  function syncDisclosure() {
    var mobile = mobileMQ.matches;
    sessions.forEach(function (sess, i) { sess.open = mobile ? i === 0 : true; });
    $$('.artifact').forEach(function (art) { art.open = !mobile; });
  }

  syncDisclosure();
  if (mobileMQ.addEventListener) { mobileMQ.addEventListener('change', syncDisclosure); }
  else if (mobileMQ.addListener) { mobileMQ.addListener(syncDisclosure); }

  /* ------------------------------------------------------- 7 · enrollment */
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
