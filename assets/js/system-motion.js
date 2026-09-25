/* ============================================================================
   system-motion.js — High-Tech Enterprise AI System & Cinematic Experience
   GO4AI / b2b-go4ai — v2.1.0

   Motion language: BOOT → PROCESS → OUTPUT → VERIFY
   Requires: GSAP 3.15+ + ScrollTrigger (already loaded before this file)
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
     1. UTILITIES
  -------------------------------------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* --------------------------------------------------------------------------
     2. HERO BOOT SEQUENCE (Section C: 0.0s → 2.5s Cinematic Sequence)
  -------------------------------------------------------------------------- */
  function initHeroBoot() {
    var heroEnv    = qs('.hero-env');
    var chips      = qs('.hero .chips');
    var titleEl    = qs('.hero__title');
    var grad       = titleEl && titleEl.querySelector('.text--grad');
    var sub        = qs('.hero__sub');
    var ctas       = qs('.hero__ctas');
    var pipe       = qs('.hero__pipeline');
    var core       = qs('#engine-core');
    var coreStatus = core && core.querySelector('.engine-core__status span:last-child');
    var roleCards  = qsa('.engine-card--role');
    var outCards   = qsa('.engine-card--output:not(#engine-passport)');
    var passport   = qs('#engine-passport');
    var proofItems = qsa('.engine__proof-item strong');

    if (!titleEl) return;

    if (reduce) {
      proofItems.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        if (!isNaN(target)) {
          var formatted = target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          el.textContent = formatted + suffix;
        }
        el.setAttribute('data-counted', 'hero');
      });
      return;
    }

    // Task 2: Initialize proof metrics to 0+ so they count up from 0 on page boot
    proofItems.forEach(function (el) {
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = '0' + suffix;
      el.setAttribute('data-counted', 'hero');
    });

    // Initial states: elements hidden before boot
    gsap.set([chips, titleEl, sub, ctas, pipe].filter(Boolean), { autoAlpha: 0, y: 35 });
    if (chips) gsap.set(chips, { y: 0 });
    if (heroEnv) gsap.set(heroEnv, { autoAlpha: 0 });
    gsap.set(roleCards, { autoAlpha: 0, x: -24 });
    gsap.set(outCards,  { autoAlpha: 0, x: 24 });
    if (passport) gsap.set(passport, { autoAlpha: 0, scale: 0.88 });

    var tl = gsap.timeline({ delay: 0.05 });

    // 0.0s: technical environment appears
    if (heroEnv) {
      tl.to(heroEnv, { autoAlpha: 1, duration: 0.65, ease: 'power2.out' }, 0);
    }

    // 0.2s: system status eyebrow appears
    if (chips) {
      tl.to(chips, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0.2);
    }

    // 0.4s: headline line 1 mask reveal
    tl.to(titleEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.4);

    // 0.7s: green phrase scan & sweep
    if (grad) {
      tl.call(function () {
        grad.classList.add('hero-grad--sweep');
      }, null, 0.7);
    }

    // 1.0s: AI Core boot sequence starts
    if (core && coreStatus) {
      tl.call(function () {
        core.classList.add('engine-core--booting');
        coreStatus.textContent = 'SYSTEM INITIALIZING…';
      }, null, 1.0);
    }

    // 1.3s: Role cards appear (Sales -> HR -> Finance)
    tl.to(roleCards, {
      autoAlpha: 1,
      x: 0,
      duration: 0.45,
      stagger: 0.12,
      ease: 'power2.out'
    }, 1.3);

    // Subtext & CTAs
    if (sub) tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 1.5);
    if (ctas) tl.to(ctas, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.6);
    if (pipe) tl.to(pipe, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.7);

    // 1.6s - 1.8s: Core switches to ACTIVE
    if (core && coreStatus) {
      tl.call(function () {
        core.classList.remove('engine-core--booting');
        core.classList.add('engine-core--live');
        coreStatus.textContent = 'AI ENABLEMENT ACTIVE';
      }, null, 1.8);
    }

    // 1.9s: Output cards activate (Proposal -> Dashboard -> SOP)
    tl.to(outCards, {
      autoAlpha: 1,
      x: 0,
      duration: 0.4,
      stagger: 0.12,
      ease: 'power2.out'
    }, 1.9);

    // 2.3s: AI Passport VERIFIED
    if (passport) {
      tl.to(passport, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.4)'
      }, 2.3);
      tl.call(function () {
        passport.classList.add('engine-passport--verified');
      }, null, 2.45);
    }

    // Task 2: Proof metrics count-up (runs right after AI Passport verify at ~2.5s)
    if (proofItems.length) {
      tl.call(function () {
        proofItems.forEach(function (el, i) {
          setTimeout(function () {
            var target = parseFloat(el.getAttribute('data-count'));
            var suffix = el.getAttribute('data-suffix') || '';
            if (isNaN(target)) return;

            var start = performance.now();
            var dur = 1500; // 1.4–1.7s duration

            function tick(now) {
              var progress = Math.min((now - start) / dur, 1);
              // power2.out easing: 1 - (1 - progress)^2
              var eased = 1 - (1 - progress) * (1 - progress);
              var val = Math.round(target * eased);
              var formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              el.textContent = formatted + suffix;

              if (progress < 1) {
                requestAnimationFrame(tick);
              } else {
                var finalFormatted = target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                el.textContent = finalFormatted + suffix;
                el.setAttribute('data-counted', 'hero');

                // Finish pulse & scanline
                el.classList.add('is--done', 'proof-pulse');
                var parentItem = el.closest('.engine__proof-item');
                if (parentItem) parentItem.classList.add('is--done');
              }
            }
            requestAnimationFrame(tick);
          }, i * 130); // 100–150ms stagger
        });
      }, null, 2.5);
    }
  }

  /* --------------------------------------------------------------------------
     2b. HERO PIPELINE AUTO-LOOP (Khung năng lực — Task 1)
  -------------------------------------------------------------------------- */
  function initPipelineAutoLoop() {
    var pipeline = qs('.hero__pipeline');
    var trust = qs('.hero__trust');
    if (!pipeline || !trust) return;

    var pills = qsa('li:not(.hero__trust-sep)', trust);
    var seps  = qsa('.hero__trust-sep', pipeline);
    if (!pills.length) return;

    var currentIndex = 0;
    var timer = null;
    var isHovered = false;

    function activatePill(idx) {
      if (idx < 0 || idx >= pills.length) idx = 0;
      currentIndex = idx;

      pills.forEach(function (p, i) {
        p.classList.toggle('is--active', i === idx);
      });

      // Pulse connecting arrow corresponding to current active pill
      seps.forEach(function (s, i) {
        if (i === idx) {
          s.classList.add('is--pulse');
          setTimeout(function () { s.classList.remove('is--pulse'); }, 450);
        } else {
          s.classList.remove('is--pulse');
        }
      });
    }

    // Prefers-reduced-motion: static visible pills with first pill active
    if (reduce) {
      activatePill(0);
      return;
    }

    activatePill(0);

    function nextPill() {
      if (isHovered) return;
      var nextIdx = (currentIndex + 1) % pills.length;
      activatePill(nextIdx);
    }

    function startCycle() {
      if (timer) clearInterval(timer);
      timer = setInterval(nextPill, 1000); // 900–1100ms
    }

    // Desktop hover: pause & activate hovered pill
    pills.forEach(function (pill, idx) {
      pill.addEventListener('mouseenter', function () {
        isHovered = true;
        if (timer) { clearInterval(timer); timer = null; }
        activatePill(idx);
      });
    });

    trust.addEventListener('mouseleave', function () {
      isHovered = false;
      startCycle();
    });

    startCycle();
  }

  /* --------------------------------------------------------------------------
     3. HERO PARALLAX DEPTH (Desktop Cursor-Reactive)
  -------------------------------------------------------------------------- */
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

    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      my = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    }, { passive: true });

    heroSection.addEventListener('mouseleave', function () {
      mx = 0; my = 0;
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      tx = lerp(tx, mx, 0.05);
      ty = lerp(ty, my, 0.05);

      if (heroEnvGrid) {
        heroEnvGrid.style.transform = 'perspective(600px) rotateX(20deg) translate(' + (tx * 4) + 'px, ' + (ty * 2) + 'px)';
      }
      if (roleCol) {
        roleCol.style.transform = 'translate(' + (tx * 6) + 'px, ' + (ty * 3) + 'px)';
      }
      if (core) {
        core.style.transform = 'translate(' + (tx * 2.5) + 'px, ' + (ty * 2.5) + 'px)';
      }
      if (outputCol) {
        outputCol.style.transform = 'translate(' + (-tx * 5) + 'px, ' + (-ty * 3) + 'px)';
      }
      raf = requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { raf = requestAnimationFrame(tick); }
        else { cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.1 });
    io.observe(heroSection);
  }

  /* --------------------------------------------------------------------------
     4. OVERSIZED SECTION INDEX PARALLAX (Section G)
  -------------------------------------------------------------------------- */
  function initSectionIndexParallax() {
    if (reduce) return;
    var indices = qsa('.section-bg-index');
    indices.forEach(function (el) {
      gsap.to(el, {
        yPercent: -22,
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
     5. KINETIC TYPOGRAPHY (Section G)
  -------------------------------------------------------------------------- */
  function initKineticTypography() {
    if (reduce) return;

    var headSections = qsa('[data-reveal] .title--l, [data-reveal] .head__title');

    headSections.forEach(function (title) {
      if (title.closest('.hero')) return;

      var grad = title.querySelector('.text--grad');

      ScrollTrigger.create({
        trigger: title,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.fromTo(title,
            { autoAlpha: 0, y: 30, filter: 'blur(5px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }
          );
          if (grad) {
            setTimeout(function () {
              grad.classList.add('heading-grad--sweep');
            }, 250);
          }
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. METRIC COUNTERS (Section E)
  -------------------------------------------------------------------------- */
  function initSystemCounters() {
    var nodes = qsa('[data-count]');
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      // Skip if handled by hero boot
      if (el.getAttribute('data-counted') === 'hero') return;
      el.classList.add('sys-counter');

      var observed = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || observed) return;
          observed = true;
          io.disconnect();

          if (el.getAttribute('data-counted')) return;
          el.setAttribute('data-counted', 'sys');

          var target = parseFloat(el.getAttribute('data-count'));
          if (isNaN(target)) return;

          var prefix = el.getAttribute('data-prefix') || '';
          var suffix = el.getAttribute('data-suffix') || '';
          var dur = target >= 1000 ? 1600 : 1200;
          var start = performance.now();

          function tick(now) {
            var t = Math.min((now - start) / dur, 1);
            var eased = t < 0.65
              ? (t / 0.65) * 0.82
              : 0.82 + ((t - 0.65) / 0.35) * 0.18;
            var val = Math.round(target * eased);
            var formatted = val >= 1000 ? val.toLocaleString('vi-VN') : val;
            el.textContent = prefix + formatted + suffix;

            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              var finalVal = target >= 1000 ? target.toLocaleString('vi-VN') : target;
              el.textContent = prefix + finalVal + suffix;

              if (!reduce) {
                el.classList.add('sys-counter--done');
                var box = el.closest('.sys-metric-box, .impact-content, .cs-metric-chip');
                if (box) {
                  box.classList.add('sys-metric--scan');
                  setTimeout(function () { box.classList.remove('sys-metric--scan'); }, 900);
                }
              }
            }
          }

          requestAnimationFrame(tick);
        });
      }, { threshold: 0.35 });

      io.observe(el);
    });
  }

  /* --------------------------------------------------------------------------
     7. CIRCUIT WORKFLOW & JOURNEY ANIMATIONS
  -------------------------------------------------------------------------- */
  function initCircuitAnimations() {
    if (reduce) return;

    var workflows = qsa('.cs-case__workflow, .case-flow');
    workflows.forEach(function (wf) {
      var steps = qsa('.cs-case__workflow-chip, .case-flow__pill', wf);
      var seps  = qsa('.cs-case__workflow-sep, .case-flow__sep', wf);
      if (!steps.length) return;

      gsap.set(steps, { autoAlpha: 0, x: -8 });
      gsap.set(seps,  { autoAlpha: 0 });

      ScrollTrigger.create({
        trigger: wf,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          var tl = gsap.timeline();
          steps.forEach(function (step, i) {
            tl.to(step, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power2.out' }, i * 0.1);
            if (seps[i]) {
              tl.to(seps[i], { autoAlpha: 1, duration: 0.18, ease: 'none' }, i * 0.1 + 0.12);
            }
          });
        }
      });
    });

    var journeyTrack = qs('.journey-track');
    if (journeyTrack) {
      ScrollTrigger.create({
        trigger: journeyTrack,
        start: 'top 80%',
        once: true,
        onEnter: function () {
          journeyTrack.classList.add('journey-track--boot');
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     8. SECTION TRANSITION LINES
  -------------------------------------------------------------------------- */
  function initSectionTransitions() {
    if (reduce) return;

    var sections = qsa('section[id]:not(#hero)');
    sections.forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 96%',
        once: true,
        onEnter: function () {
          sec.classList.add('section--in');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     9. CARDS REVEAL (Problem, Benefits, Module)
  -------------------------------------------------------------------------- */
  function initCardReveals() {
    if (reduce) return;

    var cardGroups = qsa(
      '.problem-grid .problem-card, .benefits-grid .benefits__item, ' +
      '.timeline__dept-grid .timeline__dept-item'
    );

    cardGroups.forEach(function (card) {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.fromTo(card,
            { autoAlpha: 0, y: 22 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }
          );
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     10. DARK PANEL (Section 9)
  -------------------------------------------------------------------------- */
  function initDarkPanel() {
    if (reduce) return;

    var panel = qs('#sau-dao-tao.dark-panel, .dark-panel');
    if (!panel) return;

    panel.classList.add('dark-panel--sys');

    ScrollTrigger.create({
      trigger: panel,
      start: 'top 75%',
      once: true,
      onEnter: function () {
        panel.classList.add('dark-panel--active');

        var diagCards = qsa('.diag-card', panel);
        if (diagCards.length) {
          gsap.fromTo(diagCards,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', delay: 0.1 }
          );
        }

        var journeyNodes = qsa('.journey-node', panel);
        if (journeyNodes.length) {
          gsap.fromTo(journeyNodes,
            { autoAlpha: 0, scale: 0.92 },
            { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.3)', delay: 0.25 }
          );
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     11. DIAGNOSTIC AUTO-ACTIVE LOOP (Section K: 01 → 02 → 03 → 04 → 05 → 06)
  -------------------------------------------------------------------------- */
  function initDiagnosticAutoLoop() {
    var section = qs('#sau-dao-tao');
    if (!section) return;
    var diagGrid = qs('.diag-grid, .diag-system', section);
    if (!diagGrid) return;
    var cards = qsa('.diag-card', diagGrid);
    if (!cards.length) return;

    var currentIndex = 0;
    var timer = null;
    var isPaused = false;
    var inView = false;

    function activateCard(index) {
      if (index < 0 || index >= cards.length) index = 0;
      currentIndex = index;
      cards.forEach(function (c, i) {
        c.classList.toggle('is--active', i === index);
      });
      diagGrid.classList.add('has--active-card');
    }

    function nextCard() {
      if (isPaused || !inView || reduce) return;
      var nextIdx = (currentIndex + 1) % cards.length;
      activateCard(nextIdx);
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(nextCard, 800); // 700–850ms / card
    }

    diagGrid.addEventListener('mouseenter', function () { isPaused = true; });
    diagGrid.addEventListener('mouseleave', function () { isPaused = false; });
    diagGrid.addEventListener('focusin', function () { isPaused = true; });
    diagGrid.addEventListener('focusout', function () { isPaused = false; });

    cards.forEach(function (card, idx) {
      card.addEventListener('mouseenter', function () {
        isPaused = true;
        activateCard(idx);
      });
      card.addEventListener('mouseleave', function () {
        isPaused = false;
      });
      card.addEventListener('click', function () {
        activateCard(idx);
        startTimer();
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inView = entry.isIntersecting;
        if (inView && !timer) {
          startTimer();
        } else if (!inView && timer) {
          clearInterval(timer);
          timer = null;
        }
      });
    }, { threshold: 0.15 });

    io.observe(section);
    activateCard(0);
    startTimer();
  }

  /* --------------------------------------------------------------------------
     12. CASE CINEMATIC REVEAL (Section L)
  -------------------------------------------------------------------------- */
  function initCaseReveal() {
    if (reduce) return;

    var cases = qsa('.case');
    cases.forEach(function (caseEl) {
      var mediaCol  = qs('.case__media-col', caseEl);
      var bodyCol   = qs('.case__body', caseEl);
      var timeline  = qs('.case-timeline', caseEl);
      var metrics   = qsa('.cs-metric-chip, .case-metric', caseEl);

      if (!mediaCol || !bodyCol) return;

      gsap.set(mediaCol, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(bodyCol,  { clipPath: 'inset(0 0 0 100%)' });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: caseEl,
          start: 'top 78%',
          once: true,
        }
      });

      tl.to(mediaCol, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.7,
        ease: 'power3.out',
        onComplete: function () {
          // Task 4: Clear clipPath & transform so CSS position: sticky works unobstructed on desktop
          gsap.set(mediaCol, { clearProps: 'clipPath,transform' });
        }
      }, 0);

      tl.to(bodyCol, {
        clipPath: 'inset(0 0 0 0%)',
        duration: 0.65,
        ease: 'power3.out',
        onComplete: function () {
          gsap.set(bodyCol, { clearProps: 'clipPath,transform' });
        }
      }, 0.1);

      if (timeline) {
        tl.call(function () {
          timeline.classList.add('timeline--drawn');
        }, null, 0.45);
      }

      if (metrics.length) {
        tl.call(function () {
          metrics.forEach(function (chip, i) {
            setTimeout(function () {
              chip.classList.add('chip--revealed');
            }, i * 110);
          });
        }, null, 0.7);
      }
    });

    // NOTE for Task 4: Removed parallax scrub on .case-video-embed because it breaks CSS sticky scroll on desktop
  }

  /* --------------------------------------------------------------------------
     12b. CASE METRICS MOTION (Task 5: Case 1 Count-up & Case 2 Time Sequence)
  -------------------------------------------------------------------------- */
  function initCaseMetricsMotion() {
    if (reduce) return;

    // Case 1: AI Enablement (Count-up 0 -> 3.000+, 0 -> 14+, 0 -> 10+)
    var case1 = qs('.case.case--light');
    if (case1) {
      var case1Counts = qsa('[data-case-count]', case1);
      if (case1Counts.length) {
        // Initialize numbers to 0+
        case1Counts.forEach(function (el) {
          var suffix = el.getAttribute('data-suffix') || '';
          el.textContent = '0' + suffix;
        });

        ScrollTrigger.create({
          trigger: case1,
          start: 'top 65%', // trigger when ~35-45% into viewport
          once: true,
          onEnter: function () {
            case1Counts.forEach(function (el, i) {
              setTimeout(function () {
                var target = parseFloat(el.getAttribute('data-case-count'));
                var suffix = el.getAttribute('data-suffix') || '';
                if (isNaN(target)) return;

                var start = performance.now();
                var dur = 1300; // 1.1–1.5s duration

                function tick(now) {
                  var progress = Math.min((now - start) / dur, 1);
                  var eased = 1 - Math.pow(1 - progress, 3);
                  var val = Math.round(target * eased);
                  var formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                  el.textContent = formatted + suffix;

                  if (progress < 1) {
                    requestAnimationFrame(tick);
                  } else {
                    var finalFormatted = target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    el.textContent = finalFormatted + suffix;
                    el.classList.add('proof-pulse');
                    setTimeout(function () { el.classList.remove('proof-pulse'); }, 850);
                  }
                }
                requestAnimationFrame(tick);
              }, i * 140);
            });
          }
        });
      }
    }

    // Case 2: AI Sales Agent (15-30 phút -> <60 giây sequence)
    var case2 = qs('.case.case--dark');
    if (case2) {
      var rangeContainer = qs('.case-metric-range', case2);
      if (rangeContainer) {
        var oldVal = qs('.metric-old', rangeContainer);
        var arrow  = qs('.metric-arrow', rangeContainer);
        var target = qs('.metric-target', rangeContainer);

        gsap.set([oldVal, arrow, target].filter(Boolean), { autoAlpha: 0, y: 10 });

        ScrollTrigger.create({
          trigger: case2,
          start: 'top 65%', // trigger when ~35-45% into viewport
          once: true,
          onEnter: function () {
            var tl = gsap.timeline({ delay: 0.1 });
            if (oldVal) tl.to(oldVal, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0);
            if (arrow)  tl.to(arrow,  { autoAlpha: 1, y: 0, scale: 1.15, duration: 0.35, ease: 'back.out(1.4)' }, 0.25);
            if (target) {
              tl.to(target, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.5)' }, 0.45);
              tl.call(function () {
                target.classList.add('is--pulsed');
              }, null, 0.65);
            }
          }
        });
      }
    }
  }

  /* --------------------------------------------------------------------------
     13. BENTO SYSTEM MAP ASSEMBLE (Section I)
  -------------------------------------------------------------------------- */
  function initBentoDock() {
    if (reduce) return;

    var bento = qs('.bento');
    if (!bento) return;

    var cards = qsa('.bcard', bento);
    if (!cards.length) return;

    gsap.set(cards, { autoAlpha: 0, y: 26, scale: 0.98 });

    ScrollTrigger.create({
      trigger: bento,
      start: 'top 80%',
      once: true,
      onEnter: function () {
        var wideCards  = cards.filter(function (c) { return c.classList.contains('bcard--wide'); });
        var normCards  = cards.filter(function (c) { return !c.classList.contains('bcard--wide'); });
        var ordered    = [].concat(wideCards.slice(0, 1), normCards, wideCards.slice(1));

        var tl = gsap.timeline();
        ordered.forEach(function (card, i) {
          tl.to(card, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.48,
            ease: 'power2.out'
          }, i * 0.08);
        });
      }
    });
  }

  /* --------------------------------------------------------------------------
     14. HEADING TYPES
  -------------------------------------------------------------------------- */
  function initHeadingTypes() {
    var typeA = ['#van-de', '#nhan-duoc', '#case'];
    typeA.forEach(function (sel) {
      var head = qs(sel + ' .head');
      if (head) head.classList.add('head--type-a');
    });
  }

  /* --------------------------------------------------------------------------
     15. POSITIONING PANEL
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
        onEnter: function () {
          if (lead) gsap.fromTo(lead, { autoAlpha: 0, x: -22 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' });
          if (content) gsap.fromTo(content, { autoAlpha: 0, x: 22 }, { autoAlpha: 1, x: 0, duration: 0.6, delay: 0.1, ease: 'power3.out' });
          if (callout) gsap.fromTo(callout, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.35, ease: 'power2.out' });
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     16. HEADER DARK SYNC WITH HERO
  -------------------------------------------------------------------------- */
  function initHeaderHeroSync() {
    var header = qs('.site-header');
    if (!header) return;
    function update() {
      header.classList.toggle('is--hero-top', window.scrollY < 120);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* --------------------------------------------------------------------------
     BOOT — run after DOM ready
  -------------------------------------------------------------------------- */
  function boot() {
    initHeaderHeroSync();
    initHeroBoot();
    initPipelineAutoLoop();
    initHeroParallax();
    initSectionIndexParallax();
    initKineticTypography();
    initSystemCounters();
    initCircuitAnimations();
    initCardReveals();
    initDarkPanel();
    initDiagnosticAutoLoop();
    initSectionTransitions();
    initPositioningPanel();
    initCaseReveal();
    initCaseMetricsMotion();
    initBentoDock();
    initHeadingTypes();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
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
