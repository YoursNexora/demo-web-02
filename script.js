/* ==========================================================================
   HARTWELL & MARSH — script.js
   Vanilla JS · No dependencies
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Utilities ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('#siteHeader');
  const progressBar = $('#progressBar');
  const drawer = $('#mobileDrawer');
  const navToggle = $('.nav-toggle');
  const modal = $('#consultModal');
  const glyph = $('#heroGlyph');

  /* ---------- Shared scroll lock (drawer + modal) ---------- */
  let lockCount = 0;
  const scrollbarWidth = () => window.innerWidth - document.documentElement.clientWidth;

  function lockScroll(on) {
    if (on) {
      if (lockCount++ === 0) {
        const w = scrollbarWidth();
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = w + 'px';
        header.style.paddingRight = w + 'px';
      }
    } else if (lockCount > 0 && --lockCount === 0) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      header.style.paddingRight = '';
    }
  }

  /* =========================================================
     1. HEADER STATE, SCROLL PROGRESS & HERO PARALLAX
     ========================================================= */
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 24);

    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    if (glyph && !prefersReduced) {
      glyph.style.transform = 'translateY(' + y * 0.08 + 'px)';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* =========================================================
     2. MOBILE DRAWER NAVIGATION
     ========================================================= */
  function openDrawer() {
    drawer.classList.add('open');
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation menu');
    drawer.setAttribute('aria-hidden', 'false');
    lockScroll(true);
  }

  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    drawer.setAttribute('aria-hidden', 'true');
    lockScroll(false);
  }

  navToggle.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  $$('[data-drawer-close]').forEach(el => el.addEventListener('click', closeDrawer));

  /* =========================================================
     3. SMOOTH SCROLLING (with sticky-header offset)
     ========================================================= */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href.length < 2) return; // bare "#"
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      if (drawer.classList.contains('open')) closeDrawer();

      const y = href === '#top'
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;

      window.scrollTo({ top: Math.max(y, 0), behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* =========================================================
     4. SCROLLSPY — ACTIVE STATE NAVIGATION
     ========================================================= */
  const navLinks = $$('.nav-link');
  const setActiveNav = id => {
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
  };

  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) setActiveNav(en.target.dataset.nav || '');
    });
  }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });

  $$('[data-nav]').forEach(sec => spy.observe(sec));

  /* =========================================================
     5. SCROLL-REVEAL ANIMATIONS
     ========================================================= */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* =========================================================
     6. ANIMATED STATS TICKER
     ========================================================= */
  function formatNumber(value, decimals, prefix, suffix) {
    const str = decimals ? value.toFixed(decimals) : Math.round(value).toString();
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return prefix + parts.join('.') + suffix;
  }

  function animateCount(el) {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const duration = 1900;

    if (prefersReduced) {
      el.textContent = formatNumber(target, decimals, prefix, suffix);
      return;
    }

    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = formatNumber(target * eased, decimals, prefix, suffix);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(target, decimals, prefix, suffix);
    };
    requestAnimationFrame(step);
  }

  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        countObserver.unobserve(en.target);
        setTimeout(() => animateCount(en.target), 400);
      }
    });
  }, { threshold: 0.4 });

  $$('[data-count]').forEach(el => countObserver.observe(el));

  /* =========================================================
     7. PRACTICE-AREA ACCORDION (single-open)
     ========================================================= */
  $$('.acc-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc');
      const wasOpen = item.classList.contains('open');

      // Close every open item first
      $$('.acc.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* =========================================================
     8. CASE-RESULT FILTERING
     ========================================================= */
  const caseList = $('#caseList');
  const caseRows = $$('.case-row');
  const filterBtns = $$('.filter-btn');
  let filterLock = false;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (filterLock || btn.classList.contains('is-active')) return;

      filterBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      const filter = btn.dataset.filter;
      filterLock = true;
      caseList.classList.add('is-filtering'); // fade everything out

      setTimeout(() => {
        caseRows.forEach(row => {
          row.classList.toggle('is-hidden', !(filter === 'all' || row.dataset.cat === filter));
        });

        // Staggered re-entry for surviving rows
        const visible = caseRows.filter(r => !r.classList.contains('is-hidden'));
        visible.forEach((row, i) => {
          row.style.transitionDelay = Math.min(i * 60, 300) + 'ms';
        });

        requestAnimationFrame(() => requestAnimationFrame(() => {
          caseList.classList.remove('is-filtering');
        }));

        setTimeout(() => {
          visible.forEach(row => (row.style.transitionDelay = ''));
          filterLock = false;
        }, 650);
      }, 320);
    });
  });

  /* =========================================================
     9. TESTIMONIAL SLIDER (autoplay driven by CSS progress bar)
     ========================================================= */
  const tSlides = $$('.testi-slide');
  const tViewport = $('#testiViewport');
  const tCounter = $('#testiCurrent');
  const tProgress = $('#testiProgress');
  let tIndex = 0;
  let tStarted = false;

  function setSlideHeight() {
    const active = tSlides[tIndex];
    if (active && tViewport) tViewport.style.height = active.offsetHeight + 'px';
  }

  function restartProgress() {
    if (prefersReduced || !tStarted) return;
    tProgress.classList.remove('run');
    void tProgress.offsetWidth; // force reflow to restart the animation
    tProgress.classList.add('run');
  }

  function goToSlide(n) {
    tIndex = (n + tSlides.length) % tSlides.length;
    tSlides.forEach((s, i) => s.classList.toggle('is-active', i === tIndex));
    tCounter.textContent = String(tIndex + 1).padStart(2, '0');
    setSlideHeight();
    restartProgress();
  }

  // Autoplay: the CSS progress bar's animationend advances the slide.
  // Hovering pauses the animation (and therefore the autoplay) for free.
  tProgress.addEventListener('animationend', () => {
    if (document.hidden) { restartProgress(); return; }
    goToSlide(tIndex + 1);
  });

  $('#testiPrev').addEventListener('click', () => { tStarted = true; goToSlide(tIndex - 1); });
  $('#testiNext').addEventListener('click', () => { tStarted = true; goToSlide(tIndex + 1); });

  // Start autoplay only once the section is actually seen
  const testiObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        tStarted = true;
        restartProgress();
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  testiObserver.observe($('#testimonials'));

  setSlideHeight();
  window.addEventListener('resize', setSlideHeight);
  window.addEventListener('load', setSlideHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSlideHeight);

  /* =========================================================
     10. INSIGHTS ACCORDION (independent toggles)
     ========================================================= */
  $$('.insight-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.insight');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* =========================================================
     11. CONSULTATION MODAL (focus trap, ESC, backdrop)
     ========================================================= */
  let lastFocused = null;

  function focusableElements() {
    return $$('button, a[href], input, select, textarea', modal).filter(el => {
      return !el.disabled && el.offsetParent !== null && !el.hidden && el.type !== 'hidden';
    });
  }

  function openModal(practice) {
    lastFocused = document.activeElement;

    // If a previous success message is showing, reset the form state
    if (!$('#modalSuccess').hidden) resetForm();

    if (practice) {
      $('#fArea').value = practice;
      $('#fArea').closest('.field').classList.remove('invalid');
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    $('.modal-scroll').scrollTop = 0;

    setTimeout(() => $('#fName').focus(), 320);
  }

  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  $$('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      closeDrawer();
      openModal(btn.dataset.practice || null);
    });
  });
  $$('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));

  // Global keyboard handling: ESC + focus trap for modal, ESC for drawer
  document.addEventListener('keydown', e => {
    if (modal.classList.contains('open')) {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Tab') {
        const focusables = focusableElements();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    } else if (drawer.classList.contains('open') && e.key === 'Escape') {
      closeDrawer();
    }
  });

  /* =========================================================
     12. BOOKING FORM — VALIDATION & SUCCESS FLOW
     ========================================================= */
  const form = $('#consultForm');
  const fields = {
    name:     $('#fName'),
    phone:    $('#fPhone'),
    email:    $('#fEmail'),
    practice: $('#fArea'),
    date:     $('#fDate'),
    consent:  $('#fConsent')
  };
  const notes = $('#fNotes');

  function wrapOf(el) { return el.closest('.field'); }
  function setInvalid(el, msg) {
    const w = wrapOf(el);
    if (!w) return;
    w.classList.add('invalid');
    if (msg) {
      const err = w.querySelector('.field-error');
      if (err) err.textContent = msg;
    }
  }
  function setValid(el) {
    const w = wrapOf(el);
    if (w) w.classList.remove('invalid');
  }

  const validators = {
    name() {
      const ok = fields.name.value.trim().length >= 2;
      ok ? setValid(fields.name) : setInvalid(fields.name, 'Please enter your full name.');
      return ok;
    },
    phone() {
      const digits = fields.phone.value.replace(/\D/g, '');
      const ok = digits.length >= 7 && digits.length <= 15;
      ok ? setValid(fields.phone) : setInvalid(fields.phone, 'Please enter a valid phone number.');
      return ok;
    },
    email() {
      const v = fields.email.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      ok ? setValid(fields.email) : setInvalid(fields.email, 'Please enter a valid email address.');
      return ok;
    },
    practice() {
      const ok = !!fields.practice.value;
      ok ? setValid(fields.practice) : setInvalid(fields.practice, 'Please select a practice area.');
      return ok;
    },
    date() {
      const v = fields.date.value;
      if (!v) { setInvalid(fields.date, 'Please choose a preferred date.'); return false; }
      const chosen = new Date(v + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(chosen.getTime()) || chosen < today) {
        setInvalid(fields.date, 'Please choose a future date.');
        return false;
      }
      const day = chosen.getDay();
      if (day === 0 || day === 6) {
        setInvalid(fields.date, 'Consultations are held Monday through Friday.');
        return false;
      }
      setValid(fields.date);
      return true;
    },
    time() {
      const w = $('.time-field');
      const ok = !!form.querySelector('input[name="time"]:checked');
      w.classList.toggle('invalid', !ok);
      return ok;
    },
    consent() {
      const ok = fields.consent.checked;
      ok ? setValid(fields.consent) : setInvalid(fields.consent, 'Please acknowledge this notice to continue.');
      return ok;
    }
  };

  function liveCheck(el) {
    if (el.name === 'time') { if ($('.time-field').classList.contains('invalid')) validators.time(); return; }
    if (el.name === 'notes') return;
    const w = wrapOf(el);
    if (w && w.classList.contains('invalid') && validators[el.name]) {
      validators[el.name]();
    }
  }
  form.addEventListener('input', e => liveCheck(e.target));
  form.addEventListener('change', e => liveCheck(e.target));

  form.addEventListener('submit', e => {
    e.preventDefault();

    const results = [
      validators.name(), validators.phone(), validators.email(),
      validators.practice(), validators.date(), validators.time(), validators.consent()
    ];

    if (results.includes(false)) {
      const firstInvalid =
        $('.field.invalid input, .field.invalid select, .field.invalid textarea', form) ||
        $('.time-field.invalid input', form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate secure transmission
    const btn = $('#formSubmit');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Transmitting&hellip; <i class="ri-loader-4-line icon-spin" aria-hidden="true"></i>';

    setTimeout(() => {
      const firstName = fields.name.value.trim().split(/\s+/)[0];
      const chosen = new Date(fields.date.value + 'T00:00:00');
      const dateStr = chosen.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      const timeStr = form.querySelector('input[name="time"]:checked').value;

      $('#refNo').textContent =
        'HM-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      $('#successSummary').textContent =
        'Thank you, ' + firstName + '. We have pencilled ' + dateStr + ' at ' + timeStr +
        ' for a ' + fields.practice.value.toLowerCase() +
        ' consultation. Our scheduling desk will call to confirm.';

      form.hidden = true;
      $('#modalSuccess').hidden = false;
      $('.modal-scroll').scrollTop = 0;
      $('#successClose').focus();

      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }, 1500);
  });

  function resetForm() {
    form.reset();
    $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
    $('#charCount').textContent = '0';
    form.hidden = false;
    $('#modalSuccess').hidden = true;
  }

  $('#successClose').addEventListener('click', () => {
    closeModal();
    setTimeout(resetForm, 450);
  });

  // Character counter for the matter description
  notes.addEventListener('input', () => {
    $('#charCount').textContent = notes.value.length;
  });

  // Date picker cannot select a past day
  (function setMinDate() {
    const d = new Date();
    const iso = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    fields.date.min = iso;
  })();

  /* =========================================================
     13. FOOTER YEAR
     ========================================================= */
  $('#year').textContent = new Date().getFullYear();
})();
