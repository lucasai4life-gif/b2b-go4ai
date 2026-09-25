import re

with open('assets/js/system-motion.js', 'r') as f:
    content = f.read()

# Replace initHeroBoot
new_hero_boot = """
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
"""

content = re.sub(r'function initHeroBoot\(\) \{.*?\}(?=\s*/\* -+)', new_hero_boot, content, flags=re.DOTALL)

boot_patch = """  function boot() {
    initHeroBoot();
    initHeroParallax();
    initSectionIndexParallax();
"""
content = re.sub(r'  function boot\(\) \{\n    initHeroBoot\(\);', boot_patch, content)

with open('assets/js/system-motion.js', 'w') as f:
    f.write(content)

