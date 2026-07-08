/**
 * Island Heats — read-only calendar proxy (no API key required).
 *
 * Setup:
 * 1. Go to https://script.google.com → New project
 * 2. Paste this file, set CALENDAR_ID below
 * 3. Run → authorize once
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy deployment URL into config.js → appsScriptUrl
 */

const CALENDAR_ID =
  '7356e5d8ddb6aecdfd77e0ba69e6d8c8c1d1efa3065459cb66b08584d5f093e1@group.calendar.google.com';

function doGet(e) {
  try {
    const timeMin = e.parameter.timeMin;
    const timeMax = e.parameter.timeMax;

    if (!timeMin || !timeMax) {
      return jsonResponse({ error: 'Missing timeMin or timeMax' }, 400, e);
    }

    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) {
      return jsonResponse({ error: 'Calendar not found' }, 404, e);
    }

    const events = cal.getEvents(new Date(timeMin), new Date(timeMax));
    const items = events.map((ev) => {
      const isPrivate = ev.isPrivateEvent();
      return {
        id: ev.getId(),
        summary: isPrivate ? 'Busy' : ev.getTitle(),
        description: isPrivate ? '' : ev.getDescription(),
        visibility: isPrivate ? 'private' : 'default',
        start: { dateTime: ev.getStartTime().toISOString() },
        end: { dateTime: ev.getEndTime().toISOString() },
      };
    });

    return jsonResponse({ items: items }, 200, e);
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) }, 500, e);
  }
}

function jsonResponse(data, status, e) {
  const body = JSON.stringify(data);
  const callback = e && e.parameter && e.parameter.callback;

  if (callback) {
    // JSONP fallback for strict CORS environments
    return ContentService.createTextOutput(callback + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(body).setMimeType(
    ContentService.MimeType.JSON,
  );
}
