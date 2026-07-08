import { CONFIG, EVENT_TYPES } from '../config.js';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

export function classifyEvent(event) {
  const colorId = event.colorId != null ? String(event.colorId) : '';
  const mappedTypeId = CONFIG.colorTypeMap?.[colorId];
  if (mappedTypeId) {
    const mapped = EVENT_TYPES.find((t) => t.id === mappedTypeId);
    if (mapped) return mapped;
  }

  const summary = event.summary || '';
  for (const type of EVENT_TYPES) {
    if (type.default) continue;
    if (type.patterns.some((p) => p.test(summary))) {
      return type;
    }
  }
  return EVENT_TYPES.find((t) => t.default);
}

export function isPrivateEvent(event) {
  const visibility = event.visibility || 'default';
  return visibility === 'private' || visibility === 'confidential';
}

export function parseEvent(event) {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const type = classifyEvent(event);
  const isPrivate = isPrivateEvent(event);

  return {
    id: event.id,
    summary: isPrivate ? null : event.summary || '',
    description: isPrivate ? null : event.description || '',
    start: new Date(start),
    end: new Date(end),
    allDay,
    isPrivate,
    type,
    raw: event,
  };
}

export async function fetchEvents(timeMin, timeMax) {
  if (CONFIG.appsScriptUrl) {
    return fetchEventsViaAppsScript(timeMin, timeMax);
  }
  if (CONFIG.apiKey) {
    return fetchEventsViaApi(timeMin, timeMax);
  }
  throw new Error('API_KEY_MISSING');
}

async function fetchEventsViaApi(timeMin, timeMax) {
  const params = new URLSearchParams({
    key: CONFIG.apiKey,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    timeZone: CONFIG.timezone,
  });

  const url = `${API_BASE}/calendars/${encodeURIComponent(CONFIG.calendarId)}/events?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data.items || []).map(parseEvent);
}

async function fetchEventsViaAppsScript(timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  });

  const url = `${CONFIG.appsScriptUrl}?${params}`;

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.items || []).map(parseEvent);
  } catch {
    // JSONP fallback (Apps Script CORS edge cases)
    return fetchEventsJsonp(timeMin, timeMax);
  }
}

function fetchEventsJsonp(timeMin, timeMax) {
  return new Promise((resolve, reject) => {
    const callback = `ih_cb_${Date.now()}`;
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      callback,
    });

    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Apps Script timeout'));
    }, 15_000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
    }

    window[callback] = (data) => {
      cleanup();
      if (data.error) reject(new Error(data.error));
      else resolve((data.items || []).map(parseEvent));
    };

    script.src = `${CONFIG.appsScriptUrl}?${params}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Apps Script request failed'));
    };
    document.head.appendChild(script);
  });
}

export function eventsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function getEventsForSlot(events, slotStart, slotEnd) {
  return events.filter((e) => {
    if (e.allDay) return false;
    return eventsOverlap(e.start, e.end, slotStart, slotEnd);
  });
}
