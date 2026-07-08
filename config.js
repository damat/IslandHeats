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
  durationOptions: [60, 90, 120],
  whatsappPhone: '',
  locale: 'en',
  supportedLocales: ['ru', 'en', 'th'],
  logoUrl: 'assets/logo.svg', // replace with assets/logo.jpg from Instagram if preferred
  links: {
    instagram: 'https://www.instagram.com/island.heats/',
    location: 'https://maps.app.goo.gl/JxEVuxh6jh5murLv8',
  },
  // Google Calendar colorId → event type (matches calendar color labels)
  colorTypeMap: {
    '6': 'training', // Tangerine — Training Session
    '10': '3x3', // Basil — 3x3 Game
    '1': 'open', // Lavender — Open Game
  },
};

// Google Calendar palette: https://developers.google.com/calendar/api/v3/reference/colors
export const EVENT_TYPES = [
  {
    id: 'training',
    patterns: [
      /training\s*session/i,
      /^training\b/i,
      /трениров/i,
      /ฝึก/i,
      /\[training\]/i,
    ],
    color: '#F4511E',
    bg: '#FBE9E7',
  },
  {
    id: '3x3',
    patterns: [/3\s*[x×]\s*3/i, /3x3\s*game/i, /\[3x3\]/i],
    color: '#0B8043',
    bg: '#E6F4EA',
  },
  {
    id: 'open',
    patterns: [/open\s*game/i, /открыт/i, /เปิด/i, /\[open\]/i],
    color: '#7986CB',
    bg: '#E8EAF6',
  },
  {
    id: 'other',
    default: true,
    patterns: [],
    color: '#616161',
    bg: '#F5F5F5',
  },
];
