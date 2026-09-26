/* ============================================================================
   GO4AI homepage proposals — interaction layer
   No dependencies. Everything degrades to static, readable content if JS
   is unavailable: reveal targets are only hidden once this file marks the
   document as JS-enabled.
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // NOTE: the .has-js class is added by a tiny inline script in <head> (before the
  // stylesheet) so reveal targets never flash visible-then-hidden on first paint.

  /* ---------------------------------------------------- 1. REVEAL ON SCROLL */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal], [data-stagger], [data-pair-stagger]');
    if (!targets.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is--in', 'is--revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is--in');
          setTimeout(function () {
            entry.target.classList.add('is--revealed');
          }, 600);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------- 2. STICKY HEADER */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is--stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------- 3. MOBILE NAV */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('mobile-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is--open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
  }

  /* ------------------------------------------------------------ 4. SCROLL BAR */
  function initScrub() {
    var meter = document.getElementById('scrub-meter');
    if (!meter || reduce) return;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      meter.style.width = pct.toFixed(2) + '%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ------------------------------------------------------------- 5. FAQ */
  /* The panel animates through CSS (grid-template-rows). JS only toggles the
     class and mirrors it into aria-expanded. */
  function initFaq() {
    document.querySelectorAll('.faq').forEach(function (faq) {
      faq.querySelectorAll('.faq__item').forEach(function (item) {
        var btn = item.querySelector('.faq__q');
        var panel = item.querySelector('.faq__a');
        if (!btn || !panel) return;

        panel.setAttribute('role', 'region');
        btn.setAttribute('aria-expanded', item.classList.contains('is--open') ? 'true' : 'false');

        btn.addEventListener('click', function () {
          var open = item.classList.toggle('is--open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
    });
  }

  /* -------------------------------------------------- 6. STICKY STEPPER (HIW) */
  /* Scroll-driven rather than IntersectionObserver-driven. MEASURED: an
     IntersectionObserver created against these blocks delivered zero callbacks
     in the headless probe, so the active marker never moved. Reading 7 rects per
     scroll event is cheap, deterministic, and works with no observer at all.
     The active block is the one crossing the viewport's middle line; if none
     crosses it, the one whose centre is nearest. */
  function initStepper() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.hiw-block'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.hiw__progress-item'));
    if (!blocks.length) return;

    function apply(index) {
      blocks.forEach(function (b, j) { b.classList.toggle('is--active', j === index); });
      items.forEach(function (it, j) {
        it.classList.toggle('is--active', j === index);
        it.classList.toggle('is--done', j < index);
      });
    }

    function update() {
      var mid = window.innerHeight * 0.5;
      var best = 0, bestDist = Infinity, straddles = -1;

      for (var i = 0; i < blocks.length; i++) {
        var r = blocks[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { straddles = i; break; }
        var d = Math.abs((r.top + r.height / 2) - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      }

      var index = straddles >= 0 ? straddles : best;
      if (index !== update.current) {
        update.current = index;
        apply(index);
      }
    }
    update.current = -1;

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    // Clicking a progress item jumps to its block.
    items.forEach(function (it, i) {
      it.style.cursor = 'pointer';
      it.addEventListener('click', function () {
        if (!blocks[i]) return;
        blocks[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  /* -------------------------------------------------- 7. IMPACT ACCENT RING */
  function initImpact() {
    var accent = document.querySelector('.impact-accent');
    if (!accent) return;
    if (reduce || !('IntersectionObserver' in window)) {
      accent.classList.add('is--in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          accent.classList.add('is--in');
          io.unobserve(accent);
        }
      });
    }, { threshold: 0.3 });
    io.observe(accent);
  }

  /* ------------------------------------------------------- 8. LOGO MARQUEE */
  /* Duplicate the track once so the -50% keyframe loops seamlessly. */
  function initMarquee() {
    document.querySelectorAll('.logos__track').forEach(function (track) {
      if (track.dataset.cloned === '1') return;
      track.innerHTML += track.innerHTML;
      track.dataset.cloned = '1';
    });
  }

  /* -------------------------------------------------------- 9. COUNT-UP STATS */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        if (el.getAttribute('data-counted')) return;

        var raw = el.getAttribute('data-count');
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var target = parseFloat(raw);
        if (isNaN(target)) return;

        var start = performance.now();
        var dur = 1100;
        (function tick(now) {
          var t = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          var val = Math.round(target * eased);
          var formattedVal = val >= 1000 ? val.toLocaleString('vi-VN') : val;
          el.textContent = prefix + formattedVal + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else {
            var finalVal = target >= 1000 ? target.toLocaleString('vi-VN') : raw;
            el.textContent = prefix + finalVal + suffix;
          }
        })(start);
      });
    }, { threshold: 0.15 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------ 9.5. BEFORE / AFTER PAIRS */
  function initBeforeAfter() {
    var grid = document.querySelector('.benefits-grid');
    if (!grid) return;
    var items = grid.querySelectorAll('.benefits__item[data-pair]');
    if (!items.length) return;

    function activate(pairId) {
      grid.classList.add('has--active-pair');
      items.forEach(function (item) {
        if (item.getAttribute('data-pair') === pairId) {
          item.classList.add('is--active');
        } else {
          item.classList.remove('is--active');
        }
      });
    }

    function deactivate() {
      grid.classList.remove('has--active-pair');
      items.forEach(function (item) {
        item.classList.remove('is--active');
      });
    }

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        var pairId = item.getAttribute('data-pair');
        activate(pairId);
      });
      item.addEventListener('mouseleave', function () {
        deactivate();
      });

      // Mobile tap support: tap toggles active
      item.addEventListener('click', function () {
        var pairId = item.getAttribute('data-pair');
        if (item.classList.contains('is--active')) {
          deactivate();
        } else {
          activate(pairId);
        }
      });
    });

    // Tap outside grid clears active pair
    document.addEventListener('click', function (e) {
      if (!grid.contains(e.target)) {
        deactivate();
      }
    });
  }

  /* ------------------------------------------------ 9.6. PROGRAM TRACKS */
  function initProgramTracks() {
    var container = document.querySelector('.tracks');
    if (!container) return;
    var cards = container.querySelectorAll('.track');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        if (canHover) {
          container.classList.add('has--active-track');
          card.classList.add('is--active');
        }
      });
      card.addEventListener('mouseleave', function () {
        if (canHover) {
          container.classList.remove('has--active-track');
          card.classList.remove('is--active');
        }
      });
    });
  }

  /* ------------------------------------------------ 9.7. LEARNING TIMELINE */
  function initLearningTimeline() {
    var section = document.getElementById('cach-hoc');
    if (!section) return;
    var container = section.querySelector('.timeline');
    if (!container) return;
    var steps = container.querySelectorAll('.timeline__step');
    if (!steps.length) return;
    var fillLine = container.querySelector('.timeline__line-fill');
    var progressCurrent = section.querySelector('.timeline-meta__current');

    var hoveredIndex = -1;
    var scrollIndex = 0;

    function getMarkerOffset(stepEl) {
      var marker = stepEl.querySelector('.timeline__marker');
      if (!marker) return 0;
      var cRect = container.getBoundingClientRect();
      var mRect = marker.getBoundingClientRect();
      return (mRect.top + mRect.height / 2) - cRect.top;
    }

    function applyActive(index) {
      if (index < 0 || index >= steps.length) return;
      steps.forEach(function (step, i) {
        step.classList.toggle('is--active', i === index);
        step.classList.toggle('is--past', i < index);
      });

      if (progressCurrent) {
        progressCurrent.textContent = (index + 1 < 10 ? '0' : '') + (index + 1);
      }

      if (fillLine && steps[0]) {
        var startOffset = getMarkerOffset(steps[0]);
        var targetOffset = getMarkerOffset(steps[index]);
        var fillHeight = Math.max(0, targetOffset - startOffset);
        fillLine.style.height = fillHeight + 'px';
      }
    }

    function updateOnScroll() {
      if (hoveredIndex >= 0) return;
      var sRect = section.getBoundingClientRect();
      if (sRect.bottom < 0 || sRect.top > window.innerHeight) return;

      var trigger = window.innerHeight * 0.45;
      var activeIdx = 0;

      for (var i = 0; i < steps.length; i++) {
        var r = steps[i].getBoundingClientRect();
        if (r.top <= trigger) {
          activeIdx = i;
        }
      }

      scrollIndex = activeIdx;
      applyActive(scrollIndex);
    }

    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () {
        if (canHover) {
          hoveredIndex = i;
          applyActive(i);
        }
      });
      step.addEventListener('mouseleave', function () {
        if (canHover) {
          hoveredIndex = -1;
          applyActive(scrollIndex);
        }
      });
      step.addEventListener('click', function () {
        scrollIndex = i;
        applyActive(i);
      });
    });

    window.addEventListener('scroll', updateOnScroll, { passive: true });
    window.addEventListener('resize', function () {
      applyActive(hoveredIndex >= 0 ? hoveredIndex : scrollIndex);
    });

    updateOnScroll();
  }

  /* ------------------------------------------------ 9.8. AFTER TRAINING (SECTION 10) */
  function initAfterTraining() {
    var section = document.getElementById('sau-dao-tao');
    if (!section) return;

    // 1. Diagnostic Cards Interaction
    var diagGrid = section.querySelector('.diag-grid');
    if (diagGrid) {
      var diagCards = diagGrid.querySelectorAll('.diag-card');
      var activeDiag = null;

      function setDiagActive(card) {
        if (activeDiag === card) {
          activeDiag.classList.remove('is--active');
          diagGrid.classList.remove('has--active-card');
          activeDiag = null;
          return;
        }
        if (activeDiag) {
          activeDiag.classList.remove('is--active');
        }
        if (card) {
          card.classList.add('is--active');
          diagGrid.classList.add('has--active-card');
          activeDiag = card;
        } else {
          diagGrid.classList.remove('has--active-card');
          activeDiag = null;
        }
      }

      diagCards.forEach(function (card) {
        card.addEventListener('mouseenter', function () {
          if (canHover && !activeDiag) {
            diagGrid.classList.add('has--active-card');
          }
        });
        card.addEventListener('mouseleave', function () {
          if (canHover && !activeDiag) {
            diagGrid.classList.remove('has--active-card');
          }
        });
        card.addEventListener('click', function (e) {
          e.stopPropagation();
          setDiagActive(card);
        });
      });

      document.addEventListener('click', function (e) {
        if (!diagGrid.contains(e.target) && activeDiag) {
          setDiagActive(null);
        }
      });
    }

    // 2. Interactive Journey Pipeline
    var journeySection = section.querySelector('#journey-flow');
    if (journeySection) {
      var railFill = journeySection.querySelector('.journey-track__rail-fill');
      var nodes = journeySection.querySelectorAll('.journey-node');
      var currCounter = journeySection.querySelector('.journey-section__curr');

      if (nodes.length && railFill) {
        var journeyActiveIndex = 0;
        var isUserHovering = false;

        function setJourneyActive(index) {
          if (index < 0) index = 0;
          if (index >= nodes.length) index = nodes.length - 1;

          nodes.forEach(function (node, i) {
            node.classList.toggle('is--active', i === index);
            node.classList.toggle('is--past', i < index);
          });

          if (currCounter) {
            currCounter.textContent = (index + 1 < 10 ? '0' : '') + (index + 1);
          }

          var progressRatio = nodes.length > 1 ? (index / (nodes.length - 1)) : 1;
          var isVertical = window.innerWidth <= 767;

          if (isVertical) {
            railFill.style.width = '100%';
            railFill.style.height = (progressRatio * 100) + '%';
          } else {
            railFill.style.height = '100%';
            railFill.style.width = (progressRatio * 100) + '%';
          }
        }

        function updateJourneyScroll() {
          if (isUserHovering) return;
          var rect = journeySection.getBoundingClientRect();
          var winH = window.innerHeight || document.documentElement.clientHeight;

          if (rect.top < winH * 0.75 && rect.bottom > winH * 0.2) {
            var scrollProgress = (winH * 0.75 - rect.top) / (rect.height + winH * 0.4);
            scrollProgress = Math.max(0, Math.min(1, scrollProgress));
            var targetIdx = Math.floor(scrollProgress * nodes.length);
            if (targetIdx >= nodes.length) targetIdx = nodes.length - 1;

            if (targetIdx !== journeyActiveIndex) {
              journeyActiveIndex = targetIdx;
              setJourneyActive(journeyActiveIndex);
            }
          }
        }

        nodes.forEach(function (node, i) {
          node.addEventListener('mouseenter', function () {
            isUserHovering = true;
            setJourneyActive(i);
          });
          node.addEventListener('mouseleave', function () {
            isUserHovering = false;
            setJourneyActive(journeyActiveIndex);
          });
          node.addEventListener('click', function () {
            journeyActiveIndex = i;
            setJourneyActive(i);
          });
        });

        window.addEventListener('scroll', updateJourneyScroll, { passive: true });
        window.addEventListener('resize', function () {
          setJourneyActive(journeyActiveIndex);
        });

        setJourneyActive(0);
        updateJourneyScroll();
      }
    }
  }

  /* ------------------------------------------- 14. PROFILE MODAL / FULL-SCREEN (LUCAS ĐẶNG) */
  function initProfileModal() {
    var modal = document.getElementById('profile-modal');
    var closeBtn = document.getElementById('profile-modal-close') || document.getElementById('profile-close');
    var actionCta = document.getElementById('profile-action-cta');
    var triggers = document.querySelectorAll('[data-open-profile], a[href="#profile-lucas"]');
    var lastFocused = null;
    var prevScrollY = 0;

    if (!modal) return;

    function openModal(e) {
      if (e) e.preventDefault();

      // Remember scroll position on the page before opening
      prevScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

      // If mobile nav is open, close it cleanly
      var mobileNav = document.getElementById('mobile-nav');
      var navToggle = document.getElementById('nav-toggle');
      if (mobileNav && mobileNav.classList.contains('is--open')) {
        mobileNav.classList.remove('is--open');
        if (navToggle) {
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Mở menu');
        }
      }

      lastFocused = document.activeElement;
      modal.removeAttribute('hidden');
      void modal.offsetWidth; // Force reflow for animation
      modal.classList.add('is--open');
      modal.scrollTop = 0; // Reset profile scroll to top
      document.documentElement.classList.add('has--profile-open', 'has--modal-open');
      document.body.classList.add('has--profile-open', 'has--modal-open');

      if (closeBtn) {
        closeBtn.focus();
      }
    }

    function closeModal(skipScrollRestore) {
      if (!modal.classList.contains('is--open')) return;
      modal.classList.remove('is--open');
      document.documentElement.classList.remove('has--profile-open', 'has--modal-open');
      document.body.classList.remove('has--profile-open', 'has--modal-open');

      setTimeout(function () {
        modal.setAttribute('hidden', '');
        if (!skipScrollRestore) {
          try {
            window.scrollTo({ top: prevScrollY, behavior: 'instant' });
          } catch (err) {
            window.scrollTo(0, prevScrollY);
          }
        }
        if (lastFocused && typeof lastFocused.focus === 'function') {
          lastFocused.focus();
        }
      }, 260);
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', openModal);
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { closeModal(false); });

    if (actionCta) {
      actionCta.addEventListener('click', function () {
        closeModal(true);
        setTimeout(function () {
          var contactSection = document.getElementById('lien-he');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 280);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is--open')) {
        closeModal(false);
      }
    });
  }

  /* ------------------------------------------------------------- 10. BOOT */
  function boot() {
    initReveal();
    initHeader();
    initMobileNav();
    initScrub();
    initFaq();
    initStepper();
    initImpact();
    initMarquee();
    initCounters();
    initBeforeAfter();
    initProgramTracks();
    initLearningTimeline();
    initAfterTraining();
    initProfileModal();
    initVideoEmbedFallback();
  }

  /* ------------------------------------------------------------- 9b. VIDEO FALLBACK */
  function initVideoEmbedFallback() {
    if (window.location.protocol === 'file:') {
      document.documentElement.classList.add('is-file-protocol');
    }

    var embeds = document.querySelectorAll('.case-video-embed');
    embeds.forEach(function (embed) {
      var iframe = embed.querySelector('iframe');
      if (iframe) {
        iframe.addEventListener('error', function () {
          embed.classList.add('has-video-error');
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
