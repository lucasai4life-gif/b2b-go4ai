/* ==========================================================================
   AI BUILDER — BUILD ONE REAL AI SYSTEM
   One controller. Lead-capture / FAQ / demo-tab logic preserved.
   Three hero-level sequences only: blueprint assembly, sprint evolution,
   validation gates. Everything else = opacity + 12px reveal, 550ms.
   Without JS every section renders its settled final state.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function trackEvent(eventName, params) {
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: eventName, timestamp: Date.now() }, params || {}));
      }
      window.dispatchEvent(new CustomEvent(eventName, { detail: params || {} }));
    } catch (e) { /* safe fallback */ }
  }

  function getUrlParam(param) {
    try {
      return new URLSearchParams(window.location.search).get(param) || '';
    } catch (e) { return ''; }
  }

  /* ======================================================================
     1. CONTENT ENGINE — prototype demo tabs (content unchanged)
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

  function initDemoTabs() {
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
      if (engineView) engineView.textContent = d.engine;
      outputView.textContent = d.output;
      if (alertView) alertView.textContent = d.alert;
      tabBtns.forEach(function (btn) {
        var on = btn.getAttribute('data-demo') === key;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { renderTab(btn.getAttribute('data-demo')); });
    });
    renderTab('sales');
  }

  /* Mobile: one column at a time */
  function initDemoView() {
    var body = document.getElementById('demo-body');
    var btns = document.querySelectorAll('.demo-view-btn');
    if (!body || !btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        body.setAttribute('data-view', btn.getAttribute('data-view'));
        btns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      });
    });
  }

  /* ======================================================================
     2. CONSULTATION FORM — endpoint, payload and validation unchanged
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
          successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }).catch(function () {
        // No fake success on failure — surface the error and allow retry.
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
     3. MOTION — A. hero blueprint assembly (one shot)
     ====================================================================== */
  function initBlueprint() {
    var bp = document.getElementById('bp');
    if (!bp) return;
    var nodes = [].slice.call(bp.querySelectorAll('.bp-node'));
    var ticks = [].slice.call(bp.querySelectorAll('.bp-tick'));
    var flow = bp.querySelector('.bp-flow');
    var core = document.getElementById('bp-core');
    var foot = [].slice.call(bp.querySelectorAll('.bp-foot span'));
    var state = document.getElementById('bp-state');
    var stateTxt = document.getElementById('bp-state-txt');

    function settle() {
      nodes.forEach(function (n) { n.classList.add('is-on'); });
      ticks.forEach(function (t) { t.classList.add('is-drawn'); });
      if (flow) flow.classList.add('is-drawn');
      if (core) core.classList.add('is-on');
      foot.forEach(function (f) { f.classList.add('is-on'); });
      if (stateTxt) stateTxt.textContent = 'RUNNING';
      if (state) state.classList.add('is-running');
    }

    if (REDUCED) { settle(); return; }

    root.classList.add('bp-run');

    setTimeout(function () { if (flow) flow.classList.add('is-drawn'); }, 120);

    nodes.forEach(function (node, i) {
      setTimeout(function () {
        node.classList.add('is-on');
        if (ticks[i]) ticks[i].classList.add('is-drawn');
      }, 160 + i * 220);
    });

    setTimeout(function () {
      if (core) core.classList.add('is-on');
      if (stateTxt) stateTxt.textContent = 'TESTING';
    }, 1560);

    setTimeout(function () {
      if (stateTxt) stateTxt.textContent = 'RUNNING';
      if (state) state.classList.add('is-running');
    }, 2160);

    setTimeout(function () {
      foot.forEach(function (f, i) {
        setTimeout(function () { f.classList.add('is-on'); }, i * 90);
      });
    }, 2320);

    // Failsafe — always end in the settled state.
    setTimeout(settle, 4200);
  }

  /* ======================================================================
     4. MOTION — B. sprint evolution + build navigation
     ====================================================================== */
  function initBuild() {
    var btns = [].slice.call(document.querySelectorAll('.build-nav-list button'));
    var sprints = [].slice.call(document.querySelectorAll('.sprint'));
    var counter = document.getElementById('bn-now');
    if (!btns.length || sprints.length !== 5) return;

    function setActive(i) {
      btns.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
      if (counter) counter.textContent = '0' + (i + 1);
    }

    btns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        var target = sprints[i];
        if (!target) return;
        target.open = true;
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
        setActive(i);
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(sprints.indexOf(entry.target));
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sprints.forEach(function (s) { io.observe(s); });
    }

    /* Mobile: accordion, first sprint open. Desktop: all open, summary inert. */
    function syncMode() {
      var mobile = window.innerWidth <= 1020;
      root.classList.toggle('sprint-accordion', mobile);
      sprints.forEach(function (s, i) {
        s.open = mobile ? i === 0 : true;
      });
    }
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncMode, 180);
    }, { passive: true });
    syncMode();
  }

  /* ======================================================================
     5. MOTION — C. deliverable layers lock
     ====================================================================== */
  function initLayerLock() {
    var layers = [].slice.call(document.querySelectorAll('.layer'));
    if (!layers.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      layers.forEach(function (l) { l.classList.add('is-locked'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var i = layers.indexOf(el);
        setTimeout(function () { el.classList.add('is-locked'); }, (i % 3) * 90);
        io.unobserve(el);
      });
    }, { threshold: 0.35 });
    layers.forEach(function (l) { io.observe(l); });
    setTimeout(function () {
      layers.forEach(function (l) { l.classList.add('is-locked'); });
    }, 5000);
  }

  /* ======================================================================
     6. MOTION — D. validation gates
     ====================================================================== */
  function initGates() {
    var grid = document.querySelector('.lab-grid');
    var gates = [].slice.call(document.querySelectorAll('.gate'));
    if (!grid || !gates.length) return;

    gates.forEach(function (g) {
      var s = g.querySelector('.gate-s');
      if (s && s.textContent.trim() === 'REVIEW') g.classList.add('is-review');
    });

    function activateAll() { gates.forEach(function (g) { g.classList.add('is-on'); }); }
    if (REDUCED || !('IntersectionObserver' in window)) { activateAll(); return; }

    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done) return;
        done = true;
        gates.forEach(function (g, i) {
          setTimeout(function () { g.classList.add('is-on'); }, i * 130);
        });
        io.disconnect();
      });
    }, { threshold: 0.2 });
    io.observe(grid);
    setTimeout(activateAll, 6000);
  }

  /* ======================================================================
     7. MOTION — E. generic reveal (opacity + 12px, 550ms)
     ====================================================================== */
  var REVEAL_SELECTOR = [
    '.head', '.proof-item', '.problem-words', '.problem-list', '.thesis',
    '.stack-head', '.layer', '.sprint',
    '.uc-side', '.uc-foot', '.demo', '.proof-case',
    '.lib-row', '.lib-foot',
    '.lab-strip', '.lab-accept', '.measure-head', '.measure-track',
    '.measure-table', '.measure-note', '.measure-close',
    '.fit-panel', '.boundary', '.lead-head', '.lead-profile', '.lead-metrics',
    '.price-left', '.faq-head', '.faq-list', '.rail-row'
  ].join(',');

  function initReveal() {
    var items = [].slice.call(document.querySelectorAll(REVEAL_SELECTOR));
    if (!items.length || REDUCED) return;
    items.forEach(function (el) { el.classList.add('rv'); });
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    root.classList.add('motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    // Failsafe: never leave content hidden.
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }, 3500);
  }

  /* ======================================================================
     8. INITIALISATION
     ====================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initDemoTabs();
    initDemoView();
    initConsultationForm();
    initBlueprint();
    initBuild();
    initLayerLock();
    initGates();
    initReveal();

    trackEvent('ai_builder_view', { page: '/ai-builder' });

    document.querySelectorAll('a[href*="ung-dung-thuc-te"]').forEach(function (el) {
      el.addEventListener('click', function () { trackEvent('ai_builder_library_click', { href: el.href }); });
    });
    document.querySelectorAll('a[href*="cafe-talk"], a[href*="sme-14-11"]').forEach(function (el) {
      el.addEventListener('click', function () { trackEvent('ai_builder_offline_14_11_click', { href: el.href }); });
    });
  });

})();
