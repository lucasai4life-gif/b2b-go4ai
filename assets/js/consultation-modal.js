/* ============================================================
   CONSULTATION MODAL — JavaScript (Shared, Event-delegated)
   File: assets/js/consultation-modal.js
   
   Opens modal on:
   - Any [data-consultation-open] attribute
   - Any link to "#lien-he" or "index.html#lien-he"
     with text containing: Contact us / Tư vấn / contact
   ============================================================ */
(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────── */
  var POLICY_URL  = 'chinh-sach-bao-ve-du-lieu.html';
  var OVERLAY_ID  = 'consult-overlay';
  var OPEN_CLASS  = 'is--open';
  var ERROR_CLASS = 'is--error';
  var VISIBLE_CLS = 'is--visible';

  /* ── Modal HTML ─────────────────────────────────────────────────────── */
  var MODAL_HTML = [
    '<div class="consult-overlay" id="' + OVERLAY_ID + '" role="dialog" aria-modal="true" aria-labelledby="consult-title" tabindex="-1">',
    '  <div class="consult-dialog" id="consult-dialog">',
    '    <div class="consult-dialog__inner">',

    /* Head */
    '      <div class="consult-dialog__head">',
    '        <div class="consult-dialog__head-text">',
    '          <p class="consult-eyebrow">ENTERPRISE AI CONSULTATION</p>',
    '          <h2 class="consult-title" id="consult-title">Trao đổi nhu cầu cùng GO4AI</h2>',
    '          <p class="consult-desc">Chia sẻ một vài thông tin về nhu cầu của doanh nghiệp. GO4AI sẽ liên hệ để trao đổi và đề xuất hướng triển khai phù hợp.</p>',
    '        </div>',
    '        <button class="consult-close" id="consult-close" aria-label="Đóng" type="button">',
    '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    '        </button>',
    '      </div>',

    '      <hr class="consult-sep">',

    /* Success state */
    '      <div class="consult-success" id="consult-success" aria-live="polite">',
    '        <div class="consult-success__icon">',
    '          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    '        </div>',
    '        <h3 class="consult-success__title">GO4AI đã nhận được yêu cầu của bạn.</h3>',
    '        <p class="consult-success__desc">Đội ngũ GO4AI sẽ liên hệ để trao đổi thêm về nhu cầu và bài toán doanh nghiệp cung cấp.</p>',
    '        <button class="consult-success__close" id="consult-success-close" type="button">Đóng</button>',
    '      </div>',

    /* Form */
    '      <form class="consult-form" id="consult-form" novalidate>',

    /* Row 1 */
    '        <div class="consult-row">',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-name">Họ và tên <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="consult-input" id="cf-name" name="name" type="text" autocomplete="name" required placeholder="Nguyễn Văn A">',
    '            <span class="consult-error" id="cf-name-err" role="alert"></span>',
    '          </div>',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-company">Doanh nghiệp / Tổ chức <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="consult-input" id="cf-company" name="company" type="text" required placeholder="Tên công ty">',
    '            <span class="consult-error" id="cf-company-err" role="alert"></span>',
    '          </div>',
    '        </div>',

    /* Row 2 */
    '        <div class="consult-row">',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-role">Chức vụ / Bộ phận</label>',
    '            <input class="consult-input" id="cf-role" name="role" type="text" autocomplete="organization-title" placeholder="VD: CEO, HR, Sales, L&D...">',
    '          </div>',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-email">Email công việc <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="consult-input" id="cf-email" name="email" type="email" autocomplete="email" required placeholder="you@company.com">',
    '            <span class="consult-error" id="cf-email-err" role="alert"></span>',
    '          </div>',
    '        </div>',

    /* Row 3 */
    '        <div class="consult-row">',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="consult-input" id="cf-phone" name="phone" type="tel" autocomplete="tel" required placeholder="0988 xxx xxx">',
    '            <span class="consult-error" id="cf-phone-err" role="alert"></span>',
    '          </div>',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-size">Quy mô đội ngũ</label>',
    '            <select class="consult-select" id="cf-size" name="companySize">',
    '              <option value="">— Chọn quy mô —</option>',
    '              <option value="<20">Dưới 20</option>',
    '              <option value="20-50">20–50</option>',
    '              <option value="51-200">51–200</option>',
    '              <option value="201-500">201–500</option>',
    '              <option value="500+">500+</option>',
    '            </select>',
    '          </div>',
    '        </div>',

    /* Interest — full width checkboxes */
    '        <div class="consult-row consult-row--full">',
    '          <div class="consult-field">',
    '            <label class="consult-label">Nhu cầu quan tâm <span class="req" aria-hidden="true">*</span></label>',
    '            <div class="consult-checkgroup" id="cf-interest-group">',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="Đào tạo AI cho doanh nghiệp"><span>Đào tạo AI cho doanh nghiệp</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="AI cho quản lý & lãnh đạo"><span>AI cho quản lý &amp; lãnh đạo</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="AI theo phòng ban / chức năng"><span>AI theo phòng ban / chức năng</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="AI Workflow & Automation"><span>AI Workflow &amp; Automation</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="AI Agent"><span>AI Agent</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="Tư vấn & triển khai giải pháp AI"><span>Tư vấn &amp; triển khai giải pháp AI</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="AI Enterprise / Quản trị vận hành"><span>AI Enterprise / Quản trị vận hành</span></label>',
    '              <label class="consult-check-item"><input type="checkbox" name="interest" value="Nhu cầu khác"><span>Nhu cầu khác</span></label>',
    '            </div>',
    '            <span class="consult-error" id="cf-interest-err" role="alert"></span>',
    '          </div>',
    '        </div>',

    /* Problem — full width */
    '        <div class="consult-row consult-row--full">',
    '          <div class="consult-field">',
    '            <label class="consult-label" for="cf-problem">Bài toán doanh nghiệp đang muốn giải quyết</label>',
    '            <textarea class="consult-textarea" id="cf-problem" name="problem" rows="4" placeholder="Mô tả ngắn vấn đề, quy trình hoặc mục tiêu doanh nghiệp muốn cải thiện bằng AI..."></textarea>',
    '          </div>',
    '        </div>',

    /* Privacy Consent */
    '        <div class="consult-consent" id="cf-consent-wrap">',
    '          <input type="checkbox" id="cf-consent" name="privacyConsent" required>',
    '          <label class="consult-consent-label" for="cf-consent">',
    '            Tôi đồng ý để GO4AI thu thập và xử lý thông tin tôi cung cấp theo ',
    '            <a href="' + POLICY_URL + '" target="_blank" rel="noopener noreferrer">Chính sách bảo vệ dữ liệu cá nhân</a>.',
    '          </label>',
    '        </div>',
    '        <span class="consult-error" id="cf-consent-err" role="alert"></span>',

    /* Footer */
    '        <div class="consult-footer">',
    '          <span class="consult-error" id="consult-submit-err" role="alert" style="display:none; margin-bottom: 1rem; text-align: center;"></span>',
    '          <button class="consult-submit" id="consult-submit" type="submit">Gửi yêu cầu tư vấn →</button>',
    '          <p class="consult-submit-note">GO4AI sẽ sử dụng thông tin này để liên hệ và trao đổi về nhu cầu của doanh nghiệp.</p>',
    '        </div>',

    '      </form>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  /* ── State ──────────────────────────────────────────────────────────── */
  var overlay    = null;
  var lastOpener = null;
  var sourcePage = window.location.pathname.split('/').pop() || 'index.html';

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.add(VISIBLE_CLS);
  }
  function clearError(el) {
    el.textContent = '';
    el.classList.remove(VISIBLE_CLS);
  }
  function markFieldError(input, errEl, msg) {
    input.classList.add(ERROR_CLASS);
    showError(errEl, msg);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errEl.id);
  }
  function clearFieldError(input, errEl) {
    input.classList.remove(ERROR_CLASS);
    clearError(errEl);
    input.removeAttribute('aria-invalid');
  }

  /* ── Inject modal once ───────────────────────────────────────────────── */
  function injectModal() {
    if (document.getElementById(OVERLAY_ID)) {
      overlay = document.getElementById(OVERLAY_ID);
      return;
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = MODAL_HTML;
    document.body.appendChild(tmp.firstChild);
    overlay = document.getElementById(OVERLAY_ID);
    bindModalEvents();
  }

  /* ── Focus Trap ──────────────────────────────────────────────────────── */
  function getFocusable() {
    return qsa(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      overlay
    );
  }
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var els = getFocusable();
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ── Open / Close ────────────────────────────────────────────────────── */
  function openModal(openerEl, sourceCta) {
    lastOpener = openerEl || null;
    injectModal();

    /* Reset form & success state */
    var form     = qs('#consult-form');
    var success  = qs('#consult-success');
    if (form)    { form.reset(); form.style.display = ''; }
    if (success) { success.classList.remove(VISIBLE_CLS); }

    /* Clear all errors */
    qsa('.consult-error', overlay).forEach(function (e) { clearError(e); });
    qsa('.' + ERROR_CLASS, overlay).forEach(function (e) { e.classList.remove(ERROR_CLASS); });

    /* Store source CTA for payload */
    overlay.dataset.sourceCta  = sourceCta  || (openerEl ? (openerEl.textContent || '').trim() : '');
    overlay.dataset.sourcePage = sourcePage;

    document.body.classList.add('consult-open');
    overlay.classList.add(OPEN_CLASS);

    /* Focus first field */
    setTimeout(function () {
      var first = qs('input, select, textarea', overlay);
      if (first) first.focus();
    }, 280);

    /* Key handlers */
    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove(OPEN_CLASS);
    document.body.classList.remove('consult-open');
    document.removeEventListener('keydown', onKeyDown);
    overlay.removeEventListener('keydown', trapFocus);

    /* Return focus */
    if (lastOpener) {
      try { lastOpener.focus(); } catch (e) {}
    }
    lastOpener = null;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* ── Validation ──────────────────────────────────────────────────────── */
  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function validatePhone(v) {
    return /^[\d\s\+\-\(\)]{7,20}$/.test(v.replace(/\s/g, ''));
  }

  function validate(form) {
    var ok = true;

    /* Name */
    var nameInput = qs('#cf-name', form);
    var nameErr   = qs('#cf-name-err');
    if (!nameInput.value.trim()) {
      markFieldError(nameInput, nameErr, 'Vui lòng nhập họ và tên.');
      ok = false;
    } else { clearFieldError(nameInput, nameErr); }

    /* Company */
    var coInput = qs('#cf-company', form);
    var coErr   = qs('#cf-company-err');
    if (!coInput.value.trim()) {
      markFieldError(coInput, coErr, 'Vui lòng nhập tên doanh nghiệp hoặc tổ chức.');
      ok = false;
    } else { clearFieldError(coInput, coErr); }

    /* Email */
    var emInput = qs('#cf-email', form);
    var emErr   = qs('#cf-email-err');
    if (!emInput.value.trim()) {
      markFieldError(emInput, emErr, 'Vui lòng nhập email.');
      ok = false;
    } else if (!validateEmail(emInput.value.trim())) {
      markFieldError(emInput, emErr, 'Email không hợp lệ. Vui lòng kiểm tra lại.');
      ok = false;
    } else { clearFieldError(emInput, emErr); }

    /* Phone */
    var phInput = qs('#cf-phone', form);
    var phErr   = qs('#cf-phone-err');
    if (!phInput.value.trim()) {
      markFieldError(phInput, phErr, 'Vui lòng nhập số điện thoại.');
      ok = false;
    } else if (!validatePhone(phInput.value.trim())) {
      markFieldError(phInput, phErr, 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
      ok = false;
    } else { clearFieldError(phInput, phErr); }

    /* Interest (checkbox group — at least 1 required) */
    var iGroup    = qs('#cf-interest-group', form);
    var iChecked  = qsa('input[name="interest"]:checked', form);
    var iErr      = qs('#cf-interest-err');
    if (!iChecked.length) {
      iGroup.classList.add(ERROR_CLASS);
      showError(iErr, 'Vui lòng chọn ít nhất một nhu cầu quan tâm.');
      ok = false;
    } else {
      iGroup.classList.remove(ERROR_CLASS);
      clearError(iErr);
    }

    /* Privacy consent */
    var consentInput = qs('#cf-consent', form);
    var consentWrap  = qs('#cf-consent-wrap');
    var consentErr   = qs('#cf-consent-err');
    if (!consentInput.checked) {
      consentWrap.classList.add(ERROR_CLASS);
      showError(consentErr, 'Vui lòng đồng ý với Chính sách bảo vệ dữ liệu cá nhân trước khi gửi yêu cầu.');
      ok = false;
    } else {
      consentWrap.classList.remove(ERROR_CLASS);
      clearError(consentErr);
    }

    return ok;
  }

  /* ── Submit ──────────────────────────────────────────────────────────── */
  function handleSubmit(form) {
    if (!validate(form)) {
      /* Scroll to first error */
      var firstErr = qs('.' + ERROR_CLASS, overlay);
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Build payload */
    var interests = qsa('input[name="interest"]:checked', form).map(function (cb) {
      return cb.value;
    });

    var payload = {
      name:           (qs('#cf-name',    form).value || '').trim(),
      company:        (qs('#cf-company', form).value || '').trim(),
      role:           (qs('#cf-role',    form).value || '').trim(),
      email:          (qs('#cf-email',   form).value || '').trim(),
      phone:          (qs('#cf-phone',   form).value || '').trim(),
      companySize:    (qs('#cf-size',    form).value || ''),
      interest:       interests,
      problem:        (qs('#cf-problem', form).value || '').trim(),
      privacyConsent: true,
      sourcePage:     overlay.dataset.sourcePage || sourcePage,
      sourceCta:      overlay.dataset.sourceCta  || ''
    };

    var submitBtn = qs('#consult-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    /* ── Integration hook ────────────────────────────────────────────────
       No backend endpoint exists yet. When a backend is ready:
       1. Replace the stub below with a real fetch() call.
       2. On success: show success state.
       3. On network/server error: re-enable button, show error message.
       
       Example (replace stub with this):
       
       fetch('/api/consultation', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       })
       .then(function(res) {
         if (!res.ok) throw new Error('Server error: ' + res.status);
         return res.json();
       })
       .then(function() { showSuccess(); })
       .catch(function(err) {
         submitBtn.disabled = false;
         submitBtn.textContent = 'Gửi yêu cầu tư vấn →';
         showSubmitError('Gửi thất bại. Vui lòng thử lại hoặc liên hệ trực tiếp GO4AI.');
       });
    ─────────────────────────────────────────────────────────────────── */

    // Capture UTM and referrer from current page URL
    var urlParams = new URLSearchParams(window.location.search);
    payload.utm_source   = urlParams.get('utm_source')   || undefined;
    payload.utm_medium   = urlParams.get('utm_medium')   || undefined;
    payload.utm_campaign = urlParams.get('utm_campaign') || undefined;
    payload.utm_content  = urlParams.get('utm_content')  || undefined;
    payload.referrer     = document.referrer || undefined;
    payload.leadType     = 'enterprise_consultation';
    payload.source       = 'main_website';

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(d) { throw new Error(d.error || 'Server error ' + res.status); });
      return res.json();
    })
    .then(function() {
      showSuccess();
    })
    .catch(function(err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi yêu cầu tư vấn →';
      showSubmitError('Gửi thất bại. Vui lòng thử lại hoặc liên hệ trực tiếp GO4AI.');
    });
  }

  function showSubmitError(msg) {
    var errEl = qs('#consult-submit-err');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  }

  function showSuccess() {
    var form    = qs('#consult-form');
    var success = qs('#consult-success');
    if (form)    form.style.display = 'none';
    if (success) {
      success.classList.add(VISIBLE_CLS);
      var closeBtn = qs('#consult-success-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }
  }

  /* ── Bind Events ─────────────────────────────────────────────────────── */
  function bindModalEvents() {
    /* Close button */
    var closeBtn = qs('#consult-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    /* Success close button */
    var successClose = qs('#consult-success-close');
    if (successClose) successClose.addEventListener('click', closeModal);

    /* Overlay click (outside dialog) */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    /* Form submit */
    var form = qs('#consult-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSubmit(form);
      });

      /* Live clear-on-input for text fields */
      qsa('.consult-input, .consult-textarea', form).forEach(function (input) {
        input.addEventListener('input', function () {
          var errId = input.id + '-err';
          var errEl = document.getElementById(errId);
          if (errEl) clearFieldError(input, errEl);
        });
      });

      /* Live clear for checkboxes */
      qsa('input[name="interest"]', form).forEach(function (cb) {
        cb.addEventListener('change', function () {
          var group = qs('#cf-interest-group', form);
          var err   = qs('#cf-interest-err');
          if (group) group.classList.remove(ERROR_CLASS);
          if (err)   clearError(err);
        });
      });

      /* Live clear for consent */
      var consent = qs('#cf-consent', form);
      if (consent) {
        consent.addEventListener('change', function () {
          var wrap = qs('#cf-consent-wrap');
          var err  = qs('#cf-consent-err');
          if (wrap) wrap.classList.remove(ERROR_CLASS);
          if (err)  clearError(err);
        });
      }
    }
  }

  /* ── Should link open modal? ─────────────────────────────────────────── */
  function isConsultCta(el) {
    /* Explicit trigger */
    if (el.hasAttribute('data-consultation-open')) return true;

    /* Only intercept <a> tags */
    if (el.tagName !== 'A') return false;

    var href = (el.getAttribute('href') || '').trim();
    /* Must link to #lien-he (same or cross page) */
    if (href !== '#lien-he' && href !== 'index.html#lien-he' && !href.endsWith('/#lien-he')) return false;

    /* Match text patterns */
    var text = (el.textContent || '').trim().toLowerCase();
    var keywords = ['contact', 'tư vấn', 'tu van', 'liên hệ'];
    return keywords.some(function (k) { return text.indexOf(k) !== -1; });
  }

  /* ── Event Delegation on document ───────────────────────────────────── */
  function init() {
    document.addEventListener('click', function (e) {
      /* Walk up to find matching element */
      var el = e.target;
      var depth = 0;
      while (el && el !== document.body && depth < 4) {
        if (isConsultCta(el)) {
          e.preventDefault();
          openModal(el, (el.textContent || '').trim());
          return;
        }
        el = el.parentElement;
        depth++;
      }
    });

    /* Pre-inject modal markup on first user interaction for lower latency */
    var primed = false;
    function prime() {
      if (primed) return;
      primed = true;
      injectModal();
      document.removeEventListener('mousedown', prime);
      document.removeEventListener('touchstart', prime);
    }
    document.addEventListener('mousedown', prime, { passive: true });
    document.addEventListener('touchstart', prime, { passive: true });
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API (optional) ───────────────────────────────────────────── */
  window.GO4AIConsultModal = {
    open:  function (openerEl, cta) { openModal(openerEl, cta); },
    close: closeModal
  };
})();
