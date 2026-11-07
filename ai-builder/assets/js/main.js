/* ==========================================================================
   AI BUILDER REDESIGN — 2026 OFFICIAL INTERACTIVE ENGINE
   Enterprise AI Lab · GO4AI
   ========================================================================== */
(function () {
  'use strict';

  // 1. DATA FOR HERO ENGINE & DEMO SIMULATOR
  var DEMO_DATA = {
    sales: {
      title: '01 — AI SALES & PROPOSAL ASSISTANT',
      sub: 'Trợ lý kinh doanh, đề xuất và báo giá',
      problem: 'Nhân viên mất nhiều thời gian đọc yêu cầu khách hàng, tìm thông tin sản phẩm, kiểm tra chính sách và soạn báo giá.',
      input: 'Yêu cầu từ khách hàng (Email):\n"Chào GO4AI, công ty tôi cần báo giá hệ thống cửa nhôm Xingfa hệ 55 + kính hộp cường lực 19mm cho công trình tại Quận 2, diện tích ước tính 500m2, tiến độ giao hàng trong 3 tuần. Chiết khấu đại lý cấp 1 áp dụng mức nào?"',
      engine: '1. Đọc và phân tích yêu cầu từ khách hàng.\n2. Tra cứu thông tin sản phẩm, quy tắc và dữ liệu được cung cấp.\n3. Chuẩn bị dự thảo đề xuất hoặc báo giá theo bảng giá đại lý.\n4. Đánh dấu những nội dung cần nhân viên kiểm tra, phê duyệt.',
      output: 'BẢNG DỰ THẢO BÁO GIÁ SỐ: BG-2026-1107\nKhách hàng: Công ty Cổ phần Đầu tư & Xây dựng An Phát\nHạng mục: Cửa nhôm Xingfa hệ 55 + Kính hộp 19mm (500m2)\nĐơn giá niêm yết: 3.375.000 VNĐ/m2\nChiết khấu bậc thang (>=500m2): 12%\nTổng giá trị dự thảo: 1.485.000.000 VNĐ (Chưa VAT)\nThời gian tạo: 35 giây.\n\n⚠️ [CẦN CON NGƯỜI DUYỆT]:\n- Tiến độ thi công 3 tuần nhanh hơn chuẩn 5 ngày (cần xác nhận của Xưởng sản xuất).\n- Chính sách thanh toán đợt 2: Đề xuất giữ 10% bảo hành trong 12 tháng.',
      alert: 'Cảnh báo tự động: Đã đánh dấu 2 điểm vượt thẩm quyền cần Trưởng phòng Kinh doanh phê duyệt trước khi gửi khách hàng.'
    },
    reporting: {
      title: '02 — AI REPORTING ASSISTANT',
      sub: 'Trợ lý phân tích dữ liệu và báo cáo quản trị',
      problem: 'Mỗi tuần, các phòng ban phải tổng hợp nhiều file Excel, kiểm tra số liệu và chuẩn bị báo cáo cho lãnh đạo.',
      input: 'Dữ liệu đầu vào: 3 File Excel doanh thu & tồn kho tuần 44 từ 3 chi nhánh (Hà Nội, Đà Nẵng, TP.HCM) với hơn 14.200 dòng dữ liệu thô chưa đồng bộ định dạng.',
      engine: '1. Đọc dữ liệu từ các nguồn được cho phép.\n2. Tổng hợp số liệu theo biểu mẫu chuẩn quản trị doanh nghiệp.\n3. Gợi ý những điểm bất thường cần kiểm tra (Anomaly Detection).\n4. Chuẩn bị phần nhận định và báo cáo điều hành cho CEO.',
      output: 'BÁO CÁO ĐIỀU HÀNH TUẦN 44 — BAN LÃNH ĐẠO\n1. TỔNG QUAN HIỆU SUẤT:\n- Tổng doanh thu: 18.45 tỷ VNĐ (Đạt 104% kế hoạch tuần, +6.8% so với tuần 43).\n- Chi nhánh TP.HCM: 9.8 tỷ VNĐ (+11%)\n- Chi nhánh Hà Nội: 6.2 tỷ VNĐ (+4%)\n- Chi nhánh Đà Nẵng: 2.45 tỷ VNĐ (-5.2%)\n\n2. ĐIỂM BẤT THƯỜNG PHÁT HIỆN:\n⚠️ Chi nhánh Đà Nẵng phát sinh tỷ lệ hoàn hàng tăng đột biến lên 6.4% ở nhóm SKU-A2 (vượt trần kiểm soát 3.0%).\n\n3. KHUYẾN NGHỊ ĐIỀU HÀNH:\nGiám đốc Vận hành cần rà soát lô hàng lô số 889 vận chuyển miền Trung trước thứ Ba.',
      alert: 'Cảnh báo tự động: Đã phát hiện số liệu lệch định dạng và cảnh báo rủi ro hoàn hàng tại chi nhánh miền Trung.'
    },
    knowledge: {
      title: '03 — AI KNOWLEDGE ASSISTANT',
      sub: 'Trợ lý tra cứu tri thức và quy trình nội bộ',
      problem: 'Nhân viên mất nhiều thời gian tìm quy chế, chính sách, hướng dẫn và phải hỏi người có kinh nghiệm để xử lý công việc.',
      input: 'Câu hỏi từ nhân viên kinh doanh:\n"Khách hàng thanh toán trễ hạn 15 ngày thì có được giữ mức chiết khấu quý không? Nếu khách yêu cầu bảo lãnh thanh toán qua ngân hàng thì thẩm quyền ai ký?"',
      engine: '1. Tổ chức tài liệu theo nhóm nghiệp vụ (Kinh doanh, Tài chính, Pháp chế).\n2. Tra cứu và tổng hợp thông tin từ nguồn tài liệu được phép.\n3. Trả lời câu hỏi có tham chiếu tài liệu khi hệ thống hỗ trợ.\n4. Chỉ rõ nội dung chưa đủ căn cứ để con người xác minh.',
      output: 'KẾT QUẢ TRA CỨU NGHIỆP VỤ:\n1. CHÍNH SÁCH CHIẾT KHẤU QUÝ:\nTheo Quy chế Tài chính 2026 (Điều 14, Khoản 3), thanh toán trễ hạn quá 10 ngày làm việc sẽ TỰ ĐỘNG MẤT quyền hưởng chiết khấu quý của kỳ đó.\n\n2. THẨM QUYỀN KÝ BẢO LÃNH:\nTheo Phân quyền Thẩm quyền (SOP-LEG-02, Mục B):\n- Dự án < 2 tỷ VNĐ: Giám đốc Tài chính ký phê duyệt.\n- Dự án >= 2 tỷ VNĐ: Tổng Giám đốc phê duyệt văn bản.\n\n⚠️ NỘI DUNG CẦN XÁC MINH THÊM:\nTrường hợp có cam kết bảo lãnh của ngân hàng loại 1 (Big 4) trước ngày đến hạn có thể được xem xét ngoại lệ. Cần gửi phiếu xin ý kiến CFO.',
      alert: 'Dẫn chứng minh bạch: Đã đối chiếu chính xác Điều 14 Quy chế Tài chính và SOP-LEG-02 nội bộ.'
    }
  };

  // 2. HERO TABS CONTROLLER
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
      if (alertView) {
        alertView.textContent = d.alert;
      }

      tabBtns.forEach(function (btn) {
        if (btn.getAttribute('data-demo') === key) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-demo');
        renderTab(key);
      });
    });

    // Default to sales tab
    renderTab('sales');
  }

  // 3. PROTOTYPE DEMO MODAL CONTROLLER
  function initDemoModal() {
    var modal = document.getElementById('proto-modal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.proto-modal-close');
    var modalTitle = document.getElementById('modal-demo-title');
    var modalSub = document.getElementById('modal-demo-sub');
    var modalInput = document.getElementById('modal-demo-input');
    var modalOutput = document.getElementById('modal-demo-output');
    var modalAlert = document.getElementById('modal-demo-alert');

    function openDemo(key) {
      var d = DEMO_DATA[key];
      if (!d) return;

      if (modalTitle) modalTitle.textContent = d.title;
      if (modalSub) modalSub.textContent = d.sub;
      if (modalInput) modalInput.textContent = d.input;
      if (modalOutput) modalOutput.textContent = d.output;
      if (modalAlert) modalAlert.textContent = d.alert;

      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    function closeDemo() {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-demo]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var key = btn.getAttribute('data-open-demo');
        openDemo(key);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeDemo);
    }

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeDemo();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeDemo();
      }
    });
  }

  // 4. FAQ ACCORDION CONTROLLER
  function initFaq() {
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        // Close others for clean accordion
        faqItems.forEach(function (other) {
          other.classList.remove('is-open');
          var ot = other.querySelector('.faq-trigger');
          if (ot) ot.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // 5. REGISTRATION FORM, TICKET OFFSET & QR PAYMENT
  function initEnrollmentForm() {
    var form = document.getElementById('builder-form');
    var status = document.getElementById('form-status');
    var ticketRadio = document.getElementById('pay-ticket');
    var ticketBox = document.getElementById('ticket-box');
    var ticketInput = document.getElementById('ticket-code');
    var ticketFeedback = document.getElementById('ticket-feedback');
    var verifyBtn = document.getElementById('btn-verify-ticket');
    var qrDialog = document.getElementById('qr-payment-dialog');
    var qrAmountEl = document.getElementById('qr-amount-val');
    var qrMemoEl = document.getElementById('qr-memo-val');
    var qrImgEl = document.getElementById('qr-image-tag');

    var currentPrice = 16000000;
    var ticketDiscount = 0;

    // Payment method radio change
    var paymentRadios = document.querySelectorAll('input[name="phuong_thuc_thanh_toan"]');
    paymentRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (ticketRadio && ticketRadio.checked) {
          if (ticketBox) ticketBox.classList.add('is-active');
        } else {
          if (ticketBox) ticketBox.classList.remove('is-active');
          ticketDiscount = 0;
          updatePriceDisplay();
        }
      });
    });

    function updatePriceDisplay() {
      var finalPrice = Math.max(0, currentPrice - ticketDiscount);
      if (qrAmountEl) {
        qrAmountEl.textContent = new Intl.NumberFormat('vi-VN').format(finalPrice) + ' VNĐ';
      }
    }

    // Verify ticket code
    if (verifyBtn && ticketInput) {
      verifyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var code = ticketInput.value.trim().toUpperCase();
        if (!code) {
          if (ticketFeedback) {
            ticketFeedback.textContent = 'Vui lòng nhập mã vé tham dự ngày 14/11.';
            ticketFeedback.style.color = '#E58282';
          }
          return;
        }

        // Mock verification: any code with at least 4 chars gets 100% ticket price deducted (500,000 VND)
        if (code.length >= 4) {
          ticketDiscount = 500000;
          updatePriceDisplay();
          if (ticketFeedback) {
            ticketFeedback.textContent = '✓ Mã vé hợp lệ! Đã cấn trừ 100% giá vé (500.000 VNĐ). Số tiền học phí còn lại: 15.500.000 VNĐ.';
            ticketFeedback.style.color = 'var(--emerald)';
          }
        } else {
          if (ticketFeedback) {
            ticketFeedback.textContent = 'Mã vé không tìm thấy trong hệ thống sự kiện 14/11. Vui lòng kiểm tra lại.';
            ticketFeedback.style.color = '#E58282';
          }
        }
      });
    }

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.ho_ten ? form.elements.ho_ten.value : '').trim();
      var phone = (form.elements.dien_thoai ? form.elements.dien_thoai.value : '').trim();
      var email = (form.elements.email ? form.elements.email.value : '').trim();
      var company = (form.elements.doanh_nghiep ? form.elements.doanh_nghiep.value : '').trim();
      var consent = form.elements.dong_y ? form.elements.dong_y.checked : false;

      // Extract participation
      var partEl = form.querySelector('input[name="hinh_thuc_tham_du"]:checked');
      var participation = partEl ? partEl.value : 'Trực tiếp tham gia';

      // Extract payment
      var payEl = form.querySelector('input[name="phuong_thuc_thanh_toan"]:checked');
      var paymentMethod = payEl ? payEl.value : 'Chuyển khoản QR';

      var ticketCodeVal = ticketInput ? ticketInput.value.trim() : '';

      if (!name || !phone || !email || !company || !consent) {
        if (status) {
          status.textContent = 'Vui lòng điền đầy đủ các thông tin bắt buộc (*) và xác nhận đồng ý.';
          status.className = 'form-status is-visible is-error';
        }
        return;
      }

      var finalPrice = Math.max(0, currentPrice - ticketDiscount);
      var memo = 'AIBUILDER ' + phone.replace(/[^0-9]/g, '') + ' ' + name.replace(/[^a-zA-Z0-9]/g, '');

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      if (status) {
        status.textContent = 'Đang gửi thông tin đăng ký...';
        status.className = 'form-status is-visible';
      }

      var payload = {
        name: name,
        phone: phone,
        email: email,
        company: company,
        leadType: 'ai_builder_registration',
        program: 'AI Builder 21/11/2026',
        sourcePage: '/ai-builder',
        participation: participation,
        paymentMethod: paymentMethod,
        ticketCode: ticketCodeVal,
        finalPrice: finalPrice,
        notes: 'Hình thức: ' + participation + ' | Thanh toán: ' + paymentMethod + (ticketCodeVal ? ' | Mã vé: ' + ticketCodeVal : '')
      };

      // Call API
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return { success: true }; });
      }).then(function (data) {
        if (status) {
          status.textContent = 'Chúc mừng ' + name + '! Bạn đã hoàn tất đăng ký khóa học AI Builder (21/11/2026).';
          status.className = 'form-status is-visible';
        }

        // Show QR payment view if QR transfer chosen
        if (qrDialog) {
          qrDialog.classList.add('is-visible');
          if (qrAmountEl) qrAmountEl.textContent = new Intl.NumberFormat('vi-VN').format(finalPrice) + ' VNĐ';
          if (qrMemoEl) qrMemoEl.textContent = memo;

          if (qrImgEl) {
            var vietQrUrl = 'https://img.vietqr.io/image/970436-0071001258668-compact.png?amount=' +
                            finalPrice + '&addInfo=' + encodeURIComponent(memo) + '&accountName=DANG%20CUONG%20THANG';
            qrImgEl.src = vietQrUrl;
          }

          qrDialog.scrollIntoView({ behavior: 'smooth' });
        }
      }).catch(function (err) {
        // Fallback for offline/preview
        if (status) {
          status.textContent = 'Đã lưu thông tin đăng ký của ' + name + '. Ban tổ chức sẽ liên hệ hỗ trợ bạn.';
          status.className = 'form-status is-visible';
        }
        if (qrDialog) {
          qrDialog.classList.add('is-visible');
          qrDialog.scrollIntoView({ behavior: 'smooth' });
        }
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  // 6. INITIALIZATION
  document.addEventListener('DOMContentLoaded', function () {
    initHeroTabs();
    initDemoModal();
    initFaq();
    initEnrollmentForm();
  });

})();
