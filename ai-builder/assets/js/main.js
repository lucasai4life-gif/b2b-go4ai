/* ==========================================================================
   GO4AI — AI BUILDER · LANDING PAGE 03
   Behaviour layer. Content strings live in the DOM, not here, except the
   three simulation scenarios which are product demo data.

   Modules
     01  Demo scenarios (hero sheet / live simulation)
     02  Hero build sequence
     03  Scroll reveal
     04  Navigation
     05  Build sprint state
     06  FAQ accordion
     07  Consultation form
     08  Boot
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* ── 01 · DEMO SCENARIOS ─────────────────────────────────────────────── */
  var DEMO_DATA = {
    sales: {
      input: 'Yêu cầu từ khách hàng (Email):\n"Chào GO4AI, công ty tôi cần báo giá hệ thống cửa nhôm Xingfa hệ 55 + kính hộp cường lực 19mm cho công trình tại Quận 2, diện tích ước tính 500m2, tiến độ giao hàng trong 3 tuần. Chiết khấu đại lý cấp 1 áp dụng mức nào?"',
      engine: '1. Đọc và phân tích yêu cầu từ khách hàng.\n2. Tra cứu thông tin sản phẩm, quy tắc và dữ liệu được cung cấp.\n3. Chuẩn bị dự thảo đề xuất hoặc báo giá theo bảng giá đại lý.\n4. Đánh dấu những nội dung cần nhân viên kiểm tra, phê duyệt.',
      output: 'BẢNG DỰ THẢO BÁO GIÁ SỐ: BG-2026-1107\nKhách hàng: Công ty Cổ phần Đầu tư & Xây dựng An Phát\nHạng mục: Cửa nhôm Xingfa hệ 55 + Kính hộp 19mm (500m2)\nĐơn giá niêm yết: 3.375.000 VNĐ/m2\nChiết khấu bậc thang (>=500m2): 12%\nTổng giá trị dự thảo: 1.485.000.000 VNĐ (Chưa VAT)\nThời gian tạo: 35 giây.\n\n⚠️ [CẦN CON NGƯỜI DUYỆT]:\n- Tiến độ thi công 3 tuần nhanh hơn chuẩn 5 ngày (cần xác nhận của Xưởng sản xuất).\n- Chính sách thanh toán đợt 2: Đề xuất giữ 10% bảo hành trong 12 tháng.',
      alert: 'Cảnh báo tự động: Đã đánh dấu 2 điểm vượt thẩm quyền cần Trưởng phòng Kinh doanh phê duyệt trước khi gửi khách hàng.'
    },
    reporting: {
      input: 'Dữ liệu đầu vào: 3 File Excel doanh thu & tồn kho tuần 44 từ 3 chi nhánh (Hà Nội, Đà Nẵng, TP.HCM) với hơn 14.200 dòng dữ liệu thô chưa đồng bộ định dạng.',
      engine: '1. Đọc dữ liệu từ các nguồn được cho phép.\n2. Tổng hợp số liệu theo biểu mẫu chuẩn quản trị doanh nghiệp.\n3. Gợi ý những điểm bất thường cần kiểm tra (Anomaly Detection).\n4. Chuẩn bị phần nhận định và báo cáo điều hành cho CEO.',
      output: 'BÁO CÁO ĐIỀU HÀNH TUẦN 44 — BAN LÃNH ĐẠO\n1. TỔNG QUAN HIỆU SUẤT:\n- Tổng doanh thu: 18.45 tỷ VNĐ (Đạt 104% kế hoạch tuần, +6.8% so với tuần 43).\n- Chi nhánh TP.HCM: 9.8 tỷ VNĐ (+11%)\n- Chi nhánh Hà Nội: 6.2 tỷ VNĐ (+4%)\n- Chi nhánh Đà Nẵng: 2.45 tỷ VNĐ (-5.2%)\n\n2. ĐIỂM BẤT THƯỜNG PHÁT HIỆN:\n⚠️ Chi nhánh Đà Nẵng phát sinh tỷ lệ hoàn hàng tăng đột biến lên 6.4% ở nhóm SKU-A2 (vượt trần kiểm soát 3.0%).\n\n3. KHUYẾN NGHỊ ĐIỀU HÀNH:\nGiám đốc Vận hành cần rà soát lô hàng lô số 889 vận chuyển miền Trung trước thứ Ba.',
      alert: 'Cảnh báo tự động: Đã phát hiện số liệu lệch định dạng và cảnh báo rủi ro hoàn hàng tại chi nhánh miền Trung.'
    },
    knowledge: {
      input: 'Câu hỏi từ nhân viên kinh doanh:\n"Khách hàng thanh toán trễ hạn 15 ngày thì có được giữ mức chiết khấu quý không? Nếu khách yêu cầu bảo lãnh thanh toán qua ngân hàng thì thẩm quyền ai ký?"',
      engine: '1. Tổ chức tài liệu theo nhóm nghiệp vụ (Kinh doanh, Tài chính, Pháp chế).\n2. Tra cứu và tổng hợp thông tin từ nguồn tài liệu được phép.\n3. Trả lời câu hỏi có tham chiếu tài liệu khi hệ thống hỗ trợ.\n4. Chỉ rõ nội dung chưa đủ căn cứ để con người xác minh.',
      output: 'KẾT QUẢ TRA CỨU NGHIỆP VỤ:\n1. CHÍNH SÁCH CHIẾT KHẤU QUÝ:\nTheo Quy chế Tài chính 2026 (Điều 14, Khoản 3), thanh toán trễ hạn quá 10 ngày làm việc sẽ TỰ ĐỘNG MẤT quyền hưởng chiết khấu quý của kỳ đó.\n\n2. THẨM QUYỀN KÝ BẢO LÃNH:\nTheo Phân quyền Thẩm quyền (SOP-LEG-02, Mục B):\n- Dự án < 2 tỷ VNĐ: Giám đốc Tài chính ký phê duyệt.\n- Dự án >= 2 tỷ VNĐ: Tổng Giám đốc phê duyệt văn bản.\n\n⚠️ NỘI DUNG CẦN XÁC MINH THÊM:\nTrường hợp có cam kết bảo lãnh của ngân hàng loại 1 (Big 4) trước ngày đến hạn có thể được xem xét ngoại lệ. Cần gửi phiếu xin ý kiến CFO.',
      alert: 'Dẫn chứng minh bạch: Đã đối chiếu chính xác Điều 14 Quy chế Tài chính và SOP-LEG-02 nội bộ.'
    }
  };

  function initDemoTabs() {
    var tabs = document.querySelectorAll('.demo-tab');
    var inputView = document.getElementById('hw-input-view');
    var engineView = document.getElementById('hw-engine-view');
    var outputView = document.getElementById('hw-output-view');
    var alertView = document.getElementById('hw-alert-view');

    if (!tabs.length || !inputView || !outputView) return;

    function render(key) {
      var d = DEMO_DATA[key];
      if (!d) return;
      inputView.textContent = d.input;
      if (engineView) engineView.textContent = d.engine;
      outputView.textContent = d.output;
      if (alertView) alertView.textContent = d.alert;

      tabs.forEach(function (btn) {
        var on = btn.getAttribute('data-demo') === key;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        render(btn.getAttribute('data-demo'));
      });
    });

    render('sales');
  }

  /* ── 02 · HERO BUILD SEQUENCE ────────────────────────────────────────── */
  function initHeroSequence() {
    var sheet = document.getElementById('sheet');
    var state = document.getElementById('sheetState');
    var stateTxt = document.getElementById('sheetStateTxt');
    var result = document.getElementById('sheetResult');
    if (!sheet) return;

    var steps = sheet.querySelectorAll('.sheet-step');
    var ran = false;

    function finalState() {
      sheet.classList.add('is-built');
      steps.forEach(function (s) { s.classList.add('is-on'); });
      if (state) { state.classList.remove('is-building', 'is-testing'); state.classList.add('is-running'); }
      if (stateTxt) stateTxt.textContent = 'RUNNING';
      if (result) result.classList.add('is-live');
    }

    function run() {
      if (ran) return;
      ran = true;

      if (reduceMotion) { finalState(); return; }

      if (state) state.classList.add('is-building');
      if (stateTxt) stateTxt.textContent = 'BUILDING';

      steps.forEach(function (s, i) {
        window.setTimeout(function () {
          s.classList.add('is-on');
          if (i === 1) sheet.classList.add('is-built');
        }, 260 + i * 290);
      });

      window.setTimeout(function () {
        if (state) { state.classList.remove('is-building'); state.classList.add('is-testing'); }
        if (stateTxt) stateTxt.textContent = 'TESTING';
      }, 1120);

      window.setTimeout(function () {
        if (state) { state.classList.remove('is-testing'); state.classList.add('is-running'); }
        if (stateTxt) stateTxt.textContent = 'RUNNING';
        if (result) result.classList.add('is-live');
      }, 1880);
    }

    if (!('IntersectionObserver' in window)) { finalState(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(); io.disconnect(); }
      });
    }, { threshold: 0.35 });

    io.observe(sheet);
  }

  /* ── 03 · SCROLL REVEAL ──────────────────────────────────────────────── */
  function initReveal() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      el.style.setProperty('--d', Math.min(i % 4, 3) * 70 + 'ms');
      io.observe(el);
    });
  }

  /* ── 04 · NAVIGATION ─────────────────────────────────────────────────── */
  function initNav() {
    var nav = document.getElementById('topnav');
    var toggle = document.querySelector('.topnav-toggle');
    var menu = document.getElementById('topnav-menu');

    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('is-stuck', window.scrollY > 18);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── 05 · BUILD SPRINT STATE ─────────────────────────────────────────── */
  function initSprint() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.sprint-card'));
    var navItems = Array.prototype.slice.call(document.querySelectorAll('.sprint-nav-item'));
    if (!cards.length || !('IntersectionObserver' in window)) return;

    function activate(index) {
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      navItems.forEach(function (n, i) { n.classList.toggle('is-active', i === index); });
    }

    activate(0);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          activate(cards.indexOf(e.target));
        }
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });

    cards.forEach(function (c) { io.observe(c); });
  }

  /* ── 06 · FAQ ACCORDION ──────────────────────────────────────────────── */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');

    function close(other) {
      other.classList.remove('is-open');
      var t = other.querySelector('.faq-trigger');
      var b = other.querySelector('.faq-body');
      if (t) t.setAttribute('aria-expanded', 'false');
      if (b) b.setAttribute('aria-hidden', 'true');
    }

    items.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      var body = item.querySelector('.faq-body');
      if (!trigger) return;

      if (body) body.setAttribute('aria-hidden', 'true');

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(close);

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          if (body) body.setAttribute('aria-hidden', 'false');
          track('ai_builder_faq_expand', { question: trigger.innerText.trim() });
        }
      });
    });
  }

  /* ── 07 · CONSULTATION FORM ──────────────────────────────────────────── */
  function initForm() {
    var form = document.getElementById('consultation-form');
    var status = document.getElementById('form-status');
    var success = document.getElementById('consult-success-card');
    var greeting = document.getElementById('success-client-name');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.ho_ten ? form.elements.ho_ten.value : '').trim();
      var phone = (form.elements.dien_thoai ? form.elements.dien_thoai.value : '').trim();
      var email = (form.elements.email ? form.elements.email.value : '').trim();
      var company = (form.elements.doanh_nghiep ? form.elements.doanh_nghiep.value : '').trim();
      var role = (form.elements.vai_tro ? form.elements.vai_tro.value : 'CEO / Chủ doanh nghiệp');
      var problem = (form.elements.bai_toan ? form.elements.bai_toan.value : '').trim();
      var consent = form.elements.dong_y ? form.elements.dong_y.checked : false;

      if (!name || !phone || !email || !company || !consent) {
        if (status) {
          status.textContent = 'Vui lòng điền đầy đủ các thông tin bắt buộc (*) và xác nhận đồng ý.';
          status.className = 'form-status is-visible is-error';
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      if (status) {
        status.textContent = 'Đang gửi yêu cầu tư vấn...';
        status.className = 'form-status is-visible';
      }

      track('ai_builder_consult_cta_click', { cta: 'submit_consultation' });

      var payload = {
        name: name,
        phone: phone,
        email: email,
        company: company,
        role: role,
        leadType: 'enterprise_consultation',
        program: 'AI Builder 21/11/2026',
        sourcePage: 'ai_builder',
        sourceCta: 'consultation_form',
        sourceCampaign: 'ai_builder_202611',
        utm_source: urlParam('utm_source'),
        utm_medium: urlParam('utm_medium'),
        utm_campaign: urlParam('utm_campaign') || 'ai_builder_202611',
        problem: problem || 'Chưa mô tả chi tiết',
        notes: 'Vai trò: ' + role + (problem ? ' | Bài toán: ' + problem : '')
      };

      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return { success: true }; });
      }).then(function () {
        track('ai_builder_consult_submit_success', { company: company });

        if (status) { status.textContent = ''; status.className = 'form-status'; }
        if (greeting) greeting.textContent = name + ' (' + company + ')';

        form.style.display = 'none';
        if (success) {
          success.classList.add('is-visible');
          success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
      }).catch(function () {
        /* Never fake success on a failed request. */
        if (status) {
          status.textContent = 'Không thể gửi yêu cầu lúc này do gián đoạn kết nối. Vui lòng bấm gửi lại hoặc liên hệ Hotline/Zalo GO4AI.';
          status.className = 'form-status is-visible is-error';
        }
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function track(eventName, params) {
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: eventName, timestamp: Date.now() }, params || {}));
      }
      window.dispatchEvent(new CustomEvent(eventName, { detail: params || {} }));
    } catch (e) { /* no-op */ }
  }

  function urlParam(key) {
    try { return new URLSearchParams(window.location.search).get(key) || ''; }
    catch (e) { return ''; }
  }

  /* ── 08 · BOOT ───────────────────────────────────────────────────────── */
  function boot() {
    initDemoTabs();
    initHeroSequence();
    initReveal();
    initNav();
    initSprint();
    initFaq();
    initForm();

    track('ai_builder_view', { page: '/ai-builder' });

    document.querySelectorAll('a[href*="ung-dung-thuc-te"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('ai_builder_library_click', { href: el.href });
      });
    });

    document.querySelectorAll('a[href*="sme-14-11"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('ai_builder_offline_14_11_click', { href: el.href });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
