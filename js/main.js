/**
 * NexaCore — main.js
 * Vanilla JavaScript — no frameworks
 * Features:
 *  1. Mobile navigation toggle
 *  2. FAQ accordion
 *  3. Contact form validation with live feedback
 *  4. Testimonials carousel
 *  5. Animated stat counters (Intersection Observer)
 *  6. Back-to-top button
 *  7. Footer year auto-update
 *  8. Character counter for textarea
 *  9. Scroll-reveal animations (Intersection Observer)
 * 10. Modal (quick connect)
 */

'use strict';

/* ── UTILITY ──────────────────────────────────────────────────── */

/**
 * Select a single element
 * @param {string} selector
 * @param {Document|Element} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Select all matching elements
 * @param {string} selector
 * @param {Document|Element} [scope=document]
 * @returns {NodeList}
 */
const $$ = (selector, scope = document) => scope.querySelectorAll(selector);

/* ── 1. MOBILE NAVIGATION ─────────────────────────────────────── */
(function initMobileNav() {
  const toggle  = $('#navToggle');
  const navMenu = $('#navMenu');

  if (!toggle || !navMenu) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.classList.toggle('open', !isExpanded);
  });

  // Close nav when a link is clicked (mobile UX)
  $$('a', navMenu).forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
    });
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navMenu.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
    }
  });

  // Close nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      toggle.focus();
    }
  });
})();

/* ── 2. FAQ ACCORDION ─────────────────────────────────────────── */
(function initFaqAccordion() {
  const faqList = $('#faqList');
  if (!faqList) return;

  const questions = $$('.faq-question', faqList);

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId   = btn.getAttribute('aria-controls');
      const answer     = $(`#${answerId}`);

      if (!answer) return;

      // Close all other open items
      questions.forEach(other => {
        if (other !== btn && other.getAttribute('aria-expanded') === 'true') {
          other.setAttribute('aria-expanded', 'false');
          const otherId = other.getAttribute('aria-controls');
          const otherAns = $(`#${otherId}`);
          if (otherAns) {
            otherAns.setAttribute('hidden', '');
            otherAns.style.maxHeight = null;
          }
        }
      });

      // Toggle current
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('hidden', '');
        answer.style.maxHeight = null;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
        // Animate open
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    // Keyboard: Enter and Space already work on buttons by default
  });
})();

/* ── 3. FORM VALIDATION ───────────────────────────────────────── */
(function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  const submitBtn    = $('#submitBtn');
  const formStatus   = $('#formStatus');
  const charCounter  = $('#charCount');
  const messageField = $('#message');

  // Real-time character counter
  if (messageField && charCounter) {
    messageField.addEventListener('input', () => {
      const len = messageField.value.length;
      const max = 500;
      charCounter.textContent = `${len} / ${max}`;
      charCounter.style.color = len > max * 0.9 ? '#fbbf24' : '';
      if (len > max) charCounter.style.color = '#f87171';
    });
  }

  /**
   * Validate a single field and return {valid, message}
   * @param {HTMLElement} field
   * @returns {{valid: boolean, message: string}}
   */
  function validateField(field) {
    const val = field.value.trim();

    if (field.required && !val) {
      return { valid: false, message: 'This field is required.' };
    }

    if (field.type === 'email' && val) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(val)) {
        return { valid: false, message: 'Please enter a valid email address.' };
      }
    }

    if (field.tagName === 'TEXTAREA' && field.required && val.length < 20) {
      return { valid: false, message: 'Please provide at least 20 characters.' };
    }

    if (field.tagName === 'SELECT' && field.required && !val) {
      return { valid: false, message: 'Please select an option.' };
    }

    return { valid: true, message: '' };
  }

  /**
   * Apply visual feedback to a field
   * @param {HTMLElement} field
   * @param {boolean} isValid
   * @param {string} errorMsg
   */
  function applyFieldFeedback(field, isValid, errorMsg) {
    const errorEl = $(`#${field.getAttribute('aria-describedby')?.split(' ')[0]}`);

    field.classList.toggle('error', !isValid);
    field.classList.toggle('valid', isValid && field.value.trim() !== '');

    if (errorEl) {
      errorEl.textContent = isValid ? '' : errorMsg;
    }
  }

  // Real-time validation on blur
  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('blur', () => {
      const { valid, message } = validateField(field);
      applyFieldFeedback(field, valid, message);
    });

    // Clear error on user input
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) {
        const { valid, message } = validateField(field);
        applyFieldFeedback(field, valid, message);
      }
    });
  });

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let allValid = true;

    // Validate all required fields
    $$('input[required], select[required], textarea[required]', form).forEach(field => {
      const { valid, message } = validateField(field);
      applyFieldFeedback(field, valid, message);
      if (!valid) allValid = false;
    });

    if (!allValid) {
      // Focus first invalid field
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();

      formStatus.textContent = 'Please fix the errors above before submitting.';
      formStatus.className   = 'error-state';
      return;
    }

    // Simulate async submission
    submitBtn.disabled = true;
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    if (btnText)    btnText.setAttribute('hidden', '');
    if (btnLoading) btnLoading.removeAttribute('hidden');

    formStatus.textContent = '';
    formStatus.className   = '';

    setTimeout(() => {
      // Success state
      submitBtn.disabled = false;
      if (btnText)    btnText.removeAttribute('hidden');
      if (btnLoading) btnLoading.setAttribute('hidden', '');

      formStatus.textContent = '✓ Message sent! We\'ll be in touch within one business day.';
      formStatus.className   = 'success';

      form.reset();
      if (charCounter) charCounter.textContent = '0 / 500';

      // Clear valid styling
      $$('.valid', form).forEach(f => f.classList.remove('valid'));

      // Scroll to status
      formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1800);
  });
})();

/* Also handle quick form in modal */
(function initQuickForm() {
  const form = $('#quickForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = $('#quickEmail');
    const errorEl    = $('#quickEmailError');
    const emailRe    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const val        = emailInput.value.trim();

    if (!val || !emailRe.test(val)) {
      emailInput.classList.add('error');
      errorEl.textContent = 'Please enter a valid email.';
      return;
    }

    emailInput.classList.remove('error');
    emailInput.classList.add('valid');
    errorEl.textContent = '';
    form.innerHTML = '<p style="color:#4ade80;font-family:var(--font-display);font-weight:600;text-align:center;padding:1rem 0">✓ We\'ll be in touch soon!</p>';

    setTimeout(() => closeModal(), 2000);
  });
})();

/* ── 4. TESTIMONIALS CAROUSEL ─────────────────────────────────── */
(function initTestimonials() {
  const cards   = $$('.testimonial-card');
  const dots    = $$('.dot', '#testimonialDots');
  const prevBtn = $('#prevTestimonial');
  const nextBtn = $('#nextTestimonial');

  if (!cards.length) return;

  let current = 0;
  let autoplay;

  function goTo(index) {
    const total = cards.length;
    const next  = (index + total) % total;

    // Deactivate current
    cards[current].classList.remove('active');
    cards[current].style.position = 'absolute';
    if (dots[current]) {
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
    }

    // Activate next
    current = next;
    cards[current].classList.add('active');
    cards[current].style.position = 'relative';
    if (dots[current]) {
      dots[current].classList.add('active');
      dots[current].setAttribute('aria-selected', 'true');
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
  });

  // Autoplay
  function startAutoplay() {
    autoplay = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplay);
    startAutoplay();
  }

  startAutoplay();

  // Pause on hover
  const slider = $('.testimonials-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(autoplay));
    slider.addEventListener('mouseleave', startAutoplay);
  }

  // Keyboard navigation for dots
  dots.forEach((dot, i) => {
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { goTo(i - 1); resetAutoplay(); dots[(i - 1 + dots.length) % dots.length].focus(); }
      if (e.key === 'ArrowRight') { goTo(i + 1); resetAutoplay(); dots[(i + 1) % dots.length].focus(); }
    });
  });
})();

/* ── 5. ANIMATED STAT COUNTERS ────────────────────────────────── */
(function initCounters() {
  const statNumbers = $$('[data-target]');
  if (!statNumbers.length) return;

  const suffixes = { 150: '+', 98: '%', 12: '' };

  /**
   * Animate a number from 0 to target
   * @param {Element} el
   * @param {number} target
   */
  function animateCounter(el, target) {
    const suffix   = el.textContent.replace(/\d/g, '').trim() || suffixes[target] || '';
    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.floor(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target + suffix;
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
})();

/* ── 6. BACK TO TOP ───────────────────────────────────────────── */
(function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  function toggleBtn() {
    const show = window.scrollY > 400;
    btn.hidden = !show;
  }

  window.addEventListener('scroll', toggleBtn, { passive: true });
  toggleBtn();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── 7. FOOTER YEAR ───────────────────────────────────────────── */
(function setFooterYear() {
  const year = new Date().getFullYear();
  $$('#footerYear, .footer-year').forEach(el => {
    el.textContent = year;
  });
})();

/* ── 8. SCROLL REVEAL ─────────────────────────────────────────── */
(function initScrollReveal() {
  // Inject base styles for the animation
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // Add .reveal to key elements
  const targets = [
    '.service-card',
    '.process-step',
    '.testimonial-card.active',
    '.service-detail-text',
    '.service-detail-visual',
    '.info-card',
    '.value-card',
    '.faq-item',
    '.section-header',
    '.about-text',
    '.cta-banner h2',
    '.cta-banner p',
    '.cta-banner .btn',
  ];

  targets.forEach(selector => {
    $$(selector).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.07}s`;
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$('.reveal').forEach(el => observer.observe(el));
})();

/* ── 9. HEADER SCROLL EFFECT ──────────────────────────────────── */
(function initHeaderScroll() {
  const header = $('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 20
      ? 'rgba(8,12,20,0.97)'
      : 'rgba(8,12,20,0.85)';
  }, { passive: true });
})();

/* ── 10. MODAL ────────────────────────────────────────────────── */
function closeModal() {
  const overlay = $('#modalOverlay');
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // Return focus to trigger
  const trigger = document._modalTrigger;
  if (trigger) trigger.focus();
}

(function initModal() {
  const overlay  = $('#modalOverlay');
  const closeBtn = $('#modalClose');

  if (!overlay) return;

  // Close on overlay click (outside modal box)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on close button
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Trap focus within modal
  overlay.addEventListener('keydown', (e) => {
    if (overlay.getAttribute('aria-hidden') === 'true') return;
    if (e.key !== 'Tab') return;

    const focusable = $$('button, input, select, textarea, a[href]', overlay);
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ── SHOW/HIDE SECTIONS (dynamic content) ─────────────────────── */
(function initServiceCards() {
  // Service cards on homepage: click to reveal extra info as a "show more" feature
  const cards = $$('.service-card');
  cards.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const link = card.querySelector('.card-link');
        if (link) { e.preventDefault(); link.click(); }
      }
    });
  });
})();
