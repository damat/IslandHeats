import { CONFIG } from '../config.js?v=__BUILD_ID__';
import { fetchEvents, getEventsForSlot } from './calendar-api.js';
import {
  formatTime,
  formatDate,
  generateTimeSlots,
  generateHourMarkers,
  getFetchRange,
  isPastSlot,
  toDateInputValue,
  fromDateInputValue,
  buildStartTimeOptions,
  computeEndTime,
  isWithinWorkingHours,
  formatDuration,
  addMinutes,
  startOfBangkokDay,
  addBangkokDays,
  isTodayBangkok,
  isSameBangkokDay,
  parseTimeOnDate,
  getDayBounds,
  getBangkokHour,
  formatWeekdayShort,
  formatDayNumber,
  formatBookingDateLabel,
  buildBookingDateOptions,
  buildGoogleCalendarTemplateUrl,
  getBookingWindow,
  isDateInBookingWindow,
  clampDateToBookingWindow,
  clampDateToBookableWindow,
  getBookableDateWindow,
  findNearestFreeSlot,
  calculateBookingPrice,
  formatPriceThb,
} from './schedule.js';
import {
  initLocale,
  setLocale,
  getLocale,
  t,
  tf,
  getSessionTypeLabel,
  LOCALE_LABELS,
} from './i18n.js';

const localeMap = { ru: 'ru-RU', en: 'en-US', th: 'th-TH' };
const BOOKING_WINDOW_DAYS = 7;

let selectedDate = startOfBangkokDay(new Date());
let events = [];
let loading = false;
let error = null;
let syncingHash = false;

const els = {
  app: document.getElementById('app'),
  dayLabel: document.getElementById('day-label'),
  schedule: document.getElementById('schedule'),
  scheduleStatus: document.getElementById('schedule-status'),
  btnMenu: document.getElementById('btn-menu'),
  btnMenuMobile: document.getElementById('btn-menu-mobile'),
  menuOverlay: document.getElementById('menu-overlay'),
  menuClose: document.getElementById('menu-close'),
  menuBody: document.getElementById('menu-body'),
  pricingOverlay: document.getElementById('pricing-overlay'),
  pricingClose: document.getElementById('pricing-close'),
  pricingBody: document.getElementById('pricing-body'),
  pricingTitle: document.getElementById('pricing-title'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnPrevMobile: document.getElementById('btn-prev-mobile'),
  btnNextMobile: document.getElementById('btn-next-mobile'),
  btnTodayDesktop: document.getElementById('btn-today-desktop'),
  btnBookDesktop: document.getElementById('btn-book-desktop'),
  btnBookMobile: document.getElementById('btn-book-mobile'),
  weekStrip: document.getElementById('week-strip'),
  scheduleScroll: document.getElementById('schedule-scroll'),
  modalOverlay: document.getElementById('modal-overlay'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  bookingOverlay: document.getElementById('booking-overlay'),
  bookingForm: document.getElementById('booking-form'),
  bookingClose: document.getElementById('booking-close'),
  toast: document.getElementById('toast'),
};

function getLocaleTag() {
  return localeMap[getLocale()] || 'en-US';
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  setTimeout(() => {
    els.toast.hidden = true;
  }, 4000);
}

function getPhoneDigits() {
  return String(CONFIG.whatsappPhone || '').replace(/\D/g, '');
}

function formatPhoneDisplay() {
  const digits = getPhoneDigits();
  if (!digits) return '';
  if (digits.startsWith('66') && digits.length >= 10) {
    const local = digits.slice(2);
    if (local.length === 9) {
      return `+66 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
  }
  return `+${digits}`;
}

function getWhatsAppChatUrl() {
  const group = CONFIG.whatsappGroupUrl?.trim();
  if (group) return group;
  const digits = getPhoneDigits();
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function getWhatsAppUrl(message) {
  const digits = getPhoneDigits();
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function getTelUrl() {
  const digits = getPhoneDigits();
  if (!digits) return null;
  return `tel:+${digits}`;
}

function buildCalendarEventTitle({ guestName, sessionLabel }) {
  const parts = [];
  const name = guestName?.trim();
  if (name) parts.push(name);
  if (sessionLabel) parts.push(sessionLabel);
  parts.push('Island Heats');
  return parts.join(' — ');
}

function init() {
  try {
    initLocale(CONFIG.locale);
    selectedDate = resolveInitialDate();
    syncDateHash();
    setupHeader();
    renderMenu();
    renderPricing();
    bindEvents();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('hashchange', onHashChange);
    render();
    loadSchedule();
  } catch (err) {
    console.error(err);
    showFatalError(err);
  }
}

function parseDateHash() {
  const raw = (location.hash || '').replace(/^#/, '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  try {
    return fromDateInputValue(raw);
  } catch {
    return null;
  }
}

function resolveInitialDate() {
  const fromHash = parseDateHash();
  if (fromHash && isDateInBookingWindow(fromHash, BOOKING_WINDOW_DAYS, BOOKING_WINDOW_DAYS)) {
    return startOfBangkokDay(fromHash);
  }
  return startOfBangkokDay(new Date());
}

function syncDateHash() {
  const next = `#${toDateInputValue(selectedDate)}`;
  if (location.hash === next) return;
  syncingHash = true;
  history.replaceState(null, '', next);
  syncingHash = false;
}

function onHashChange() {
  if (syncingHash) return;
  const next = resolveInitialDate();
  if (isSameBangkokDay(next, selectedDate)) return;
  selectedDate = next;
  render();
  loadSchedule();
}

function setupHeader() {
  const logo = document.getElementById('brand-logo');
  const buildId = window.BUILD_ID || '';
  const logoSrc = CONFIG.logoUrl
    ? `${CONFIG.logoUrl}${buildId ? `?v=${buildId}` : ''}`
    : '';
  if (logo && logoSrc) logo.src = logoSrc;
  updateHeaderHeight();
}

function updateHeaderHeight() {
  const header = document.querySelector('.header');
  if (header) {
    document.documentElement.style.setProperty(
      '--header-height',
      `${header.offsetHeight}px`,
    );
  }
}

function setMenuExpanded(expanded) {
  const value = expanded ? 'true' : 'false';
  els.btnMenu?.setAttribute('aria-expanded', value);
  els.btnMenuMobile?.setAttribute('aria-expanded', value);
}

function showFatalError(err) {
  els.scheduleStatus.hidden = false;
  els.scheduleStatus.className = 'schedule-status error';
  els.scheduleStatus.innerHTML = `
    <p class="error-title">${t('errorTitle')}</p>
    <p class="error-detail">${err?.message || err}</p>
  `;
}

function openOverlay(overlay) {
  overlay.classList.add('is-open');
  document.body.classList.add('modal-open');
}

function closeOverlay(overlay) {
  overlay.classList.remove('is-open');
  if (!document.querySelector('.overlay.is-open')) {
    document.body.classList.remove('modal-open');
  }
}

function bindEvents() {
  els.btnPrev?.addEventListener('click', () => changeDay(-1));
  els.btnNext?.addEventListener('click', () => changeDay(1));
  els.btnPrevMobile?.addEventListener('click', () => changeDay(-1));
  els.btnNextMobile?.addEventListener('click', () => changeDay(1));
  els.btnTodayDesktop?.addEventListener('click', goToToday);
  els.btnBookDesktop?.addEventListener('click', () => openBooking());
  els.btnBookMobile?.addEventListener('click', () => openBooking());
  els.modalClose?.addEventListener('click', closeModal);
  els.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
  els.bookingClose?.addEventListener('click', closeBooking);
  els.bookingOverlay?.addEventListener('click', (e) => {
    if (e.target === els.bookingOverlay) closeBooking();
  });
  els.bookingForm?.addEventListener('submit', onBookingSubmit);
  els.btnMenu?.addEventListener('click', openMenu);
  els.btnMenuMobile?.addEventListener('click', openMenu);
  els.menuClose?.addEventListener('click', closeMenu);
  els.menuOverlay?.addEventListener('click', (e) => {
    if (e.target === els.menuOverlay) closeMenu();
  });
  els.pricingClose?.addEventListener('click', closePricing);
  els.pricingOverlay?.addEventListener('click', (e) => {
    if (e.target === els.pricingOverlay) closePricing();
  });
}

const ICON_INSTAGRAM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`;
const ICON_MAPS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2"/></svg>`;
const ICON_WHATSAPP = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
const ICON_PHONE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const ICON_PRICING = '$';

function formatPlayersLabel(value) {
  if (value === '6+') return t('players6plus');
  return tf('playersUnit', { n: Number(value) });
}

function renderMenu() {
  if (!els.menuBody) return;
  const current = getLocale();
  const waUrl = getWhatsAppChatUrl();
  const telUrl = getTelUrl();
  const phoneDisplay = formatPhoneDisplay();
  els.btnMenu?.setAttribute('aria-label', t('menu'));
  els.btnMenuMobile?.setAttribute('aria-label', t('menu'));

  els.menuBody.innerHTML = `
    <div class="menu-section menu-section-lang">
      <div class="menu-list-label">${t('lang')}</div>
      <div class="menu-lang-row" role="group" aria-label="${t('lang')}">
      ${CONFIG.supportedLocales
        .map(
          (loc) =>
            `<button type="button" data-locale="${loc}" class="menu-item menu-item-lang${loc === current ? ' active' : ''}" aria-pressed="${loc === current}">${LOCALE_LABELS[loc]}</button>`,
        )
        .join('')}
      </div>
    </div>
    <div class="menu-section menu-section-links">
      <div class="menu-list-label">${t('menuInfoLinks')}</div>
      <a class="menu-item" href="${CONFIG.links?.instagram || '#'}" target="_blank" rel="noopener">
        <span class="menu-item-icon">${ICON_INSTAGRAM}</span>
        <span>${t('linkInstagram')}</span>
      </a>
      <a class="menu-item" href="${CONFIG.links?.location || '#'}" target="_blank" rel="noopener">
        <span class="menu-item-icon">${ICON_MAPS}</span>
        <span>${t('linkLocation')}</span>
      </a>
      ${
        waUrl
          ? `<a class="menu-item" href="${waUrl}" target="_blank" rel="noopener">
        <span class="menu-item-icon">${ICON_WHATSAPP}</span>
        <span>${t('linkWhatsApp')}</span>
      </a>`
          : ''
      }
      ${
        telUrl
          ? `<a class="menu-item" href="${telUrl}">
        <span class="menu-item-icon">${ICON_PHONE}</span>
        <span>${phoneDisplay}</span>
      </a>`
          : ''
      }
      <button type="button" class="menu-item menu-item-btn" id="btn-pricing">
        <span class="menu-item-icon menu-item-icon-dollar">${ICON_PRICING}</span>
        <span>${t('pricing')}</span>
      </button>
    </div>`;
  els.menuBody.querySelectorAll('.menu-item-lang').forEach((option) => {
    option.addEventListener('click', () => {
      setLocale(option.dataset.locale);
      document.documentElement.lang = getLocale();
      closeMenu();
      renderPricing();
      render();
      if (!loading && !error) renderSchedule();
    });
  });

  document.getElementById('btn-pricing')?.addEventListener('click', () => {
    closeMenu();
    openPricing();
  });
}

function renderPricing() {
  if (!els.pricingBody) return;
  els.pricingTitle.textContent = t('pricing');
  const askUrl = getWhatsAppUrl(t('pricingAskWhatsApp'));
  els.pricingBody.innerHTML = `
    <section class="pricing-block">
      <h3>${t('pricingCoachTitle')}</h3>
      <ul>
        <li>${t('pricingCoach1')}</li>
        <li>${t('pricingCoach2')}</li>
        <li>${t('pricingCoach3')}</li>
        <li>${t('pricingCoach4')}</li>
      </ul>
    </section>
    <section class="pricing-block">
      <h3>${t('pricingIndividualTitle')}</h3>
      <ul>
        <li>${t('pricingIndividual1')}</li>
        <li>${t('pricingIndividual2')}</li>
      </ul>
    </section>
    <section class="pricing-block">
      <h3>${t('pricingFullCourtTitle')}</h3>
      <ul>
        <li>${t('pricingFullCourt1')}</li>
        <li>${t('pricingFullCourt2')}</li>
        <li>${t('pricingFullCourt3')}</li>
      </ul>
    </section>
    <p class="pricing-ask">
      ${
        askUrl
          ? `<a href="${askUrl}" target="_blank" rel="noopener">${t('pricingAskMore')}</a>`
          : t('pricingAskMore')
      }
    </p>`;
}

function openMenu() {
  renderMenu();
  openOverlay(els.menuOverlay);
  setMenuExpanded(true);
}

function closeMenu() {
  closeOverlay(els.menuOverlay);
  setMenuExpanded(false);
}

function openPricing() {
  renderPricing();
  openOverlay(els.pricingOverlay);
}

function closePricing() {
  closeOverlay(els.pricingOverlay);
}

function goToToday() {
  selectedDate = startOfBangkokDay(new Date());
  syncDateHash();
  render();
  loadSchedule();
}

function selectDay(date) {
  selectedDate = clampDateToBookingWindow(date, BOOKING_WINDOW_DAYS, BOOKING_WINDOW_DAYS);
  syncDateHash();
  render();
  loadSchedule();
}

function changeDay(delta) {
  selectedDate = clampDateToBookingWindow(
    addBangkokDays(selectedDate, delta),
    BOOKING_WINDOW_DAYS,
    BOOKING_WINDOW_DAYS,
  );
  syncDateHash();
  render();
  loadSchedule();
}

function updateNavDisabled() {
  const { minDate, maxDate } = getBookingWindow(BOOKING_WINDOW_DAYS, BOOKING_WINDOW_DAYS);
  const atMin = isSameBangkokDay(selectedDate, minDate);
  const atMax = isSameBangkokDay(selectedDate, maxDate);
  [els.btnPrev, els.btnPrevMobile].forEach((btn) => btn?.toggleAttribute('disabled', atMin));
  [els.btnNext, els.btnNextMobile].forEach((btn) => btn?.toggleAttribute('disabled', atMax));
}

async function loadSchedule() {
  loading = true;
  error = null;
  renderScheduleStatus();

  try {
    const { timeMin, timeMax } = getFetchRange(selectedDate);
    events = await fetchEvents(timeMin, timeMax);
  } catch (err) {
    error = err.message === 'API_KEY_MISSING' ? 'API_KEY_MISSING' : err.message;
  } finally {
    loading = false;
    renderScheduleStatus();
    if (!error) renderSchedule();
  }
}

function render() {
  document.title = `${t('siteName')} — ${t('siteTitle')}`;
  document.documentElement.lang = getLocale();
  els.btnPrev?.setAttribute('aria-label', t('prevDay'));
  els.btnNext?.setAttribute('aria-label', t('nextDay'));
  els.btnPrevMobile?.setAttribute('aria-label', t('prevDay'));
  els.btnNextMobile?.setAttribute('aria-label', t('nextDay'));
  els.btnTodayDesktop.textContent = t('today');
  els.btnBookDesktop.textContent = t('bookCourt');
  els.btnBookMobile.textContent = t('bookCourt');
  if (!window.matchMedia('(min-width: 768px)').matches) {
    els.dayLabel.textContent = '';
  } else {
    els.dayLabel.textContent = formatDate(selectedDate, getLocaleTag());
  }
  renderWeekStrip();
  renderTodayButtons();
  updateNavDisabled();
  setupHeader();
  renderMenu();
  if (els.menuClose) {
    els.menuClose.setAttribute('aria-label', t('close'));
    const label = document.getElementById('menu-close-label');
    if (label) label.textContent = t('close');
  }
  renderPricing();
  renderScheduleStatus();
}

function renderWeekStrip() {
  if (!els.weekStrip) return;
  const locale = getLocaleTag();
  const { minDate, maxDate } = getBookingWindow(BOOKING_WINDOW_DAYS, BOOKING_WINDOW_DAYS);
  const days = Array.from({ length: 5 }, (_, i) => addBangkokDays(selectedDate, i - 2));

  els.weekStrip.innerHTML = days
    .map((day) => {
      const selected = isSameBangkokDay(day, selectedDate);
      const today = isTodayBangkok(day);
      const outOfRange = day < minDate || day > maxDate;
      return `
        <button type="button"
          class="week-day${selected ? ' selected' : ''}${today ? ' is-today' : ''}"
          data-date="${toDateInputValue(day)}"
          role="tab"
          aria-selected="${selected}"
          ${outOfRange ? 'disabled' : ''}>
          <span class="week-day-name">${formatWeekdayShort(day, locale)}</span>
          <span class="week-day-num">${formatDayNumber(day)}</span>
        </button>`;
    })
    .join('');

  els.weekStrip.querySelectorAll('.week-day:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectDay(fromDateInputValue(btn.dataset.date));
    });
  });
}

function renderTodayButtons() {
  const onToday = isTodayBangkok(selectedDate);
  els.btnTodayDesktop?.classList.toggle('is-active', !onToday);
  els.btnTodayDesktop?.toggleAttribute('disabled', onToday);
}

function renderScheduleStatus() {
  if (loading) {
    els.scheduleStatus.hidden = false;
    els.schedule.innerHTML = '';
    els.scheduleStatus.className = 'schedule-status loading';
    els.scheduleStatus.innerHTML = `<div class="spinner"></div><p>${t('loading')}</p>`;
    return;
  }

  if (error) {
    els.scheduleStatus.hidden = false;
    els.schedule.innerHTML = '';
    els.scheduleStatus.className = 'schedule-status error';
    const hint =
      error === 'API_KEY_MISSING'
        ? 'Set CONFIG.apiKey or CONFIG.appsScriptUrl in config.js (see README).'
        : t('errorHint');
    els.scheduleStatus.innerHTML = `
      <p class="error-title">${t('errorTitle')}</p>
      <p class="error-hint">${hint}</p>
      <p class="error-detail">${error === 'API_KEY_MISSING' ? '' : error}</p>
      <button type="button" class="btn btn-secondary" id="btn-retry">${t('retry')}</button>
    `;
    document.getElementById('btn-retry')?.addEventListener('click', loadSchedule);
    return;
  }

  els.scheduleStatus.hidden = true;
}

function renderSchedule() {
  if (loading || error) return;

  const slots = generateTimeSlots(selectedDate);
  const hourMarkers = generateHourMarkers(selectedDate);
  const locale = getLocaleTag();

  const totalMinutes =
    (CONFIG.workingHours.end - CONFIG.workingHours.start) * 60;
  const slotHeight = CONFIG.slotMinutes;
  const slotRow = 48;
  const slotGap = 4;
  const slotInset = slotGap / 2;
  const slotVisualH = slotRow - slotGap;
  const gridHeight = (totalMinutes / slotHeight) * slotRow;
  const gridPad = 0;

  let html = `<div class="schedule-grid" style="--grid-height: ${gridHeight}px; --slot-h: ${slotRow}px; --slot-visual-h: ${slotVisualH}px; --grid-pad: ${gridPad}px">`;

  html += '<div class="time-axis">';
  hourMarkers.forEach((h) => {
    const top =
      gridPad +
      ((getBangkokHour(h) - CONFIG.workingHours.start) * 60) / slotHeight * slotRow;
    html += `<div class="time-label" style="top: ${top}px">${formatTime(h, locale)}</div>`;
  });
  html += '</div>';

  html += '<div class="slots-area">';
  html += '<div class="hour-lines">';
  hourMarkers.forEach((h) => {
    const top =
      gridPad +
      ((getBangkokHour(h) - CONFIG.workingHours.start) * 60) / slotHeight * slotRow;
    html += `<div class="hour-line" style="top: ${top}px"></div>`;
  });
  html += '</div>';

  slots.forEach((slot, i) => {
    const top = gridPad + i * slotRow + slotInset;
    const overlapping = getEventsForSlot(events, slot.start, slot.end);
    const past = isPastSlot(slot.end);
    const isHour = slot.start.getMinutes() === 0;

    if (overlapping.length === 0) {
      html += `
        <button type="button"
          class="slot slot-free${past ? ' slot-past' : ''}${isHour ? ' slot-hour' : ''}"
          style="top: ${top}px; height: ${slotVisualH}px"
          data-start="${slot.start.toISOString()}"
          ${past ? 'disabled' : ''}
          aria-label="${formatTime(slot.start, locale)} — ${t('free')}">
          <span class="slot-label">${isHour ? '' : formatTime(slot.start, locale)}</span>
        </button>`;
    }
  });

  const dayEvents = events.filter((e) => !e.allDay && eventOnDay(e, selectedDate));
  dayEvents.forEach((event) => {
    const top = gridPad + slotTopFromDate(event.start, selectedDate) + slotInset;
    const height = Math.max(
      slotHeightFromRange(event.start, event.end, selectedDate) - slotGap,
      20,
    );
    const label = event.isPrivate ? t('private') : event.summary || t('busy');
    const typeLabel = t(`eventTypes.${event.type.id}`);
    const playersLine =
      !event.isPrivate && event.players
        ? `<span class="event-players">${escapeHtml(formatPlayersLabel(event.players))}</span>`
        : '';

    html += `
      <button type="button"
        class="event-block${event.isPrivate ? ' event-private' : ''}"
        style="top: ${top}px; height: ${height}px; --event-color: ${event.type.color}; --event-bg: ${event.type.bg}"
        data-event-id="${event.id}"
        aria-label="${label}">
        <span class="event-type-badge">${typeLabel}</span>
        <span class="event-title">${escapeHtml(label)}</span>
        ${playersLine}
        <span class="event-time">${formatTime(event.start, locale)} – ${formatTime(event.end, locale)}</span>
      </button>`;
  });

  html += '</div></div>';

  els.schedule.innerHTML = html;

  els.schedule.querySelectorAll('.slot-free:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      openBooking(new Date(btn.dataset.start));
    });
  });

  els.schedule.querySelectorAll('.event-block').forEach((btn) => {
    btn.addEventListener('click', () => {
      const event = dayEvents.find((e) => e.id === btn.dataset.eventId);
      if (event) openEventModal(event);
    });
  });

  scrollToCurrentTime();
}

function scrollToCurrentTime() {
  if (!isTodayBangkok(selectedDate) || !els.scheduleScroll) return;

  const now = new Date();
  const { start: dayStart } = getDayBounds(selectedDate);
  const minutesFromStart = (now - dayStart) / 60_000;
  if (minutesFromStart < 60) {
    els.scheduleScroll.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  const topPx = (minutesFromStart / CONFIG.slotMinutes) * 48;
  const target = Math.max(0, topPx - els.scheduleScroll.clientHeight * 0.2);
  els.scheduleScroll.scrollTo({ top: target, behavior: 'smooth' });
}

function eventOnDay(event, date) {
  const dayStart = startOfBangkokDay(date);
  const dayEnd = addBangkokDays(dayStart, 1);
  return event.start < dayEnd && event.end > dayStart;
}

function slotTopFromDate(date, day) {
  const { start: dayStart } = getDayBounds(day);
  const minutes = (date - dayStart) / 60_000;
  return (minutes / CONFIG.slotMinutes) * 48;
}

function slotHeightFromRange(start, end, day) {
  const { start: dayStart, end: dayEnd } = getDayBounds(day);
  const clampedStart = start < dayStart ? dayStart : start;
  const clampedEnd = end > dayEnd ? dayEnd : end;
  const minutes = (clampedEnd - clampedStart) / 60_000;
  return Math.max((minutes / CONFIG.slotMinutes) * 48, 24);
}

function openEventModal(event) {
  const locale = getLocaleTag();
  const title = event.isPrivate ? t('private') : event.summary || t('busy');
  els.modalTitle.textContent = title;

  if (event.isPrivate) {
    els.modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${t('time')}</span>
        <span>${formatTime(event.start, locale)} – ${formatTime(event.end, locale)}</span>
      </div>
      <p class="private-notice">${t('private')}</p>`;
  } else {
    els.modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${t('time')}</span>
        <span>${formatTime(event.start, locale)} – ${formatTime(event.end, locale)}</span>
      </div>
      ${
        event.description
          ? `<div class="detail-row detail-description">
              <span class="detail-label">${t('description')}</span>
              <div class="detail-text">${escapeHtml(event.description)}</div>
            </div>`
          : `<p class="muted">${t('noDescription')}</p>`
      }`;
  }

  openOverlay(els.modalOverlay);
}

function closeModal() {
  closeOverlay(els.modalOverlay);
}

function openBooking(prefillStart = null) {
  const locale = getLocaleTag();
  const durationDefault = CONFIG.defaultDurationMinutes;
  const today = startOfBangkokDay(new Date());
  const activeDay = clampDateToBookableWindow(selectedDate, BOOKING_WINDOW_DAYS);
  let initialStart = prefillStart;

  if (initialStart && (initialStart < new Date() || startOfBangkokDay(initialStart) < today)) {
    initialStart = null;
  }

  if (!initialStart) {
    const nearest = findNearestFreeSlot(events, durationDefault, {
      preferDate: activeDay,
      daysAfter: BOOKING_WINDOW_DAYS,
    });
    initialStart = nearest?.start || null;
  }

  const date = initialStart ? startOfBangkokDay(initialStart) : activeDay;
  const timeOptions = buildStartTimeOptions(date);
  const dateOptions = buildBookingDateOptions(today, 0, BOOKING_WINDOW_DAYS);
  const defaultStart = initialStart
    ? formatTime(initialStart, 'en-GB')
    : timeOptions.find((o) => !isPastSlot(o.end) && getEventsForSlot(events, o.start, computeEndTime(o.start, durationDefault)).length === 0)?.value ||
      timeOptions.find((o) => !isPastSlot(o.end))?.value ||
      timeOptions[0]?.value;
  const defaultDate = toDateInputValue(date);
  const telUrl = getTelUrl();
  const playerOptions = [1, 2, 3, 4, 5, 6];

  els.bookingForm.innerHTML = `
    <div class="form-grid">
      <label class="field">
        <span>${t('date')}</span>
        <select name="date" required>
          ${dateOptions
            .map(
              (o) =>
                `<option value="${o.value}"${o.value === defaultDate ? ' selected' : ''}>${formatBookingDateLabel(o.date, locale)}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label class="field">
        <span>${t('startTime')}</span>
        <select name="startTime" required>
          ${timeOptions
            .map(
              (o) =>
                `<option value="${o.value}"${o.value === defaultStart ? ' selected' : ''}${isPastSlot(o.end) ? ' disabled' : ''}>${formatTime(o.start, locale)}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label class="field">
        <span>${t('duration')}</span>
        <select name="duration" required>
          ${CONFIG.durationOptions
            .map(
              (m) =>
                `<option value="${m}"${m === CONFIG.defaultDurationMinutes ? ' selected' : ''}>${formatDuration(m, t)}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label class="field">
        <span>${t('players')}</span>
        <select name="players" required>
          ${playerOptions
            .map((n) => `<option value="${n}"${n === 1 ? ' selected' : ''}>${formatPlayersLabel(String(n))}</option>`)
            .join('')}
          <option value="6+">${t('players6plus')}</option>
        </select>
      </label>
      <label class="field">
        <span>${t('guestName')}</span>
        <input type="text" name="guestName" maxlength="60" placeholder="${t('guestNamePlaceholder')}" autocomplete="name">
      </label>
      <label class="field">
        <span>${t('sessionType')}</span>
        <select name="sessionType">
          <option value="open" selected>${t('sessionTypeOpen')}</option>
          <option value="training">${t('sessionTypeTraining')}</option>
          <option value="fullcourt">${t('sessionTypeFullCourt')}</option>
        </select>
      </label>
    </div>
    <p class="booking-summary" id="booking-summary"></p>
    <p class="conflict-hint" id="conflict-hint" hidden>${t('conflictWarning')}</p>
    <div class="form-actions form-actions-single">
      <button type="submit" class="btn btn-primary">${t('submitBooking')}</button>
    </div>
    <p class="booking-footer">
      ${t('bookingNotice')}
      ${t('bookingCallShort')}
      ${
        telUrl
          ? `<a class="booking-call-link" href="${telUrl}">${t('callAction')}</a>`
          : t('callAction')
      }.
    </p>`;

  const dateSelect = els.bookingForm.querySelector('[name="date"]');
  const startSelect = els.bookingForm.querySelector('[name="startTime"]');
  const durationSelect = els.bookingForm.querySelector('[name="duration"]');
  const playersSelect = els.bookingForm.querySelector('[name="players"]');
  const guestNameInput = els.bookingForm.querySelector('[name="guestName"]');
  const sessionTypeSelect = els.bookingForm.querySelector('[name="sessionType"]');
  const summaryEl = document.getElementById('booking-summary');
  const conflictHint = document.getElementById('conflict-hint');

  function updateSummaryAndConflict() {
    const d = fromDateInputValue(dateSelect.value);
    const start = parseTimeOnDate(d, startSelect.value);
    const duration = Number(durationSelect.value);
    const end = computeEndTime(start, duration);
    const players = formatPlayersLabel(playersSelect.value);
    const guestName = guestNameInput.value.trim();
    const sessionType = sessionTypeSelect.value;
    const price = calculateBookingPrice(playersSelect.value, sessionType, duration);
    const priceLabel = formatPriceThb(price.amount, price.plus, getLocale());
    const summaryText = tf('bookingSummary', {
      name: guestName,
      date: formatBookingDateLabel(d, locale),
      start: formatTime(start, locale),
      end: formatTime(end, locale),
      players,
      price: priceLabel,
    });

    summaryEl.innerHTML = `${escapeHtml(summaryText)}<button type="button" class="price-hint-btn" aria-label="${escapeHtml(t('priceHintLabel'))}" aria-expanded="false"><span class="price-hint-amount">${escapeHtml(priceLabel)}</span><span class="price-hint-icon" aria-hidden="true">?</span></button><span class="price-hint-popover" hidden role="tooltip">${escapeHtml(t('priceHintText')).replace(/\n/g, '<br>')}</span>`;

    const hintBtn = summaryEl.querySelector('.price-hint-btn');
    const popover = summaryEl.querySelector('.price-hint-popover');
    hintBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const open = popover.hidden;
      popover.hidden = !open;
      hintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    const hasConflict = events.some(
      (e) =>
        !e.allDay &&
        e.start < end &&
        e.end > start &&
        eventOnDay(e, d),
    );
    conflictHint.hidden = !hasConflict;
  }

  function refreshStartOptions() {
    const d = fromDateInputValue(dateSelect.value);
    const opts = buildStartTimeOptions(d);
    const current = startSelect.value;
    const firstFree = opts.find((o) => !isPastSlot(o.end))?.value;
    startSelect.innerHTML = opts
      .map(
        (o) =>
          `<option value="${o.value}"${isPastSlot(o.end) ? ' disabled' : ''}>${formatTime(o.start, locale)}</option>`,
      )
      .join('');
    if (opts.some((o) => o.value === current && !isPastSlot(o.end))) {
      startSelect.value = current;
    } else if (firstFree) {
      startSelect.value = firstFree;
    }
    updateSummaryAndConflict();
  }

  dateSelect.addEventListener('change', refreshStartOptions);
  startSelect.addEventListener('change', updateSummaryAndConflict);
  durationSelect.addEventListener('change', updateSummaryAndConflict);
  playersSelect.addEventListener('change', updateSummaryAndConflict);
  guestNameInput.addEventListener('input', updateSummaryAndConflict);
  sessionTypeSelect.addEventListener('change', updateSummaryAndConflict);
  updateSummaryAndConflict();

  openOverlay(els.bookingOverlay);
}

function closeBooking() {
  closeOverlay(els.bookingOverlay);
}

function onBookingSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.bookingForm);
  const sessionType = fd.get('sessionType')?.toString();
  const guestName = fd.get('guestName')?.toString().trim() || '';
  const players = fd.get('players')?.toString();
  const dateVal = fromDateInputValue(fd.get('date').toString());
  const duration = Number(fd.get('duration'));
  const start = parseTimeOnDate(dateVal, fd.get('startTime').toString());
  const end = addMinutes(start, duration);
  const locale = getLocaleTag();

  if (start < new Date() || startOfBangkokDay(dateVal) < startOfBangkokDay(new Date())) {
    showToast(t('pastBooking'));
    return;
  }

  if (!isWithinWorkingHours(start, end)) {
    showToast(t('invalidTime'));
    return;
  }

  const sessionLabel = getSessionTypeLabel(sessionType);
  const playersLabel = formatPlayersLabel(players);
  const price = calculateBookingPrice(players, sessionType, duration);
  const priceLabel = formatPriceThb(price.amount, price.plus, getLocale());
  const calendarDetails = [
    `Island Heats court`,
    guestName ? `Name: ${guestName}` : '',
    `Players: ${playersLabel}`,
    sessionLabel ? `Type: ${sessionLabel}` : '',
    `Price: ${priceLabel}`,
  ]
    .filter(Boolean)
    .join('\n');

  const calendarUrl = buildGoogleCalendarTemplateUrl(start, end, {
    title: buildCalendarEventTitle({ guestName, sessionLabel }),
    details: calendarDetails,
  });

  const message = tf('whatsappMessage', {
    name: guestName,
    date: formatBookingDateLabel(dateVal, locale),
    start: formatTime(start, locale),
    end: formatTime(end, locale),
    players: playersLabel,
    price: priceLabel,
    sessionType: sessionLabel,
    addToCalendar: t('addToCalendar'),
    calendarUrl,
  });

  if (CONFIG.whatsappPhone) {
    const url = getWhatsAppUrl(message);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
    closeBooking();
  } else {
    navigator.clipboard?.writeText(message).then(() => {
      showToast(t('whatsappNotConfigured'));
    }).catch(() => {
      showToast(t('whatsappNotConfigured'));
    });
    closeBooking();
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

init();
