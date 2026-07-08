import { CONFIG } from '../config.js';
import { fetchEvents, getEventsForSlot } from './calendar-api.js';
import {
  formatTime,
  formatDate,
  formatDateShort,
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
  parseTimeOnDate,
  getDayBounds,
  getBangkokHour,
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

let selectedDate = startOfBangkokDay(new Date());
let events = [];
let loading = false;
let error = null;

const els = {
  app: document.getElementById('app'),
  dayLabel: document.getElementById('day-label'),
  daySub: document.getElementById('day-sub'),
  schedule: document.getElementById('schedule'),
  scheduleStatus: document.getElementById('schedule-status'),
  langSwitcher: document.getElementById('lang-switcher'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnToday: document.getElementById('btn-today'),
  btnBook: document.getElementById('btn-book'),
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

function init() {
  try {
    initLocale(CONFIG.locale);
    renderLangSwitcher();
    bindEvents();
    render();
    loadSchedule();
  } catch (err) {
    console.error(err);
    showFatalError(err);
  }
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
  els.btnToday?.addEventListener('click', () => {
    selectedDate = startOfBangkokDay(new Date());
    render();
    loadSchedule();
  });
  els.btnBook?.addEventListener('click', () => openBooking());
  els.modalClose?.addEventListener('click', closeModal);
  els.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
  els.bookingClose?.addEventListener('click', closeBooking);
  els.bookingOverlay?.addEventListener('click', (e) => {
    if (e.target === els.bookingOverlay) closeBooking();
  });
  els.bookingForm?.addEventListener('submit', onBookingSubmit);
}

function renderLangSwitcher() {
  els.langSwitcher.innerHTML = CONFIG.supportedLocales
    .map(
      (loc) =>
        `<button type="button" class="lang-btn${loc === getLocale() ? ' active' : ''}" data-locale="${loc}">${LOCALE_LABELS[loc]}</button>`,
    )
    .join('');

  els.langSwitcher.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLocale(btn.dataset.locale);
      document.documentElement.lang = getLocale();
      renderLangSwitcher();
      render();
      renderSchedule();
    });
  });
}

function changeDay(delta) {
  selectedDate = addBangkokDays(selectedDate, delta);
  render();
  loadSchedule();
}

async function loadSchedule() {
  loading = true;
  error = null;
  renderScheduleStatus();

  try {
    const { timeMin, timeMax } = getFetchRange(selectedDate);
    events = await fetchEvents(timeMin, timeMax);
    loading = false;
    renderSchedule();
  } catch (err) {
    loading = false;
    error = err.message === 'API_KEY_MISSING' ? 'API_KEY_MISSING' : err.message;
    renderScheduleStatus();
  }
}

function render() {
  document.title = `${t('siteName')} — ${t('siteTagline')}`;
  document.querySelector('.site-tagline').textContent = t('siteTagline');
  els.btnPrev.setAttribute('aria-label', t('prevDay'));
  els.btnNext.setAttribute('aria-label', t('nextDay'));
  els.btnToday.textContent = t('today');
  els.btnBook.textContent = t('bookCourt');
  els.dayLabel.textContent = formatDateShort(selectedDate, getLocaleTag());
  els.daySub.textContent = formatDate(selectedDate, getLocaleTag());
  renderScheduleStatus();
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
  const gridHeight = (totalMinutes / slotHeight) * 48;

  let html = `<div class="schedule-grid" style="--grid-height: ${gridHeight}px; --slot-h: 48px">`;

  html += '<div class="time-axis">';
  hourMarkers.forEach((h) => {
    const top =
      ((getBangkokHour(h) - CONFIG.workingHours.start) * 60) / slotHeight * 48;
    html += `<div class="time-label" style="top: ${top}px">${formatTime(h, locale)}</div>`;
  });
  html += '</div>';

  html += '<div class="slots-area">';
  html += '<div class="hour-lines">';
  hourMarkers.forEach((h) => {
    const top =
      ((getBangkokHour(h) - CONFIG.workingHours.start) * 60) / slotHeight * 48;
    html += `<div class="hour-line" style="top: ${top}px"></div>`;
  });
  html += '</div>';

  slots.forEach((slot, i) => {
    const top = i * 48;
    const overlapping = getEventsForSlot(events, slot.start, slot.end);
    const past = isPastSlot(slot.end);
    const isHour = slot.start.getMinutes() === 0;

    if (overlapping.length === 0) {
      html += `
        <button type="button"
          class="slot slot-free${past ? ' slot-past' : ''}${isHour ? ' slot-hour' : ''}"
          style="top: ${top}px"
          data-start="${slot.start.toISOString()}"
          ${past ? 'disabled' : ''}
          aria-label="${formatTime(slot.start, locale)} — ${t('free')}">
          <span class="slot-label">${isHour ? '' : formatTime(slot.start, locale)}</span>
        </button>`;
    }
  });

  const dayEvents = events.filter((e) => !e.allDay && eventOnDay(e, selectedDate));
  dayEvents.forEach((event) => {
    const top = slotTopFromDate(event.start, selectedDate);
    const height = slotHeightFromRange(event.start, event.end, selectedDate);
    const label = event.isPrivate ? t('private') : event.summary || t('busy');
    const typeLabel = t(`eventTypes.${event.type.id}`);

    html += `
      <button type="button"
        class="event-block${event.isPrivate ? ' event-private' : ''}"
        style="top: ${top}px; height: ${height}px; --event-color: ${event.type.color}; --event-bg: ${event.type.bg}"
        data-event-id="${event.id}"
        aria-label="${label}">
        <span class="event-type-badge">${typeLabel}</span>
        <span class="event-title">${escapeHtml(label)}</span>
        <span class="event-time">${formatTime(event.start, locale)} – ${formatTime(event.end, locale)}</span>
      </button>`;
  });

  html += '</div></div>';

  const hasEvents = dayEvents.length > 0;
  if (!hasEvents && slots.every((s) => isPastSlot(s.end))) {
    html += `<p class="all-free past-day">${t('past')}</p>`;
  } else if (!hasEvents) {
    html += `<p class="all-free">${t('allFree')}</p>`;
  }

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
  els.modalTitle.textContent = t('eventDetails');

  if (event.isPrivate) {
    els.modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${t('time')}</span>
        <span>${formatTime(event.start, locale)} – ${formatTime(event.end, locale)}</span>
      </div>
      <p class="private-notice">${t('private')}</p>`;
  } else {
    els.modalBody.innerHTML = `
      <div class="event-type-pill" style="--event-color: ${event.type.color}; --event-bg: ${event.type.bg}">
        ${t(`eventTypes.${event.type.id}`)}
      </div>
      <h3 class="detail-title">${escapeHtml(event.summary || t('busy'))}</h3>
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
  const date = prefillStart ? startOfBangkokDay(prefillStart) : selectedDate;
  const locale = getLocaleTag();
  const timeOptions = buildStartTimeOptions(date);
  const defaultStart = prefillStart
    ? formatTime(prefillStart, 'en-GB')
    : timeOptions.find((o) => !isPastSlot(o.end))?.value || timeOptions[0]?.value;

  els.bookingForm.innerHTML = `
    <div class="booking-header">
      <h2 id="booking-title">${t('bookingTitle')}</h2>
      <p class="booking-sub">${t('bookingSubtitle')}</p>
    </div>
    <div class="form-grid">
      <label class="field">
        <span>${t('date')}</span>
        <input type="date" name="date" value="${toDateInputValue(date)}" required>
      </label>
      <label class="field">
        <span>${t('startTime')}</span>
        <select name="startTime" required>
          ${timeOptions
            .map(
              (o) =>
                `<option value="${o.value}"${o.value === defaultStart ? ' selected' : ''}${isPastSlot(o.end) && isTodayBangkok(date) ? ' disabled' : ''}>${formatTime(o.start, locale)}</option>`,
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
        <span>${t('endTime')}</span>
        <output name="endTime" class="end-time-output">—</output>
      </label>
      <label class="field">
        <span>${t('sessionType')}</span>
        <select name="sessionType">
          <option value="any">${t('sessionTypeAny')}</option>
          <option value="training">${t('sessionTypeTraining')}</option>
          <option value="3x3">${t('sessionType3x3')}</option>
          <option value="open">${t('sessionTypeOpen')}</option>
        </select>
      </label>
      <label class="field field-full">
        <span>${t('yourName')}</span>
        <input type="text" name="name" required autocomplete="name">
      </label>
      <label class="field field-full">
        <span>${t('contact')}</span>
        <input type="text" name="contact" required autocomplete="tel">
      </label>
      <label class="field field-full">
        <span>${t('notes')}</span>
        <textarea name="notes" rows="2"></textarea>
      </label>
    </div>
    <p class="conflict-hint" id="conflict-hint" hidden>${t('conflictWarning')}</p>
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" id="booking-cancel-inner">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${t('submitBooking')}</button>
    </div>`;

  document.getElementById('booking-cancel-inner').addEventListener('click', closeBooking);

  const dateInput = els.bookingForm.querySelector('[name="date"]');
  const startSelect = els.bookingForm.querySelector('[name="startTime"]');
  const durationSelect = els.bookingForm.querySelector('[name="duration"]');
  const endOutput = els.bookingForm.querySelector('[name="endTime"]');
  const conflictHint = document.getElementById('conflict-hint');

  function updateEndAndConflict() {
    const d = fromDateInputValue(dateInput.value);
    const start = parseTimeOnDate(d, startSelect.value);
    const duration = Number(durationSelect.value);
    const end = computeEndTime(start, duration);
    endOutput.textContent = `${formatTime(start, locale)} – ${formatTime(end, locale)}`;

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
    const d = fromDateInputValue(dateInput.value);
    const opts = buildStartTimeOptions(d);
    const current = startSelect.value;
    startSelect.innerHTML = opts
      .map(
        (o) =>
          `<option value="${o.value}"${isPastSlot(o.end) && isTodayBangkok(d) ? ' disabled' : ''}>${formatTime(o.start, locale)}</option>`,
      )
      .join('');
    if (opts.some((o) => o.value === current)) {
      startSelect.value = current;
    }
    updateEndAndConflict();
  }

  dateInput.addEventListener('change', refreshStartOptions);
  startSelect.addEventListener('change', updateEndAndConflict);
  durationSelect.addEventListener('change', updateEndAndConflict);
  updateEndAndConflict();

  openOverlay(els.bookingOverlay);
}

function closeBooking() {
  closeOverlay(els.bookingOverlay);
}

function onBookingSubmit(e) {
  e.preventDefault();
  const fd = new FormData(els.bookingForm);
  const name = fd.get('name')?.toString().trim();
  const contact = fd.get('contact')?.toString().trim();
  const notes = fd.get('notes')?.toString().trim();
  const sessionType = fd.get('sessionType')?.toString();
  const dateVal = fromDateInputValue(fd.get('date').toString());
  const duration = Number(fd.get('duration'));
  const start = parseTimeOnDate(dateVal, fd.get('startTime').toString());
  const end = addMinutes(start, duration);
  const locale = getLocaleTag();

  if (!name) {
    showToast(t('nameRequired'));
    return;
  }
  if (!contact) {
    showToast(t('contactRequired'));
    return;
  }
  if (!isWithinWorkingHours(start, end)) {
    showToast(t('invalidTime'));
    return;
  }

  const message = tf('whatsappMessage', {
    date: formatDate(dateVal, locale),
    start: formatTime(start, locale),
    end: formatTime(end, locale),
    sessionType: getSessionTypeLabel(sessionType),
    name,
    contact,
    notes,
  });

  if (CONFIG.whatsappPhone) {
    const url = `https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
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
