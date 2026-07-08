export const CONFIG = {
  calendarId:
    '7356e5d8ddb6aecdfd77e0ba69e6d8c8c1d1efa3065459cb66b08584d5f093e1@group.calendar.google.com',
  apiKey: '',
  appsScriptUrl:
    'https://script.google.com/macros/s/AKfycbyUwmgyPEez_f8atppbhGZwQ5AqODm_lOTDhWfmaTzhLm7RA_QeT-ocroUUhE5ChUGQ/exec',
  timezone: 'Asia/Bangkok',
  workingHours: { start: 8, end: 22 },
  slotMinutes: 30,
  displayHourStep: 60,
  defaultDurationMinutes: 90,
  durationOptions: [90, 120],
  whatsappPhone: '+66822292775', // +66… or digits only — normalized for wa.me / tel:
  // Optional group chat invite link (https://chat.whatsapp.com/...). Used for menu only.
  whatsappGroupUrl: '',
  locale: 'en',
  supportedLocales: ['en', 'ru', 'th'],
  logoUrl: 'assets/logo.png',
  links: {
    instagram: 'https://www.instagram.com/island.heats/',
    location: 'https://maps.app.goo.gl/JxEVuxh6jh5murLv8',
  },
  // Optional Google Calendar colorId → type hint (title patterns win first).
  // Ignored for display colors — UI uses fixed EVENT_TYPES palette.
  colorTypeMap: {
    '6': 'training',
    '10': '3x3',
    '1': 'open',
  },
  pricePerPersonThb: 100,
  pricePerPerson120Thb: 150,
  fullCourtFromPeople: 6,
  fullCourtPriceThb: 600,
  fullCourtPrice120Thb: 900,
};

/** Fixed display colors — not tied to Google Calendar color settings. */
export const EVENT_TYPES = [
  {
    id: 'training',
    patterns: [
      /training\s*session/i,
      /session with a coach/i,
      /^training\b/i,
      /трениров/i,
      /сесси[яи].*тренер/i,
      /тренер/i,
      /ฝึก/i,
      /โค้ช/i,
      /\[training\]/i,
    ],
    color: '#be170e',
    bg: '#fef2f1',
  },
  {
    id: '3x3',
    patterns: [/3\s*[x×]\s*3/i, /3x3\s*game/i, /\[3x3\]/i],
    color: '#0f766e',
    bg: '#f0fdfa',
  },
  {
    id: 'open',
    patterns: [/open\s*game/i, /открыт/i, /เปิด/i, /\[open\]/i],
    color: '#1d4ed8',
    bg: '#eff6ff',
  },
  {
    id: 'fullcourt',
    patterns: [
      /full\s*court/i,
      /court\s*rental/i,
      /полный\s*выкуп/i,
      /выкуп\s*корта/i,
      /เช่าสนาม/i,
      /\[full\]/i,
    ],
    color: '#b45309',
    bg: '#fffbeb',
  },
  {
    id: 'other',
    default: true,
    patterns: [],
    color: '#be170e',
    bg: '#fef2f1',
  },
];
