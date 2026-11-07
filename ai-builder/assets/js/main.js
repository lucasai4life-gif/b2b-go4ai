/* ==========================================================================
   AI BUILDER — THE WORKING AI PROTOTYPE
   One controller. Original lead-capture / FAQ / demo-tab logic preserved
   verbatim; motion system consolidated into named modules below it.
   Motion is gated on prefers-reduced-motion and on JS availability: without
   JS every section renders its settled, fully visible final state.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (!REDUCED) {
    if (document.getElementById('proto-sheet')) root.classList.add('build-ready');
    if (document.querySelector('.reveal')) root.classList.add('has-motion');
  }

  function trackEvent(eventName, params) {
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: eventName, timestamp: Date.now() }, params || {}));
      }
      var ev = new CustomEvent(eventName, { detail: params || {} });
      window.dispatchEvent(ev);
    } catch (e) { /* safe fallback */ }
  }

  function getUrlParam(param) {
    try {
      var searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(param) || '';
    } catch (e) { return ''; }
  }

  /* ======================================================================
     1. CONTENT ENGINE — hero demo tabs (content unchanged)
     ====================================================================== */
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

  function initHeroTabs() {
    var tabBtns = document.querySelectorAll('.hw-tab-btn');
    var inputView = document.getElementById('hw-input-view');
    var engineView = document.getElementById('hw-engine-view');
    var outputView = document.getElementById('hw-output-view');
    var alertView = document.getElementById('hw-alert-view');
    if (!tabBtns.length || !inputView || !outputView) return;

    function renderTab(key) {
      var d = DEMO_DATA[key];
      if (!d) return;
      inputView.textContent = d.input;
      engineView.textContent = d.engine;
      outputView.textContent = d.output;
      if (alertView) alertView.textContent = d.alert;
      tabBtns.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-demo') === key);
        btn.setAttribute('aria-selected', btn.getAttribute('data-demo') === key ? 'true' : 'false');
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { renderTab(btn.getAttribute('data-demo')); });
    });
    renderTab('sales');
  }

  /* ======================================================================
     2. FAQ accordion (unchanged behaviour)
     ====================================================================== */
  function initFaq() {
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        faqItems.forEach(function (other) {
          other.classList.remove('is-open');
          var ot = other.querySelector('.faq-trigger');
          if (ot) ot.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          trackEvent('ai_builder_faq_expand', { question: trigger.innerText.trim() });
        }
      });
    });
  }

  /* ======================================================================
     3. CONSULTATION FORM — preserved verbatim (endpoint, payload, validation)
     ====================================================================== */
  function initConsultationForm() {
    var form = document.getElementById('consultation-form');
    var status = document.getElementById('form-status');
    var successCard = document.getElementById('consult-success-card');
    var greetingEl = document.getElementById('success-client-name');
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

      trackEvent('ai_builder_consult_cta_click', { cta: 'submit_consultation' });

      var payload = {
        name: name, phone: phone, email: email, company: company, role: role,
        leadType: 'enterprise_consultation',
        program: 'AI Builder 21/11/2026',
        sourcePage: 'ai_builder',
        sourceCta: 'consultation_form',
        sourceCampaign: 'ai_builder_202611',
        utm_source: getUrlParam('utm_source'),
        utm_medium: getUrlParam('utm_medium'),
        utm_campaign: getUrlParam('utm_campaign') || 'ai_builder_202611',
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
        trackEvent('ai_builder_consult_submit_success', { company: company });
        if (status) { status.textContent = ''; status.className = 'form-status'; }
        if (greetingEl) greetingEl.textContent = name + ' (' + company + ')';
        form.style.display = 'none';
        if (successCard) {
          successCard.classList.add('is-visible');
          successCard.scrollIntoView({ behavior: 'smooth' });
        }
      }).catch(function () {
        // If API fails: do NOT show fake success. Show error and let user retry.
        if (status) {
          status.textContent = 'Không thể gửi yêu cầu lúc này do gián đoạn kết nối. Vui lòng bấm gửi lại hoặc liên hệ Hotline/Zalo GO4AI.';
          status.className = 'form-status is-visible is-error';
        }
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ======================================================================
     4. MOTION SYSTEM — six named motions, no loops
     ====================================================================== */
  function initReveals() {
    var items = document.querySelectorAll('.reveal, .reveal-line');
    if (!items.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    root.classList.add('has-motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
    // Hard failsafe: never leave content hidden.
    window.setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    }, 4000);
  }

  /* Motion 1 — Hero Build Sequence (one shot) */
  function initBuildSequence() {
    var steps = document.querySelectorAll('.proto-step');
    var spines = document.querySelectorAll('.proto-spine');
    var result = document.getElementById('proto-result');
    var statusEl = document.getElementById('proto-status');
    var statusTxt = document.getElementById('proto-status-txt');
    if (!steps.length || !statusEl) return;

    function settle() {
      steps.forEach(function (s) { s.classList.add('is-on'); s.classList.remove('is-active'); });
      spines.forEach(function (s) { s.classList.add('is-on'); });
      if (result) result.classList.add('is-on');
      if (statusTxt) statusTxt.textContent = 'RUNNING';
      statusEl.classList.add('is-running');
    }

    if (REDUCED) { settle(); return; }

    root.classList.add('build-ready');
    var queue = [];
    function at(ms, fn) { queue.push(window.setTimeout(fn, ms)); }
    at(120,  function () { steps[0].classList.add('is-on', 'is-active'); });
    at(420,  function () { steps[0].classList.remove('is-active'); spines[0].classList.add('is-on'); });
    at(660,  function () { steps[1].classList.add('is-on', 'is-active'); });
    at(960,  function () { steps[1].classList.remove('is-active'); spines[1].classList.add('is-on'); });
    at(1200, function () { steps[2].classList.add('is-on', 'is-active'); });
    at(1500, function () { steps[2].classList.remove('is-active'); spines[2].classList.add('is-on'); });
    at(1740, function () { steps[3].classList.add('is-on', 'is-active'); });
    at(2040, function () { steps[3].classList.remove('is-active'); spines[3].classList.add('is-on'); });
    at(2280, function () { steps[4].classList.add('is-on'); });
    at(2480, function () { if (statusTxt) statusTxt.textContent = 'TESTING'; });
    at(3050, function () {
      if (statusTxt) statusTxt.textContent = 'RUNNING';
      statusEl.classList.add('is-running');
    });
    at(3150, function () { if (result) result.classList.add('is-on'); });
    // Failsafe: always end in the settled state.
    at(4200, settle);
  }

  /* Motion 3 — Product Stack Lock */
  function initStackLock() {
    var layers = document.querySelectorAll('.stack-layer');
    if (!layers.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      layers.forEach(function (l) { l.classList.add('is-locked'); });
      return;
    }
    root.classList.add('stack-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-locked');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.28 });
    layers.forEach(function (l) { io.observe(l); });
    window.setTimeout(function () {
      layers.forEach(function (l) { l.classList.add('is-locked'); });
    }, 4500);
  }

  /* Motion 4 — Build Sprint state change (desktop) + mobile accordion */
  function initSprint() {
    var sprint = document.getElementById('sprint');
    var panels = Array.prototype.slice.call(document.querySelectorAll('.sprint-panel'));
    var navBtns = Array.prototype.slice.call(document.querySelectorAll('.sprint-nav-btn'));
    var visuals = Array.prototype.slice.call(document.querySelectorAll('.sprint-visual-word'));
    if (!sprint || panels.length !== 5) return;

    var active = -1;
    function setActive(i) {
      i = Math.max(0, Math.min(4, i));
      if (i === active) return;
      active = i;
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      navBtns.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
      visuals.forEach(function (v, k) { v.classList.toggle('is-active', k === i); });
    }
    setActive(0);

    var desktop = function () { return window.innerWidth > 980; };
    var ticking = false;

    function update() {
      ticking = false;
      if (!desktop() || REDUCED) return;
      var navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 70;
      var rect = sprint.getBoundingClientRect();
      var total = Math.max(1, sprint.offsetHeight - (window.innerHeight - navH));
      var p = Math.max(0, Math.min(1, (navH - rect.top) / total));
      setActive(Math.min(4, Math.floor(p * 5)));
    }

    function applyMode() {
      if (desktop() && !REDUCED) root.classList.add('sprint-ready');
      else {
        root.classList.remove('sprint-ready');
        panels.forEach(function (p) { p.classList.add('is-active'); });
      }
      update();
    }

    navBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (!desktop()) return;
        var navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 70;
        var top = sprint.getBoundingClientRect().top + window.pageYOffset;
        var total = Math.max(1, sprint.offsetHeight - (window.innerHeight - navH));
        window.scrollTo({ top: top + (i + 0.12) / 5 * total, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', applyMode, { passive: true });
    applyMode();

    /* Mobile accordion — only one item open */
    function applyAccordion() {
      var mobile = window.innerWidth <= 760;
      root.classList.toggle('accordion-ready', mobile);
      if (mobile) {
        panels.forEach(function (p, i) { p.classList.toggle('is-open', i === 0); });
      } else {
        panels.forEach(function (p) { p.classList.remove('is-open'); });
      }
    }
    panels.forEach(function (panel) {
      var badge = panel.querySelector('.roadmap-badge');
      if (!badge) return;
      badge.setAttribute('tabindex', '0');
      badge.setAttribute('role', 'button');
      function toggle() {
        if (window.innerWidth > 760) return;
        var open = panel.classList.contains('is-open');
        panels.forEach(function (p) { p.classList.remove('is-open'); });
        if (!open) panel.classList.add('is-open');
      }
      badge.addEventListener('click', toggle);
      badge.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
    window.addEventListener('resize', applyAccordion, { passive: true });
    applyAccordion();
  }

  /* Motion 5 — QA Gate Activation */
  function initQAGates() {
    var chamber = document.querySelector('.test-chamber');
    var gates = Array.prototype.slice.call(document.querySelectorAll('.qa-gate'));
    if (!chamber || !gates.length) return;
    gates.forEach(function (g) {
      var state = g.querySelector('i');
      if (state && state.textContent.trim() === 'REVIEW') g.classList.add('is-review');
    });
    function activateAll() { gates.forEach(function (g) { g.classList.add('is-on'); }); }
    if (REDUCED || !('IntersectionObserver' in window)) { activateAll(); return; }
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done) return;
        done = true;
        gates.forEach(function (g, i) {
          window.setTimeout(function () { g.classList.add('is-on'); }, i * 150);
        });
        io.disconnect();
      });
    }, { threshold: 0.22 });
    io.observe(chamber);
    window.setTimeout(activateAll, 6000);
  }

  /* Motion 6 support — Before / After mobile switch */
  function initUseCaseSwitch() {
    var wrap = document.querySelector('.uc-card-wrap');
    var tabs = document.querySelectorAll('.uc-tab');
    if (!wrap || !tabs.length) return;
    function apply() {
      if (window.innerWidth <= 760) {
        if (!wrap.getAttribute('data-view')) wrap.setAttribute('data-view', 'before');
      } else {
        wrap.removeAttribute('data-view');
      }
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        wrap.setAttribute('data-view', tab.getAttribute('data-uc'));
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      });
    });
    window.addEventListener('resize', apply, { passive: true });
    apply();
  }

  /* ======================================================================
     5. INITIALISATION
     ====================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initHeroTabs();
    initFaq();
    initConsultationForm();
    initReveals();
    initBuildSequence();
    initStackLock();
    initSprint();
    initQAGates();
    initUseCaseSwitch();

    trackEvent('ai_builder_view', { page: '/ai-builder' });

    document.querySelectorAll('a[href*="ung-dung-thuc-te"]').forEach(function (el) {
      el.addEventListener('click', function () { trackEvent('ai_builder_library_click', { href: el.href }); });
    });
    document.querySelectorAll('a[href*="cafe-talk"], a[href*="sme-14-11"]').forEach(function (el) {
      el.addEventListener('click', function () { trackEvent('ai_builder_offline_14_11_click', { href: el.href }); });
    });
  });

})();
