/* ============================================================
   MAISON ÉCLAT — Vanilla JS · no dependencies
   ============================================================ */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  /* ============================================================
     NAV: scroll state + mobile drawer
     ============================================================ */
  const nav      = $('#nav');
  const hamburger = $('.nav__hamburger');
  const drawer   = $('#drawer');
  const scrim    = $('#scrim');

  const setScrolled = () => {
    if (window.scrollY > 20) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  setScrolled();
  on(window, 'scroll', setScrolled, { passive: true });

  let drawerOpen = false;
  const openDrawer = () => {
    drawerOpen = true;
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    drawerOpen = false;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  on(hamburger, 'click', () => drawerOpen ? closeDrawer() : openDrawer());
  on(scrim, 'click', closeDrawer);
  $$('#drawer a, #drawer button').forEach(el => on(el, 'click', closeDrawer));

  /* ============================================================
     HERO: 4-beat entrance trigger
     ============================================================ */
  const hero = $('.hero');
  if (hero) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add('is-ready'));
    });
  }

  /* ============================================================
     SCROLL REVEAL — IntersectionObserver
     ============================================================ */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ============================================================
     SERVICES: tab switching
     ============================================================ */
  const tabs   = $$('.tab');
  const panels = $$('.panel');

  tabs.forEach(tab => {
    on(tab, 'click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(p => {
        const active = p.dataset.panel === target;
        p.classList.toggle('is-active', active);
        if (active) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    });
  });

  /* ============================================================
     GALLERY: filter logic
     ============================================================ */
  const filters = $$('.filter');
  const tiles   = $$('.tile');

  filters.forEach(filter => {
    on(filter, 'click', () => {
      const cat = filter.dataset.filter;
      filters.forEach(f => f.classList.toggle('is-active', f === filter));
      tiles.forEach(tile => {
        const match = cat === 'all' || tile.dataset.cat === cat;
        tile.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ============================================================
     BOOKING MODAL — open / close / trap focus / ESC
     ============================================================ */
  const modal       = $('#bookingModal');
  const modalDialog = $('.modal__dialog');
  const bookingForm = $('#bookingForm');
  const formSubmit  = $('#formSubmit');
  const formSuccess = $('#formSuccess');

  let lastFocused = null;
  let modalOpen = false;

  const focusableSel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const getFocusable = () => $$('button, [href], input, select, textarea', modalDialog)
    .filter(el => !el.disabled && el.offsetParent !== null);

  const openModal = (presetService) => {
    if (!modal) return;
    lastFocused = document.activeElement;
    modalOpen = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // reset form state
    bookingForm.reset();
    formSuccess.classList.remove('is-visible');
    formSubmit.classList.remove('is-loading');
    formSubmit.disabled = false;
    $$('.field', modalDialog).forEach(f => f.classList.remove('has-error'));
    $$('.field__error', modalDialog).forEach(e => (e.textContent = ''));

    // preset service if requested
    if (presetService) {
      const serviceSelect = $('select[name="service"]', modalDialog);
      if (serviceSelect) {
        const opt = $$('option', serviceSelect).find(o => o.text === presetService);
        if (opt) serviceSelect.value = opt.value || opt.text;
      }
    }

    // focus first field after transition
    window.setTimeout(() => {
      const first = getFocusable()[0];
      first && first.focus();
    }, 200);
  };

  const closeModal = () => {
    if (!modal) return;
    modalOpen = false;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  // open triggers — buttons anywhere with [data-trigger-book]
  $$('[data-trigger-book]').forEach(btn => {
    on(btn, 'click', () => openModal(btn.dataset.service || null));
  });

  // close triggers
  $$('[data-close]', modal).forEach(el => on(el, 'click', closeModal));

  // ESC key
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) closeModal();
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });

  // trap focus inside modal
  on(modalDialog, 'keydown', (e) => {
    if (e.key !== 'Tab' || !modalOpen) return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* ============================================================
     FORM VALIDATION + SUBMISSION
     ============================================================ */
  const validators = {
    service: (v) => v ? '' : 'Please choose a ritual.',
    stylist: () => '',
    date: (v) => {
      if (!v) return 'Please choose a date.';
      const chosen = new Date(v + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) return 'Please choose a future date.';
      return '';
    },
    time: (v) => v ? '' : 'Please choose a time.',
    name: (v) => {
      if (!v.trim()) return 'Please tell us your name.';
      if (v.trim().length < 2) return 'That seems too short.';
      return '';
    },
    phone: (v) => {
      if (!v.trim()) return 'A phone number is required.';
      const digits = v.replace(/\D/g, '');
      if (digits.length < 10) return 'Please enter a valid phone number.';
      return '';
    },
    email: (v) => {
      if (!v.trim()) return 'An email is required.';
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!re.test(v)) return 'Please enter a valid email.';
      return '';
    },
  };

  const validateField = (name, value) => {
    const fn = validators[name];
    return fn ? fn(value) : '';
  };

  const setFieldError = (name, msg) => {
    const field = $(`[name="${name}"]`, bookingForm)?.closest('.field');
    if (!field) return;
    const errorEl = $(`[data-error-for="${name}"]`, bookingForm);
    if (msg) {
      field.classList.add('has-error');
      if (errorEl) errorEl.textContent = msg;
    } else {
      field.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }
  };

  // live validation on blur
  $$('input, select, textarea', bookingForm).forEach(input => {
    on(input, 'blur', () => {
      if (validators[input.name]) {
        setFieldError(input.name, validateField(input.name, input.value));
      }
    });
    on(input, 'input', () => {
      const field = input.closest('.field');
      if (field && field.classList.contains('has-error')) {
        setFieldError(input.name, validateField(input.name, input.value));
      }
    });
  });

  // set min date attribute to today
  const dateInput = $('input[name="date"]', bookingForm);
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  on(bookingForm, 'submit', (e) => {
    e.preventDefault();

    let hasErrors = false;
    const data = new FormData(bookingForm);

    Object.keys(validators).forEach(name => {
      const value = data.get(name) || '';
      const msg = validateField(name, value);
      setFieldError(name, msg);
      if (msg) hasErrors = true;
    });

    if (hasErrors) {
      // focus first error
      const firstError = $('.field.has-error input, .field.has-error select', bookingForm);
      if (firstError) firstError.focus();
      return;
    }

    // loading state
    formSubmit.classList.add('is-loading');
    formSubmit.disabled = true;

    // simulate async request
    window.setTimeout(() => {
      formSubmit.classList.remove('is-loading');
      formSuccess.classList.add('is-visible');

      // reset form silently
      bookingForm.reset();
      $$('.field', bookingForm).forEach(f => f.classList.remove('has-error'));

      // announce to screen readers
      formSuccess.setAttribute('tabindex', '-1');
      formSuccess.focus();
    }, 1200);
  });

  /* ============================================================
     NEWSLETTER
     ============================================================ */
  const newsletter = $('#newsletterForm');
  const newsletterSuccess = $('#newsletterSuccess');
  if (newsletter) {
    on(newsletter, 'submit', (e) => {
      e.preventDefault();
      const email = $('input[type="email"]', newsletter);
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!re.test(email.value)) {
        email.style.borderColor = 'var(--gold)';
        email.focus();
        return;
      }
      newsletterSuccess.classList.add('is-visible');
      email.value = '';
      window.setTimeout(() => newsletterSuccess.classList.remove('is-visible'), 5000);
    });
  }

  /* ============================================================
     SMOOTH SCROLL for in-page anchors (with nav offset)
     ============================================================ */
  $$('a[href^="#"]').forEach(link => {
    on(link, 'click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================================
     GALLERY: lightbox-free link prevention (placeholder)
     ============================================================ */
  $$('.tile').forEach(tile => {
    on(tile, 'click', (e) => e.preventDefault());
  });

})();
