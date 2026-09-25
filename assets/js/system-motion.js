/* ============================================================================
   system-motion.js — High-Tech Enterprise AI System
   GO4AI / b2b-go4ai — v1.0.0

   Motion language: BOOT → PROCESS → OUTPUT → VERIFY
   Requires: GSAP 3.15+ + ScrollTrigger (already loaded before this file)
   Does NOT conflict with: motion-impact.js (bang-chung section only)
                           proposal.js (initCounters via data-count, initReveal)

   TRÁNH "rẻ tiền":
   - Không neon tím, không particle bay, không glitch nhấp nháy
   - Chỉ emerald (#08906c / #34d399) và neutral grays
   - Opacity và transform thôi — không text shadow quá mạnh
   ============================================================================ */
(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     0. GUARD — prefers-reduced-motion + GSAP check
  -------------------------------------------------------------------------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------------------------------
     1. UTILITY
  -------------------------------------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* --------------------------------------------------------------------------
     2. HERO BOOT SEQUENCE  (BOOT phase)
        Runs once on page load, ~1.4 s total, triggers via DOMContentLoaded.
        Elements:
          .hero__content .chips            → system status label
          .hero__title                     → headline reveal (mask + sweep)
          .text--grad                      → emerald light sweep
          .hero__sub                       → body text fade
          .hero__ctas, .hero__pipeline     → CTA + pipeline
          .hero__visual.hero-engine        → engine already has CSS animations,
                                             we just add a sequential "boot" class
  -------------------------------------------------------------------------- */
  
  function initHeroBoot() {
    if (reduce) return;

    var chips    = qs('.hero .chips');
    var titleEl  = qs('.hero__title');
    var grad     = titleEl && titleEl.querySelector('.text--grad');
    var line1    = titleEl; // we treat the whole h1 but split visually via CSS
    var sub      = qs('.hero__sub');
    var ctas     = qs('.hero__ctas');
    var pipe     = qs('.hero__pipeline');
    var heroEnv  = qs('.hero-env');
    var engine   = qs('.hero__visual.hero-engine');
    var core     = qs('#engine-core');
    var coreStatus = core && core.querySelector('.engine-core__status span:last-child');
    var roleCards  = qsa('.engine-card--role');
    var outCards   = qsa('.engine-card--output');
    var passport   = qs('#engine-passport');
    var proofItems = qsa('.engine__proof-item strong');

    if (!titleEl) return;

    // Initial hidden states
    gsap.set([chips, titleEl, sub, ctas, pipe].filter(Boolean), { autoAlpha: 0, y: 20 });
    if (chips) gsap.set(chips, { y: 0 });
    if (heroEnv) gsap.set(heroEnv, { autoAlpha: 0 });
    gsap.set(roleCards, { autoAlpha: 0, x: -16 });
    gsap.set(outCards,  { autoAlpha: 0, x: 16 });
    if (passport) gsap.set(passport, { autoAlpha: 0, scale: 0.9 });

    var tl = gsap.timeline({ delay: 0.1 });

    // T=0: hero environment grid fades in
    if (heroEnv) tl.to(heroEnv, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0);

    // T=0.25: eyebrow status label
    if (chips) tl.to(chips, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0.25);

    // T=0.5: headline line 1 reveals
    tl.to(titleEl, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.5);

    // T=0.85: emerald phrase scan
    if (grad) {
      tl.call(function() {
        grad.classList.add('hero-grad--sweep');
      }, null, 0.85);
    }

    // T=0.9: Core status changes to INITIALIZING
    if (core && coreStatus) {
      tl.call(function() {
        core.classList.add('engine-core--booting');
        coreStatus.textContent = 'SYSTEM INITIALIZING…';
      }, null, 0.9);
    }

    // T=1.1: Role cards slide in
    tl.to(roleCards, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, 1.1);

    // T=1.6: Sub text
    if (sub) tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.6);

    // T=1.8: Core becomes ACTIVE
    if (core && coreStatus) {
      tl.call(function() {
        core.classList.remove('engine-core--booting');
        core.classList.add('engine-core--live');
        coreStatus.textContent = 'AI ENABLEMENT ACTIVE';
      }, null, 1.8);
    }

    // T=2.0: Output cards blink on
    tl.to(outCards, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.12, ease: 'power2.out' }, 2.0);

    // T=2.5: AI Passport verify
    if (passport) {
      tl.to(passport, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, 2.5);
      tl.call(function() {
        passport.classList.add('engine-passport--verified');
      }, null, 2.8);
    }

    // T=2.6: CTAs + pipeline
    if (ctas) tl.to(ctas, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.6);
    if (pipe) tl.to(pipe, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 2.75);

    // T=3.0: Proof metrics count up
    if (!reduce && proofItems.length) {
      tl.call(function() {
        proofItems.forEach(function(el, i) {
          setTimeout(function() {
            var target = parseFloat(el.getAttribute('data-count'));
            var suffix = el.getAttribute('data-suffix') || '';
            if (isNaN(target)) return;
            var start = performance.now();
            var dur = 1400;
            (function tick(now) {
              var t = Math.min((now - start) / dur, 1);
              var eased = t < 0.6 ? (t / 0.6) * 0.8 : 0.8 + ((t - 0.6) / 0.4) * 0.2;
              var val = Math.round(target * eased);
              var formatted = val >= 1000 ? val.toLocaleString('vi-VN') : val;
              el.textContent = formatted + suffix;
              if (t < 1) requestAnimationFrame(tick);
              else {
                el.textContent = (target >= 1000 ? target.toLocaleString('vi-VN') : target) + suffix;
                el.setAttribute('data-counted', 'hero');
              }
            })(start);
          }, i * 200);
        });
      }, null, 3.0);
    }
  }

  function initHeroParallax() {
    if (reduce) return;
    if (window.matchMedia('(max-width: 991px)').matches) return;

    var heroSection = qs('.section.hero');
    if (!heroSection) return;

    var heroEnvGrid = qs('.hero-env__grid');
    var roleCol     = qs('.engine__col--input');
    var core        = qs('#engine-core');
    var outputCol   = qs('.engine__col--output');

    var mx = 0, my = 0;
    var tx = 0, ty = 0;
    var raf = null;

    heroSection.addEventListener('mousemove', function(e) {
      var rect = heroSection.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      my = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    }, { passive: true });

    heroSection.addEventListener('mouseleave', function() {
      mx = 0; my = 0;
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      tx = lerp(tx, mx, 0.06);
      ty = lerp(ty, my, 0.06);

      if (heroEnvGrid) {
        heroEnvGrid.style.transform = 'perspective(600px) rotateX(20deg) translate(' +
          (tx * 4) + 'px, ' + (ty * 2) + 'px)';
      }
      if (roleCol) {
        roleCol.style.transform = 'translate(' + (tx * 5) + 'px, ' + (ty * 3) + 'px)';
      }
      if (core) {
        core.style.transform = 'translate(' + (tx * 2) + 'px, ' + (ty * 2) + 'px)';
      }
      if (outputCol) {
        outputCol.style.transform = 'translate(' + (-tx * 4) + 'px, ' + (-ty * 2.5) + 'px)';
      }
      raf = requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { raf = requestAnimationFrame(tick); }
        else { cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.1 });
    io.observe(heroSection);
  }

  function initSectionIndexParallax() {
    if (reduce) return;
    var indices = qsa('.section-bg-index');
    indices.forEach(function(el) {
      gsap.to(el, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });
    });
  }


  /* --------------------------------------------------------------------------
     3. KINETIC TYPOGRAPHY — SECTION HEADINGS  (BOOT → PROCESS on scroll)
        Targets every section's .head__title / .title--l inside [data-reveal]
        Supplement the existing fade-in with mask+blur entrance and
        .text--grad gradient sweep.
  -------------------------------------------------------------------------- */
  function initKineticTypography() {
    if (reduce) return;

    /* Heading pairs: eyebrow (.chips) + title (.title--l or .head__title) */
    var headSections = qsa('[data-reveal] .title--l, [data-reveal] .head__title, .impact-section .title--l');

    headSections.forEach(function(title) {
      /* Skip hero (handled by boot sequence) */
      if (title.closest('.hero')) return;

      var grad = title.querySelector('.text--grad');

      ScrollTrigger.create({
        trigger: title,
        start: 'top 82%',
        once: true,
        onEnter: function() {
          /* Title reveal: from below + blur → sharp */
          gsap.fromTo(title,
            { autoAlpha: 0, y: 28, filter: 'blur(6px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72, ease: 'power3.out' }
          );
          /* Gradient sweep for .text--grad — add class 200ms after heading visible */
          if (grad) {
            setTimeout(function() {
              grad.classList.add('heading-grad--sweep');
            }, 200);
          }
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. DATA COUNTER UPGRADE  (OUTPUT phase)
        Replaces proposal.js initCounters behavior with:
        - digital counter easing (fast start, slow end)
        - emerald pulse when counter hits final value
        - scanline effect on metric boxes
        Works by hijacking data-count nodes BEFORE proposal.js fires,
        OR by deferring to after DOMContentLoaded.
  -------------------------------------------------------------------------- */
  function initSystemCounters() {
    /* We augment, not replace — add class to trigger CSS scanline effect */
    var nodes = qsa('[data-count]');
    if (!nodes.length) return;

    nodes.forEach(function(el) {
      /* Mark as system-counter for CSS styling */
      el.classList.add('sys-counter');

      var observed = false;
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting || observed) return;
          observed = true;
          io.disconnect();

          var target = parseFloat(el.getAttribute('data-count'));
          if (isNaN(target)) return;

          var prefix = el.getAttribute('data-prefix') || '';
          var suffix = el.getAttribute('data-suffix') || '';
          var dur = target >= 1000 ? 1500 : 1100;
          var start = performance.now();

          /* Cancel proposal.js counter by marking done early */
          el.setAttribute('data-counted', 'sys');

          function tick(now) {
            var t = Math.min((now - start) / dur, 1);
            /* Custom easing: fast then slow — matches digital counter feel */
            var eased = t < 0.7
              ? (t / 0.7) * 0.85                  /* fast segment */
              : 0.85 + ((t - 0.7) / 0.3) * 0.15;  /* slow finish */
            var val = Math.round(target * eased);
            var formatted = val >= 1000 ? val.toLocaleString('vi-VN') : val;
            el.textContent = prefix + formatted + suffix;

            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              var finalVal = target >= 1000 ? target.toLocaleString('vi-VN') : target;
              el.textContent = prefix + finalVal + suffix;

              if (!reduce) {
                /* Emerald pulse when done */
                el.classList.add('sys-counter--done');
                /* Scanline pass on nearest metric box */
                var box = el.closest('.sys-metric-box, .impact-content');
                if (box) {
                  box.classList.add('sys-metric--scan');
                  setTimeout(function() { box.classList.remove('sys-metric--scan'); }, 900);
                }
              }
            }
          }

          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });

      io.observe(el);
    });
  }

  /* --------------------------------------------------------------------------
     5. CIRCUIT / DATA-LINE WORKFLOW ANIMATIONS  (PROCESS phase)
        Targets .cs-case__workflow chips — draws a "data pulse" between steps.
        Also targets .journey-track__rail (dark panel journey pipeline).
  -------------------------------------------------------------------------- */
  function initCircuitAnimations() {
    if (reduce) return;

    /* 5.1 Case workflow chips — sequential step reveal */
    var workflows = qsa('.cs-case__workflow, .case-flow');
    workflows.forEach(function(wf) {
      var steps = qsa('.cs-case__workflow-chip, .case-flow__pill', wf);
      var seps  = qsa('.cs-case__workflow-sep, .case-flow__sep', wf);
      if (!steps.length) return;

      /* Initially hide all except first */
      gsap.set(steps, { autoAlpha: 0, x: -8 });
      gsap.set(seps,  { autoAlpha: 0 });

      ScrollTrigger.create({
        trigger: wf,
        start: 'top 85%',
        once: true,
        onEnter: function() {
          var tl = gsap.timeline();
          steps.forEach(function(step, i) {
            tl.to(step, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power2.out' }, i * 0.12);
            if (seps[i]) {
              tl.to(seps[i], { autoAlpha: 1, duration: 0.18, ease: 'none' }, i * 0.12 + 0.14);
            }
          });
        }
      });
    });

    /* 5.2 Journey pipeline rail draw — add CSS class to trigger rail-fill animation */
    var journeyTrack = qs('.journey-track');
    if (journeyTrack) {
      ScrollTrigger.create({
        trigger: journeyTrack,
        start: 'top 80%',
        once: true,
        onEnter: function() {
          journeyTrack.classList.add('journey-track--boot');
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     6. SECTION TRANSITION LINES  (VERIFY phase)
        Thin horizontal emerald rule between sections as they enter viewport.
  -------------------------------------------------------------------------- */
  function initSectionTransitions() {
    if (reduce) return;

    var sections = qsa('section[id]:not(#hero)');
    sections.forEach(function(sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 96%',
        once: true,
        onEnter: function() {
          sec.classList.add('section--in');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. CARDS — INTELLIGENT MODULE reveal  (PROCESS phase)
        .bento__item, .module__item, .benefits__item, .cs-card → lift in
  -------------------------------------------------------------------------- */
  function initCardReveals() {
    if (reduce) return;

    var cardGroups = qsa(
      '.bento__grid .bento__item, .benefits-grid .benefits__item, ' +
      '.module__row .module__item, .case-study-list .cs-card'
    );

    cardGroups.forEach(function(card, i) {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        once: true,
        onEnter: function() {
          gsap.fromTo(card,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              ease: 'power2.out',
              delay: 0
            }
          );
          card.classList.add('card--booted');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     8. DARK PANEL — system grid overlay + number lift
        Section #sau-dao-tao (.dark-panel)
  -------------------------------------------------------------------------- */
  function initDarkPanel() {
    if (reduce) return;

    var panel = qs('#sau-dao-tao.dark-panel, .dark-panel');
    if (!panel) return;

    /* Add a high-tech grid overlay class */
    panel.classList.add('dark-panel--sys');

    ScrollTrigger.create({
      trigger: panel,
      start: 'top 75%',
      once: true,
      onEnter: function() {
        panel.classList.add('dark-panel--active');

        /* Reveal diag cards with stagger */
        var diagCards = qsa('.diag-card, .diag-grid__card', panel);
        if (diagCards.length) {
          gsap.fromTo(diagCards,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out', delay: 0.15 }
          );
        }

        /* Reveal journey nodes */
        var journeyNodes = qsa('.journey-node', panel);
        if (journeyNodes.length) {
          gsap.fromTo(journeyNodes,
            { autoAlpha: 0, scale: 0.92 },
            { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(1.3)', delay: 0.3 }
          );
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. CHIPS / EYEBROW LABELS — fade + tracking expand
  -------------------------------------------------------------------------- */
  function initEyebrowAnimations() {
    if (reduce) return;

    var eyebrows = qsa('section:not(.hero) .chips');
    eyebrows.forEach(function(el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function() {
          gsap.fromTo(el,
            { autoAlpha: 0, letterSpacing: '-0.02em' },
            { autoAlpha: 1, letterSpacing: '0.04em', duration: 0.55, ease: 'power2.out' }
          );
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     10. POSITIONING PANEL  (BOOT phase for section 2)
  -------------------------------------------------------------------------- */
  function initPositioningPanel() {
    if (reduce) return;

    var panel = qs('.positioning-panel');
    if (!panel) return;

    var lead    = qs('.positioning-panel__lead', panel);
    var content = qs('.positioning-panel__content', panel);
    var callout = qs('.positioning-panel__callout', panel);

    if (lead) {
      ScrollTrigger.create({
        trigger: panel,
        start: 'top 80%',
        once: true,
        onEnter: function() {
          if (lead) gsap.fromTo(lead,
            { autoAlpha: 0, x: -24 },
            { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }
          );
          if (content) gsap.fromTo(content,
            { autoAlpha: 0, x: 24 },
            { autoAlpha: 1, x: 0, duration: 0.6, delay: 0.1, ease: 'power3.out' }
          );
          if (callout) gsap.fromTo(callout,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.4, ease: 'power2.out' }
          );
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     PHASE 2 — CASE CINEMATIC REVEAL  (FLOW + VERIFY phase)
  -------------------------------------------------------------------------- */
  function initCaseReveal() {
    if (reduce) return;

    var cases = qsa('.case');
    cases.forEach(function(caseEl) {
      var mediaCol  = qs('.case__media-col', caseEl);
      var bodyCol   = qs('.case__body', caseEl);
      var timeline  = qs('.case-timeline', caseEl);
      var metrics   = qsa('.cs-metric-chip, .case-metric', caseEl);
      var mediaWrap = qs('.case-video-embed, .cs-case__media-wrapper', caseEl);

      if (!mediaCol || !bodyCol) return;

      /* Initial state — media clips from right edge, body from left edge */
      gsap.set(mediaCol, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(bodyCol,  { clipPath: 'inset(0 0 0 100%)' });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: caseEl,
          start: 'top 78%',
          once: true,
        }
      });

      /* Media wipe reveal */
      tl.to(mediaCol, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.7,
        ease: 'power3.out'
      }, 0);

      /* Body reveal from opposite direction */
      tl.to(bodyCol, {
        clipPath: 'inset(0 0 0 0%)',
        duration: 0.65,
        ease: 'power3.out'
      }, 0.1);

      /* Timeline draw */
      if (timeline) {
        tl.call(function() {
          timeline.classList.add('timeline--drawn');
        }, null, 0.5);
      }

      /* Metric chips scan — stagger */
      if (metrics.length) {
        tl.call(function() {
          metrics.forEach(function(chip, i) {
            setTimeout(function() {
              chip.classList.add('chip--revealed');
            }, i * 120);
          });
        }, null, 0.75);
      }
    });

    /* Subtle media parallax as user scrolls */
    qsa('.case__media-col .case-video-embed, .case__media-col .cs-case__media-wrapper').forEach(function(el) {
      gsap.fromTo(el,
        { y: 12 },
        {
          y: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          }
        }
      );
    });
  }

  /* --------------------------------------------------------------------------
     PHASE 2 — BENTO "SYSTEM MODULES" STAGGER DOCK  (PROCESS phase)
  -------------------------------------------------------------------------- */
  function initBentoDock() {
    if (reduce) return;

    var bento = qs('.bento');
    if (!bento) return;

    var cards = qsa('.bcard', bento);
    if (!cards.length) return;

    /* Initial state — all cards slightly below and invisible */
    gsap.set(cards, { autoAlpha: 0, y: 28, scale: 0.97 });

    ScrollTrigger.create({
      trigger: bento,
      start: 'top 80%',
      once: true,
      onEnter: function() {
        /* Cards "dock" in staggered sequence — wide card first, then modules */
        var wideCards  = cards.filter(function(c) { return c.classList.contains('bcard--wide'); });
        var normCards  = cards.filter(function(c) { return !c.classList.contains('bcard--wide'); });
        var ordered    = [].concat(wideCards.slice(0,1), normCards, wideCards.slice(1));

        var tl = gsap.timeline();
        ordered.forEach(function(card, i) {
          tl.to(card, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          }, i * 0.08);
        });
      }
    });
  }

  /* --------------------------------------------------------------------------
     PHASE 2 — TYPE A HEADINGS  (apply class to key sections)
  -------------------------------------------------------------------------- */
  function initHeadingTypes() {
    /* TYPE A — kinetic scale headings */
    var typeA = ['#van-de', '#nhan-duoc', '#case'];
    typeA.forEach(function(sel) {
      var head = qs(sel + ' .head');
      if (head) head.classList.add('head--type-a');
    });
  }

  /* --------------------------------------------------------------------------
     BOOT — run after DOM ready
  -------------------------------------------------------------------------- */
  function boot() {
    initHeroBoot();
    initHeroParallax();
    initSectionIndexParallax();

    initEyebrowAnimations();
    initKineticTypography();
    initSystemCounters();
    initCircuitAnimations();
    initCardReveals();
    initDarkPanel();
    initSectionTransitions();
    initPositioningPanel();

    /* Phase 2 */
    initCaseReveal();
    initBentoDock();
    initHeadingTypes();

    /* Refresh ScrollTrigger after fonts load */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        ScrollTrigger.refresh();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
