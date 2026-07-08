import { CONFIG } from '../config.js?v=__BUILD_ID__';

const TZ_OFFSET = '+07:00';

export function getBangkokDateParts(date) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = formatted.split('-').map(Number);
  return { year, month, day };
}

export function makeBangkokDateTime(year, month, day, hour, minute = 0) {
  const pad = (n) => String(n).padStart(2, '0');
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${TZ_OFFSET}`,
  );
}

export function startOfBangkokDay(date) {
  const { year, month, day } = getBangkokDateParts(date);
  return makeBangkokDateTime(year, month, day, 0, 0);
}

export function addBangkokDays(date, delta) {
  const { year, month, day } = getBangkokDateParts(date);
  const noon = makeBangkokDateTime(year, month, day, 12, 0);
  noon.setTime(noon.getTime() + delta * 86_400_000);
  return startOfBangkokDay(noon);
}

export function isTodayBangkok(date) {
  const a = getBangkokDateParts(date);
  const b = getBangkokDateParts(new Date());
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function getBangkokWeekday(date) {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: CONFIG.timezone,
    weekday: 'short',
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[short] ?? 0;
}

export function getWeekStartMonday(date) {
  const weekday = getBangkokWeekday(date);
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addBangkokDays(startOfBangkokDay(date), offset);
}

export function getWeekDays(date) {
  const monday = getWeekStartMonday(date);
  return Array.from({ length: 7 }, (_, i) => addBangkokDays(monday, i));
}

export function formatWeekdayShort(date, locale) {
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    timeZone: CONFIG.timezone,
  });
}

export function formatDayNumber(date) {
  return getBangkokDateParts(date).day;
}

export function isSameBangkokDay(a, b) {
  const pa = getBangkokDateParts(a);
  const pb = getBangkokDateParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

export function getDayBounds(date) {
  const { year, month, day } = getBangkokDateParts(date);
  return {
    start: makeBangkokDateTime(year, month, day, CONFIG.workingHours.start, 0),
    end: makeBangkokDateTime(year, month, day, CONFIG.workingHours.end, 0),
  };
}

export function getFetchRange(date) {
  const { start, end } = getDayBounds(date);
  const buffer = new Date(start.getTime() - 86_400_000);
  const bufferEnd = new Date(end.getTime() + 86_400_000);
  return { timeMin: buffer, timeMax: bufferEnd };
}

export function generateTimeSlots(date) {
  const slots = [];
  const { start, end } = getDayBounds(date);
  const cursor = new Date(start);

  while (cursor < end) {
    const slotEnd = new Date(cursor.getTime() + CONFIG.slotMinutes * 60_000);
    if (slotEnd > end) break;
    slots.push({ start: new Date(cursor), end: slotEnd });
    cursor.setTime(cursor.getTime() + CONFIG.slotMinutes * 60_000);
  }

  return slots;
}

export function generateHourMarkers(date) {
  const { year, month, day } = getBangkokDateParts(date);
  const markers = [];
  for (let h = CONFIG.workingHours.start; h < CONFIG.workingHours.end; h++) {
    markers.push(makeBangkokDateTime(year, month, day, h, 0));
  }
  return markers;
}

export function formatTime(date, locale) {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CONFIG.timezone,
  });
}

export function formatDate(date, locale) {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: CONFIG.timezone,
  });
}

export function formatDateShort(date, locale) {
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: CONFIG.timezone,
  });
}

export function toDateInputValue(date) {
  const { year, month, day } = getBangkokDateParts(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function fromDateInputValue(value) {
  const [year, month, day] = value.split('-').map(Number);
  return makeBangkokDateTime(year, month, day, 0, 0);
}

export function isPastSlot(slotEnd) {
  return slotEnd <= new Date();
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function buildStartTimeOptions(date) {
  const slots = generateTimeSlots(date);
  return slots.map((s) => ({
    value: formatTime(s.start, 'en-GB'),
    start: s.start,
    end: s.end,
  }));
}

export function computeEndTime(start, durationMinutes) {
  return addMinutes(start, durationMinutes);
}

export function isWithinWorkingHours(start, end) {
  const { start: dayStart, end: dayEnd } = getDayBounds(start);
  return start >= dayStart && end <= dayEnd;
}

export function formatDuration(minutes, t) {
  if (minutes < 60) return `${minutes} ${t('minutes')}`;
  const h = minutes / 60;
  if (minutes % 60 === 0) {
    return `${h} ${h === 1 ? t('hour') : t('hours')}`;
  }
  return `${minutes} ${t('minutes')}`;
}

export function parseTimeOnDate(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const { year, month, day } = getBangkokDateParts(date);
  return makeBangkokDateTime(year, month, day, h, m);
}

export function formatBookingDateLabel(date, locale) {
  const lang = locale.split('-')[0];
  if (lang === 'ru') {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: CONFIG.timezone,
    });
  }
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: CONFIG.timezone,
  });
}

export function buildBookingDateOptions(anchorDate, daysBefore = 0, daysAfter = 60) {
  const start = addBangkokDays(startOfBangkokDay(anchorDate), -daysBefore);
  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => {
    const day = addBangkokDays(start, i);
    return { value: toDateInputValue(day), date: day };
  });
}

export function getBangkokHour(date) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: CONFIG.timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );
}

function toGoogleCalendarLocalStamp(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}${get('month')}${get('day')}T${hour}${get('minute')}${get('second')}`;
}

/** Pre-filled Google Calendar event link (opens in the clicker's own calendar). */
export function buildGoogleCalendarTemplateUrl(start, end, { title, details = '' } = {}) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Island Heats',
    dates: `${toGoogleCalendarLocalStamp(start)}/${toGoogleCalendarLocalStamp(end)}`,
    ctz: CONFIG.timezone,
  });
  if (details) params.set('details', details);
  if (CONFIG.links?.location) params.set('location', CONFIG.links.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
