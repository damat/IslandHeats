export const CONFIG = {
  calendarId:
    '7356e5d8ddb6aecdfd77e0ba69e6d8c8c1d1efa3065459cb66b08584d5f093e1@group.calendar.google.com',
  apiKey: '', // Option A: Google Calendar API key. See README.
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyUwmgyPEez_f8atppbhGZwQ5AqODm_lOTDhWfmaTzhLm7RA_QeT-ocroUUhE5ChUGQ/exec', // Option B: Apps Script web app URL (no API key). See apps-script/
  timezone: 'Asia/Bangkok',
  workingHours: { start: 8, end: 22 },
  slotMinutes: 30,
  displayHourStep: 60,
  defaultDurationMinutes: 90,
  durationOptions: [60, 90, 120],
  whatsappPhone: '', // e.g. '66812345678' (country code, no +)
  locale: 'en',
  supportedLocales: ['ru', 'en', 'th'],
};

export const EVENT_TYPES = [
  {
    id: 'training',
    patterns: [
      /training\s*session/i,
      /трениров/i,
      /ฝึก/i,
      /\[training\]/i,
      /\[тренировка\]/i,
    ],
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    id: '3x3',
    patterns: [/3\s*[x×]\s*3/i, /3x3\s*game/i, /\[3x3\]/i],
    color: '#ea580c',
    bg: '#ffedd5',
  },
  {
    id: 'open',
    patterns: [
      /open\s*game/i,
      /открыт/i,
      /เปิด/i,
      /\[open\]/i,
      /\[open game\]/i,
    ],
    color: '#16a34a',
    bg: '#dcfce7',
  },
  {
    id: 'other',
    default: true,
    patterns: [],
    color: '#64748b',
    bg: '#f1f5f9',
  },
];
