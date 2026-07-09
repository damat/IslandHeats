import { CONFIG } from '../config.js?v=__BUILD_ID__';
import { fetchEvents, getEventsForSlot, eventsFingerprint } from './calendar-api.js';
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
const NAV_DAYS_BEFORE = 2;
const NAV_DAYS_AFTER = 7;

let selectedDate = startOfBangkokDay(new Date());
let events = [];
let eventsCache = null;
let loading = false;
let error = null;
let syncingHash = false;
let silentRefreshInFlight = false;
let toastHideTimer = null;
let pendingInitialScroll = null;
let restoreScheduleScroll = null;

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
  bookingLimitOverlay: document.getElementById('booking-limit-overlay'),
  bookingLimitTitle: document.getElementById('booking-limit-title'),
  bookingLimitText: document.getElementById('booking-limit-text'),
  bookingLimitActions: document.getElementById('booking-limit-actions'),
  bookingLimitClose: document.getElementById('booking-limit-close'),
  toast: document.getElementById('toast'),
};

function getLocaleTag() {
  return localeMap[getLocale()] || 'en-US';
}

function getCurrentFetchRange(fromDate = new Date()) {
  return getFetchRange(NAV_DAYS_BEFORE, NAV_DAYS_AFTER, fromDate);
}

function cacheCoversCurrentWindow(fromDate = new Date()) {
  if (!eventsCache) return false;
  const range = getCurrentFetchRange(fromDate);
  return (
    eventsCache.minDate.getTime() === range.minDate.getTime() &&
    eventsCache.maxDate.getTime() === range.maxDate.getTime()
  );
}

function isDateInCachedRange(date) {
  if (!eventsCache) return false;
  const day = startOfBangkokDay(date);
  return day >= eventsCache.minDate && day <= eventsCache.maxDate;
}

function updateEventsCache(fetchedEvents, range) {
  eventsCache = {
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    minDate: range.minDate,
    maxDate: range.maxDate,
    events: fetchedEvents,
    fingerprint: eventsFingerprint(fetchedEvents),
    fetchedAt: Date.now(),
  };
  events = fetchedEvents;
}

function getDayEvents(date) {
  return events.filter((event) => !event.allDay && eventOnDay(event, date));
}

function refreshScheduleSilent() {
  return loadSchedule({ silent: true });
}

function showToast(message) {
  if (toastHideTimer) clearTimeout(toastHideTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastHideTimer = setTimeout(() => {
    els.toast.hidden = true;
    toastHideTimer = null;
  }, 4000);
}

function buildWhatsAppButton(label, message) {
  const url = getWhatsAppUrl(message);
  if (!url) return '';
  return `<a href="${escapeHtml(url)}" class="btn btn-primary btn-whatsapp" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function openBookingLimitSheet() {
  if (!els.bookingLimitOverlay) return;
  els.bookingLimitTitle.textContent = t('bookingLimitTitle');
  els.bookingLimitText.textContent = t('bookingLimitMessage');
  els.bookingLimitActions.innerHTML = buildWhatsAppButton(
    t('bookingLimitContact'),
    t('bookingLimitWhatsApp'),
  );
  els.bookingLimitClose?.setAttribute('aria-label', t('close'));
  openOverlay(els.bookingLimitOverlay);
}

function closeBookingLimitSheet() {
  closeOverlay(els.bookingLimitOverlay);
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
    pendingInitialScroll = isTodayBangkok(selectedDate) ? 'today' : 'skip';
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
  if (fromHash && isDateInBookingWindow(fromHash, NAV_DAYS_BEFORE, NAV_DAYS_AFTER)) {
    return startOfBangkokDay(fromHash);
  }
  return startOfBangkokDay(new Date());
}

function syncDateHash() {
  const nextHash = isTodayBangkok(selectedDate)
    ? ''
    : `#${toDateInputValue(selectedDate)}`;
  if (location.hash === nextHash) return;
  syncingHash = true;
  const nextUrl = `${location.pathname}${location.search}${nextHash}`;
  history.replaceState(null, '', nextUrl);
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

function isDesktopKeyboardNav() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function isKeyboardEditableTarget(target) {
  return target instanceof Element && Boolean(
    target.closest('input, select, textarea, [contenteditable="true"]'),
  );
}

function bindKeyboardDayNav() {
  if (bindKeyboardDayNav.bound) return;
  bindKeyboardDayNav.bound = true;

  document.addEventListener('keydown', (e) => {
    if (!isDesktopKeyboardNav()) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isKeyboardEditableTarget(e.target)) return;
    if (document.querySelector('.overlay.is-open')) return;
    if (loading || scheduleSwipeAnimating || scheduleSwipeTransition) return;

    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowRight') delta = 1;
    else return;

    e.preventDefault();
    changeDay(delta);
  });
}

function bindEvents() {
  els.btnPrev?.addEventListener('click', () => changeDay(-1));
  els.btnNext?.addEventListener('click', () => changeDay(1));
  els.btnPrevMobile?.addEventListener('click', () => changeDay(-1));
  els.btnNextMobile?.addEventListener('click', () => changeDay(1));
  els.btnTodayDesktop?.addEventListener('click', goToToday);
  els.btnBookDesktop?.addEventListener('click', () => openBooking());
  els.btnBookMobile?.addEventListener('click', () => openBooking());
  bindKeyboardDayNav();
  bindScheduleSwipe();
  els.modalClose?.addEventListener('click', closeModal);
  els.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
  els.bookingClose?.addEventListener('click', closeBooking);
  els.bookingOverlay?.addEventListener('click', (e) => {
    if (e.target === els.bookingOverlay) closeBooking();
  });
  els.bookingLimitClose?.addEventListener('click', closeBookingLimitSheet);
  els.bookingLimitOverlay?.addEventListener('click', (e) => {
    if (e.target === els.bookingLimitOverlay) closeBookingLimitSheet();
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

const SCHEDULE_SWIPE = {
  minDistance: 40,
  lockDistance: 10,
  horizontalRatio: 1.15,
  edgeGuard: 20,
  commitRatio: 0.28,
  rubberBandLimit: 56,
};

let scheduleSwipeState = null;
let scheduleSwipeAnimating = false;
let scheduleSwipeTransition = false;

function isMobileSchedule() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function getTouchPoint(e, listName) {
  const list = e[listName];
  if (list && list.length > 0) return list[0];
  if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) return e;
  return null;
}

function resetScheduleSwipe() {
  scheduleSwipeState = null;
}

function rubberBandSwipe(dx) {
  const limit = SCHEDULE_SWIPE.rubberBandLimit;
  const absDx = Math.abs(dx);
  if (absDx <= limit) return dx;
  const sign = Math.sign(dx);
  return sign * (limit + (absDx - limit) * 0.22);
}

function getSwipeViewportWidth() {
  return els.schedule.clientWidth || els.scheduleScroll?.clientWidth || window.innerWidth;
}

function buildScheduleGridHtml(date, dayEvents = [], { preview = false } = {}) {
  const slots = generateTimeSlots(date);
  const hourMarkers = generateHourMarkers(date);
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

  let html = `<div class="schedule-grid${preview ? ' schedule-grid--preview' : ''}" style="--grid-height: ${gridHeight}px; --slot-h: ${slotRow}px; --slot-visual-h: ${slotVisualH}px; --grid-pad: ${gridPad}px">`;

  html += '<div class="time-axis">';
  hourMarkers.forEach((h) => {
    const top =
      gridPad +
      ((getBangkokHour(h) - CONFIG.workingHours.start) * 60) / slotHeight * slotRow +
      slotRow / 2;
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
    const past = isPastSlot(slot.end);
    const isHour = slot.start.getMinutes() === 0;

    if (!preview) {
      const overlapping = getEventsForSlot(events, slot.start, slot.end);
      if (overlapping.length > 0) return;
    }

    if (preview) {
      html += `
        <div
          class="slot slot-free slot-preview${past ? ' slot-past' : ''}${isHour ? ' slot-hour' : ''}"
          style="top: ${top}px; height: ${slotVisualH}px"
          aria-hidden="true">
          <span class="slot-label">${isHour ? '' : formatTime(slot.start, locale)}</span>
        </div>`;
      return;
    }

    html += `
      <button type="button"
        class="slot slot-free${past ? ' slot-past' : ''}${isHour ? ' slot-hour' : ''}"
        style="top: ${top}px; height: ${slotVisualH}px"
        data-start="${slot.start.toISOString()}"
        ${past ? 'disabled' : ''}
        aria-label="${formatTime(slot.start, locale)} — ${t('free')}">
        <span class="slot-label">${isHour ? '' : formatTime(slot.start, locale)}</span>
      </button>`;
  });

  if (!preview) {
    dayEvents.forEach((event) => {
      const eventInset = 4;
      const top = gridPad + slotTopFromDate(event.start, date) + eventInset;
      const height = Math.max(
        slotHeightFromRange(event.start, event.end, date) - eventInset * 2,
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
  }

  html += '</div></div>';
  return html;
}

function buildSchedulePreviewPanel(date) {
  const dayEvents = isDateInCachedRange(date) ? getDayEvents(date) : [];
  return isDateInCachedRange(date)
    ? buildScheduleGridHtml(date, dayEvents)
    : buildScheduleGridHtml(date, [], { preview: true });
}

function bindScheduleGridInteractions(dayEvents) {
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
}

function setupSwipeViewport(state) {
  const grid = els.schedule.querySelector('.schedule-grid');
  if (!grid) return;

  const viewport = document.createElement('div');
  viewport.className = 'schedule-swipe-viewport is-dragging';

  const currentPanel = document.createElement('div');
  currentPanel.className = 'schedule-swipe-panel schedule-swipe-current';

  const incomingPanel = document.createElement('div');
  incomingPanel.className = 'schedule-swipe-panel schedule-swipe-incoming';
  incomingPanel.innerHTML = buildSchedulePreviewPanel(state.targetDate);

  currentPanel.appendChild(grid);
  viewport.appendChild(currentPanel);
  viewport.appendChild(incomingPanel);
  els.schedule.appendChild(viewport);

  state.viewport = viewport;
  state.currentPanel = currentPanel;
  state.incomingPanel = incomingPanel;
}

function applySwipeTransform(dx, state) {
  const width = state.width;
  const resistedDx = state.canComplete ? dx : rubberBandSwipe(dx);

  if (state.canComplete && state.currentPanel && state.incomingPanel) {
    const incomingBase = state.direction > 0 ? width : -width;
    state.currentPanel.style.transform = `translate3d(${resistedDx}px, 0, 0)`;
    state.incomingPanel.style.transform = `translate3d(${incomingBase + resistedDx}px, 0, 0)`;
    const threshold = Math.max(SCHEDULE_SWIPE.minDistance, width * SCHEDULE_SWIPE.commitRatio);
    state.viewport?.classList.toggle('threshold-met', Math.abs(resistedDx) >= threshold);
    return;
  }

  const grid = els.schedule.querySelector('.schedule-grid');
  if (grid) grid.style.transform = `translate3d(${resistedDx}px, 0, 0)`;
}

function initSwipePanels(dx) {
  const direction = dx < 0 ? 1 : -1;
  const targetDate = clampDateToBookingWindow(
    addBangkokDays(selectedDate, direction),
    NAV_DAYS_BEFORE,
    NAV_DAYS_AFTER,
  );
  const canComplete = !isSameBangkokDay(targetDate, selectedDate);

  scheduleSwipeState.direction = direction;
  scheduleSwipeState.targetDate = targetDate;
  scheduleSwipeState.canComplete = canComplete;
  scheduleSwipeState.width = getSwipeViewportWidth();
  scheduleSwipeState.deltaX = dx;

  if (canComplete) setupSwipeViewport(scheduleSwipeState);
  applySwipeTransform(dx, scheduleSwipeState);
}

function animateElementTransform(el, toX) {
  return new Promise((resolve) => {
    if (!el) {
      resolve();
      return;
    }
    const done = () => {
      el.removeEventListener('transitionend', done);
      el.style.transition = '';
      resolve();
    };
    el.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = `translate3d(${toX}px, 0, 0)`;
    el.addEventListener('transitionend', done);
    setTimeout(done, 280);
  });
}

async function applyDayChangeAfterTransition(targetDate, viewport) {
  selectedDate = targetDate;
  syncDateHash();
  render();

  const cached = isDateInCachedRange(targetDate) && eventsCache;
  if (cached) {
    events = eventsCache.events;
    viewport?.remove();
    renderSchedule();
    void refreshScheduleSilent();
    return;
  }

  const incomingPanel = viewport?.querySelector('.schedule-swipe-incoming');
  incomingPanel?.classList.add('is-loading');
  loading = true;
  error = null;
  try {
    const range = getCurrentFetchRange();
    const fetched = await fetchEvents(range.timeMin, range.timeMax);
    updateEventsCache(fetched, range);
  } catch (err) {
    error = err.message === 'API_KEY_MISSING' ? 'API_KEY_MISSING' : err.message;
  } finally {
    loading = false;
    viewport?.remove();
    if (error) renderScheduleStatus();
    else renderSchedule();
  }
}

async function runDayTransitionAnimation({ currentPanel, incomingPanel, width, direction }) {
  await Promise.all([
    animateElementTransform(currentPanel, -direction * width),
    animateElementTransform(incomingPanel, 0),
  ]);
}

function createDayTransitionViewport(targetDate, direction) {
  const grid = els.schedule.querySelector('.schedule-grid');
  if (!grid) return null;

  const width = getSwipeViewportWidth();
  const viewport = document.createElement('div');
  viewport.className = 'schedule-swipe-viewport is-animating';

  const currentPanel = document.createElement('div');
  currentPanel.className = 'schedule-swipe-panel schedule-swipe-current';

  const incomingPanel = document.createElement('div');
  incomingPanel.className = 'schedule-swipe-panel schedule-swipe-incoming';
  incomingPanel.innerHTML = buildSchedulePreviewPanel(targetDate);

  currentPanel.appendChild(grid);
  viewport.appendChild(currentPanel);
  viewport.appendChild(incomingPanel);
  els.schedule.appendChild(viewport);

  const incomingBase = direction > 0 ? width : -width;
  currentPanel.style.transform = 'translate3d(0, 0, 0)';
  incomingPanel.style.transform = `translate3d(${incomingBase}px, 0, 0)`;

  return { viewport, currentPanel, incomingPanel, width, direction };
}

async function animateDayTransition(targetDate, direction) {
  if (!isMobileSchedule()) return false;
  if (scheduleSwipeAnimating || scheduleSwipeTransition || loading || error) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  scheduleSwipeAnimating = true;
  scheduleSwipeTransition = true;
  try {
    restoreScheduleScroll = els.scheduleScroll?.scrollTop ?? 0;
    const transition = createDayTransitionViewport(targetDate, direction);
    if (!transition) return false;

    await runDayTransitionAnimation(transition);
    await applyDayChangeAfterTransition(targetDate, transition.viewport);
    return true;
  } finally {
    scheduleSwipeTransition = false;
    scheduleSwipeAnimating = false;
  }
}

async function navigateToDay(targetDate, { direction } = {}) {
  const nextDate = clampDateToBookingWindow(targetDate, NAV_DAYS_BEFORE, NAV_DAYS_AFTER);
  if (isSameBangkokDay(nextDate, selectedDate)) return;

  const travelDirection =
    direction ?? (nextDate > selectedDate ? 1 : nextDate < selectedDate ? -1 : 0);
  if (travelDirection === 0) return;

  if (await animateDayTransition(nextDate, travelDirection)) return;

  selectedDate = nextDate;
  syncDateHash();
  render();
  loadSchedule();
}

async function cancelSwipeGesture(dx, state) {
  scheduleSwipeAnimating = true;
  try {
    if (state.canComplete && state.currentPanel && state.incomingPanel) {
      const incomingBase = state.direction > 0 ? state.width : -state.width;
      state.viewport?.classList.remove('threshold-met', 'is-dragging');
      state.viewport?.classList.add('is-animating');
      await Promise.all([
        animateElementTransform(state.currentPanel, 0),
        animateElementTransform(state.incomingPanel, incomingBase),
      ]);
      const grid = state.currentPanel.querySelector('.schedule-grid');
      state.viewport?.remove();
      if (grid) {
        grid.style.transform = '';
        els.schedule.appendChild(grid);
      }
      return;
    }

    const grid = els.schedule.querySelector('.schedule-grid');
    if (grid) {
      await animateElementTransform(grid, 0);
      grid.style.transform = '';
    }
  } finally {
    scheduleSwipeAnimating = false;
  }
}

async function completeSwipeGesture(dx, state) {
  scheduleSwipeAnimating = true;
  scheduleSwipeTransition = true;
  try {
    state.viewport?.classList.remove('is-dragging', 'threshold-met');
    state.viewport?.classList.add('is-animating');

    restoreScheduleScroll = els.scheduleScroll?.scrollTop ?? 0;
    await runDayTransitionAnimation(state);
    await applyDayChangeAfterTransition(state.targetDate, state.viewport);
  } finally {
    scheduleSwipeTransition = false;
    scheduleSwipeAnimating = false;
  }
}

async function finishSwipeGesture(dx, state) {
  if (scheduleSwipeAnimating || scheduleSwipeTransition) return;

  const width = state.width || getSwipeViewportWidth();
  const threshold = Math.max(SCHEDULE_SWIPE.minDistance, width * SCHEDULE_SWIPE.commitRatio);
  const shouldComplete = state.canComplete && Math.abs(dx) >= threshold;

  if (shouldComplete) {
    await completeSwipeGesture(dx, state);
    return;
  }

  await cancelSwipeGesture(dx, state);
}

function bindScheduleSwipe() {
  if (bindScheduleSwipe.bound) return;
  bindScheduleSwipe.bound = true;

  const scrollEl = els.scheduleScroll;
  if (!scrollEl) return;

  const onStart = (e) => {
    if (!isMobileSchedule() || scheduleSwipeAnimating || scheduleSwipeTransition) return;
    if (!e.target.closest('.schedule-grid')) return;

    const touch = getTouchPoint(e, 'touches');
    if (!touch || (e.touches && e.touches.length !== 1)) return;
    if (touch.clientX < SCHEDULE_SWIPE.edgeGuard) return;

    scheduleSwipeState = {
      startX: touch.clientX,
      startY: touch.clientY,
      axis: null,
      width: getSwipeViewportWidth(),
    };
  };

  const onMove = (e) => {
    if (!scheduleSwipeState || scheduleSwipeAnimating) return;

    const touch = getTouchPoint(e, 'touches');
    if (!touch || (e.touches && e.touches.length !== 1)) return;

    const dx = touch.clientX - scheduleSwipeState.startX;
    const dy = touch.clientY - scheduleSwipeState.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (scheduleSwipeState.axis === null) {
      if (absDx < SCHEDULE_SWIPE.lockDistance && absDy < SCHEDULE_SWIPE.lockDistance) return;
      if (absDx > absDy * SCHEDULE_SWIPE.horizontalRatio) {
        scheduleSwipeState.axis = 'x';
        initSwipePanels(dx);
      } else if (absDy >= absDx) {
        resetScheduleSwipe();
        return;
      } else {
        return;
      }
    }

    if (scheduleSwipeState.axis === 'x') {
      e.preventDefault();
      scheduleSwipeState.deltaX = dx;
      applySwipeTransform(dx, scheduleSwipeState);
    }
  };

  const onEnd = (e) => {
    if (!scheduleSwipeState) return;

    const state = { ...scheduleSwipeState };
    const touch = getTouchPoint(e, 'changedTouches');
    const dx = touch ? touch.clientX - state.startX : 0;
    resetScheduleSwipe();

    if (state.axis !== 'x') return;
    void finishSwipeGesture(dx, state);
  };

  scrollEl.addEventListener('touchstart', onStart, { passive: true, capture: true });
  scrollEl.addEventListener('touchmove', onMove, { passive: false, capture: true });
  scrollEl.addEventListener('touchend', onEnd, { passive: true, capture: true });
  scrollEl.addEventListener('touchcancel', (e) => {
    if (!scheduleSwipeState) return;
    const state = { ...scheduleSwipeState };
    const dx = state.deltaX || 0;
    resetScheduleSwipe();
    if (state.axis !== 'x') return;
    void cancelSwipeGesture(dx, state);
  }, { passive: true, capture: true });
}

const ICON_INSTAGRAM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`;
const ICON_MAPS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2"/></svg>`;
const ICON_WHATSAPP = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
const ICON_PHONE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const ICON_PRICING = '$';

function buildPriceHintHtml() {
  const blocks = [
    {
      title: t('pricingIndividualTitle'),
      lines: [t('pricingIndividual1'), t('pricingIndividual2')],
    },
    {
      title: t('pricingCoachTitle'),
      lines: [
        t('pricingCoach1'),
        t('pricingCoach2'),
        t('pricingCoach3'),
        t('pricingCoach4'),
        t('pricingCoach5'),
      ],
    },
    {
      title: t('pricingFullCourtTitle'),
      lines: [t('pricingFullCourt1'), t('pricingFullCourt2'), t('pricingFullCourt3')],
    },
  ];

  return blocks
    .map(
      (block) =>
        `<strong>${escapeHtml(block.title)}</strong><br>${block.lines
          .map((line) => escapeHtml(line))
          .join('<br>')}`,
    )
    .join('<br><br>');
}

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
  els.pricingBody.innerHTML = `
    <section class="pricing-block">
      <h3>${t('pricingCoachTitle')}</h3>
      <ul>
        <li>${t('pricingCoach1')}</li>
        <li>${t('pricingCoach2')}</li>
        <li>${t('pricingCoach3')}</li>
        <li>${t('pricingCoach4')}</li>
        <li>${t('pricingCoach5')}</li>
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
    <div class="whatsapp-cta">
      <p class="whatsapp-cta-text">${t('pricingAskMore')}</p>
      ${buildWhatsAppButton(t('pricingAskAction'), t('pricingAskWhatsApp'))}
    </div>`;
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
  const today = startOfBangkokDay(new Date());
  void navigateToDay(today, { direction: today > selectedDate ? 1 : -1 });
}

function selectDay(date) {
  void navigateToDay(date);
}

function changeDay(delta) {
  const nextDate = clampDateToBookingWindow(
    addBangkokDays(selectedDate, delta),
    NAV_DAYS_BEFORE,
    NAV_DAYS_AFTER,
  );
  if (isSameBangkokDay(nextDate, selectedDate)) return;
  void navigateToDay(nextDate, { direction: delta > 0 ? 1 : -1 });
}

function updateNavDisabled() {
  const { minDate, maxDate } = getBookingWindow(NAV_DAYS_BEFORE, NAV_DAYS_AFTER);
  const atMin = isSameBangkokDay(selectedDate, minDate);
  const atMax = isSameBangkokDay(selectedDate, maxDate);
  [els.btnPrev, els.btnPrevMobile].forEach((btn) => btn?.toggleAttribute('disabled', atMin));
  [els.btnNext, els.btnNextMobile].forEach((btn) => btn?.toggleAttribute('disabled', atMax));
}

async function loadSchedule({ silent = false, force = false } = {}) {
  const range = getCurrentFetchRange();
  const canUseCache =
    !force &&
    !silent &&
    eventsCache &&
    cacheCoversCurrentWindow() &&
    isDateInCachedRange(selectedDate);

  if (canUseCache) {
    events = eventsCache.events;
    error = null;
    renderSchedule();
    void refreshScheduleSilent();
    return;
  }

  if (silent) {
    if (silentRefreshInFlight || loading) return;
    if (scheduleSwipeAnimating || scheduleSwipeTransition) return;
    silentRefreshInFlight = true;
    try {
      const fetched = await fetchEvents(range.timeMin, range.timeMax);
      const fingerprint = eventsFingerprint(fetched);
      if (!eventsCache || eventsCache.fingerprint !== fingerprint) {
        updateEventsCache(fetched, range);
        if (!loading && !error) renderSchedule();
      } else {
        eventsCache.fetchedAt = Date.now();
        events = eventsCache.events;
      }
    } catch {
      // Keep showing cached data on silent refresh failure.
    } finally {
      silentRefreshInFlight = false;
    }
    return;
  }

  loading = true;
  error = null;
  renderScheduleStatus();

  try {
    const fetched = await fetchEvents(range.timeMin, range.timeMax);
    updateEventsCache(fetched, range);
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
  const { minDate, maxDate } = getBookingWindow(NAV_DAYS_BEFORE, NAV_DAYS_AFTER);
  const days = Array.from({ length: 5 }, (_, i) => addBangkokDays(selectedDate, i - 2));

  els.weekStrip.innerHTML = days
    .map((day) => {
      const selected = isSameBangkokDay(day, selectedDate);
      const today = isTodayBangkok(day);
      const outOfRange = day < minDate || day > maxDate;
      return `
        <button type="button"
          class="week-day${selected ? ' selected' : ''}${today ? ' is-today' : ''}${outOfRange ? ' week-day-unavailable' : ''}"
          data-date="${toDateInputValue(day)}"
          role="tab"
          aria-selected="${selected}"
          aria-disabled="${outOfRange}">
          <span class="week-day-name">${formatWeekdayShort(day, locale)}</span>
          <span class="week-day-num">${formatDayNumber(day)}</span>
        </button>`;
    })
    .join('');

  els.weekStrip.querySelectorAll('.week-day').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = fromDateInputValue(btn.dataset.date);
      if (day < minDate || day > maxDate) {
        openBookingLimitSheet();
        return;
      }
      selectDay(day);
    });
  });
}

function renderTodayButtons() {
  const onToday = isTodayBangkok(selectedDate);
  els.btnTodayDesktop?.classList.toggle('is-active', !onToday);
  els.btnTodayDesktop?.toggleAttribute('disabled', onToday);
}

function renderScheduleStatus() {
  if (scheduleSwipeTransition) return;

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
    document.getElementById('btn-retry')?.addEventListener('click', () => loadSchedule({ force: true }));
    return;
  }

  els.scheduleStatus.hidden = true;
}

function renderSchedule() {
  if (loading || error) return;

  const scrollEl = els.scheduleScroll;
  const savedScroll = restoreScheduleScroll ?? scrollEl?.scrollTop ?? 0;
  restoreScheduleScroll = null;

  const dayEvents = events.filter((e) => !e.allDay && eventOnDay(e, selectedDate));
  els.schedule.innerHTML = buildScheduleGridHtml(selectedDate, dayEvents);
  bindScheduleGridInteractions(dayEvents);

  if (pendingInitialScroll === 'today') {
    pendingInitialScroll = null;
    scrollToCurrentTime();
    return;
  }

  if (pendingInitialScroll === 'skip') {
    pendingInitialScroll = null;
    return;
  }

  scrollEl?.scrollTo({ top: savedScroll, behavior: 'auto' });
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
  els.scheduleScroll.scrollTo({ top: target, behavior: 'auto' });
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
  const activeDay = clampDateToBookableWindow(selectedDate, NAV_DAYS_AFTER);
  let initialStart = prefillStart;

  if (initialStart && (initialStart < new Date() || startOfBangkokDay(initialStart) < today)) {
    initialStart = null;
  }

  if (!initialStart) {
    const nearest = findNearestFreeSlot(events, durationDefault, {
      preferDate: activeDay,
      daysAfter: NAV_DAYS_AFTER,
    });
    initialStart = nearest?.start || null;
  }

  const date = initialStart ? startOfBangkokDay(initialStart) : activeDay;
  const timeOptions = buildStartTimeOptions(date);
  const dateOptions = buildBookingDateOptions(today, 0, NAV_DAYS_AFTER);
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
    const sessionLabel = getSessionTypeLabel(sessionType);
    const price = calculateBookingPrice(playersSelect.value, sessionType, duration);
    const priceLabel = formatPriceThb(price.amount, price.plus, getLocale());
    const summaryText = tf('bookingSummary', {
      name: guestName,
      sessionType: sessionLabel,
      date: formatBookingDateLabel(d, locale),
      start: formatTime(start, locale),
      end: formatTime(end, locale),
      players,
      price: priceLabel,
    });

    summaryEl.innerHTML = `${escapeHtml(summaryText)}<button type="button" class="price-hint-btn" aria-label="${escapeHtml(t('priceHintLabel'))}" aria-expanded="false"><span class="price-hint-amount">${escapeHtml(priceLabel)}</span><span class="price-hint-icon" aria-hidden="true">?</span></button><span class="price-hint-popover" hidden role="tooltip">${buildPriceHintHtml()}</span>`;

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
