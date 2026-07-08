const messages = {
  ru: {
    siteName: 'Island Heats',
    siteTagline: 'Баскетбольный корт',
    today: 'Сегодня',
    prevDay: 'Предыдущий день',
    nextDay: 'Следующий день',
    free: 'Свободно',
    busy: 'Занято',
    private: 'Приватное событие',
    loading: 'Загрузка расписания…',
    errorTitle: 'Не удалось загрузить расписание',
    errorHint: 'Проверьте подключение или настройки API-ключа.',
    retry: 'Повторить',
    bookCourt: 'Забронировать',
    eventDetails: 'Детали события',
    close: 'Закрыть',
    time: 'Время',
    description: 'Описание',
    type: 'Тип',
    noDescription: 'Без описания',
    allFree: 'Все слоты свободны',
    past: 'Прошло',
    whatsappNotConfigured: 'Номер WhatsApp ещё не настроен. Сообщение скопировано в буфер обмена.',
    bookingTitle: 'Заявка на бронирование',
    bookingSubtitle: 'Заполните форму — откроется WhatsApp с готовым сообщением',
    date: 'Дата',
    startTime: 'Начало',
    duration: 'Длительность',
    endTime: 'Окончание',
    yourName: 'Ваше имя',
    contact: 'Телефон или email',
    notes: 'Комментарий (необязательно)',
    sessionType: 'Тип сессии',
    sessionTypeAny: 'Любой',
    sessionTypeTraining: 'Training session',
    sessionType3x3: '3×3 game',
    sessionTypeOpen: 'Open game',
    submitBooking: 'Отправить в WhatsApp',
    cancel: 'Отмена',
    minutes: 'мин',
    hour: 'ч',
    hours: 'ч',
    nameRequired: 'Укажите имя',
    contactRequired: 'Укажите телефон или email',
    invalidTime: 'Выберите время в рабочих часах',
    conflictWarning: 'В это время уже есть событие. Менеджер уточнит доступность.',
    lang: 'Язык',
    eventTypes: {
      training: 'Training session',
      '3x3': '3×3 game',
      open: 'Open game',
      other: 'Другое',
    },
    whatsappMessage: (d) =>
      `Здравствуйте! Хочу забронировать баскетбольный корт.\n\n` +
      `📅 Дата: ${d.date}\n` +
      `⏰ Время: ${d.start} – ${d.end}\n` +
      `🏀 Тип: ${d.sessionType}\n` +
      `👤 Имя: ${d.name}\n` +
      `📞 Контакт: ${d.contact}` +
      (d.notes ? `\n💬 Комментарий: ${d.notes}` : ''),
  },
  en: {
    siteName: 'Island Heats',
    siteTagline: 'Basketball Court',
    today: 'Today',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    free: 'Available',
    busy: 'Booked',
    private: 'Private event',
    loading: 'Loading schedule…',
    errorTitle: 'Could not load schedule',
    errorHint: 'Check your connection or API key settings.',
    retry: 'Retry',
    bookCourt: 'Book',
    eventDetails: 'Event details',
    close: 'Close',
    time: 'Time',
    description: 'Description',
    type: 'Type',
    noDescription: 'No description',
    allFree: 'All slots are available',
    past: 'Past',
    whatsappNotConfigured:
      'WhatsApp number is not configured yet. Message copied to clipboard.',
    bookingTitle: 'Booking request',
    bookingSubtitle: 'Fill out the form — WhatsApp will open with a ready message',
    date: 'Date',
    startTime: 'Start',
    duration: 'Duration',
    endTime: 'End',
    yourName: 'Your name',
    contact: 'Phone or email',
    notes: 'Notes (optional)',
    sessionType: 'Session type',
    sessionTypeAny: 'Any',
    sessionTypeTraining: 'Training session',
    sessionType3x3: '3×3 game',
    sessionTypeOpen: 'Open game',
    submitBooking: 'Send via WhatsApp',
    cancel: 'Cancel',
    minutes: 'min',
    hour: 'h',
    hours: 'h',
    nameRequired: 'Please enter your name',
    contactRequired: 'Please enter phone or email',
    invalidTime: 'Choose a time within working hours',
    conflictWarning: 'There is already an event at this time. The manager will confirm availability.',
    lang: 'Language',
    eventTypes: {
      training: 'Training session',
      '3x3': '3×3 game',
      open: 'Open game',
      other: 'Other',
    },
    whatsappMessage: (d) =>
      `Hello! I'd like to book the basketball court.\n\n` +
      `📅 Date: ${d.date}\n` +
      `⏰ Time: ${d.start} – ${d.end}\n` +
      `🏀 Type: ${d.sessionType}\n` +
      `👤 Name: ${d.name}\n` +
      `📞 Contact: ${d.contact}` +
      (d.notes ? `\n💬 Notes: ${d.notes}` : ''),
  },
  th: {
    siteName: 'Island Heats',
    siteTagline: 'สนามบาสเกตบอล',
    today: 'วันนี้',
    prevDay: 'วันก่อนหน้า',
    nextDay: 'วันถัดไป',
    free: 'ว่าง',
    busy: 'จองแล้ว',
    private: 'กิจกรรมส่วนตัว',
    loading: 'กำลังโหลดตาราง…',
    errorTitle: 'โหลดตารางไม่สำเร็จ',
    errorHint: 'ตรวจสอบการเชื่อมต่อหรือการตั้งค่า API key',
    retry: 'ลองอีกครั้ง',
    bookCourt: 'จอง',
    eventDetails: 'รายละเอียดกิจกรรม',
    close: 'ปิด',
    time: 'เวลา',
    description: 'รายละเอียด',
    type: 'ประเภท',
    noDescription: 'ไม่มีรายละเอียด',
    allFree: 'ช่วงเวลาทั้งหมดว่าง',
    past: 'ผ่านมาแล้ว',
    whatsappNotConfigured:
      'ยังไม่ได้ตั้งค่าเบอร์ WhatsApp คัดลอกข้อความไปยังคลิปบอร์ดแล้ว',
    bookingTitle: 'คำขอจอง',
    bookingSubtitle: 'กรอกแบบฟอร์ม — จะเปิด WhatsApp พร้อมข้อความ',
    date: 'วันที่',
    startTime: 'เริ่ม',
    duration: 'ระยะเวลา',
    endTime: 'สิ้นสุด',
    yourName: 'ชื่อของคุณ',
    contact: 'โทรศัพท์หรืออีเมล',
    notes: 'หมายเหตุ (ไม่บังคับ)',
    sessionType: 'ประเภทเซสชัน',
    sessionTypeAny: 'ไม่ระบุ',
    sessionTypeTraining: 'Training session',
    sessionType3x3: '3×3 game',
    sessionTypeOpen: 'Open game',
    submitBooking: 'ส่งผ่าน WhatsApp',
    cancel: 'ยกเลิก',
    minutes: 'นาที',
    hour: 'ชม.',
    hours: 'ชม.',
    nameRequired: 'กรุณากรอกชื่อ',
    contactRequired: 'กรุณากรอกโทรศัพท์หรืออีเมล',
    invalidTime: 'เลือกเวลาในช่วงเวลาทำการ',
    conflictWarning: 'มีกิจกรรมในช่วงเวลานี้แล้ว ผู้จัดการจะยืนยันความพร้อม',
    lang: 'ภาษา',
    eventTypes: {
      training: 'Training session',
      '3x3': '3×3 game',
      open: 'Open game',
      other: 'อื่นๆ',
    },
    whatsappMessage: (d) =>
      `สวัสดีครับ/ค่ะ ต้องการจองสนามบาสเกตบอล\n\n` +
      `📅 วันที่: ${d.date}\n` +
      `⏰ เวลา: ${d.start} – ${d.end}\n` +
      `🏀 ประเภท: ${d.sessionType}\n` +
      `👤 ชื่อ: ${d.name}\n` +
      `📞 ติดต่อ: ${d.contact}` +
      (d.notes ? `\n💬 หมายเหตุ: ${d.notes}` : ''),
  },
};

let currentLocale = 'ru';

export function setLocale(locale) {
  if (messages[locale]) {
    currentLocale = locale;
    localStorage.setItem('island-heats-locale', locale);
  }
}

export function getLocale() {
  return currentLocale;
}

export function initLocale(defaultLocale) {
  const saved = localStorage.getItem('island-heats-locale');
  if (saved && messages[saved]) {
    currentLocale = saved;
  } else if (messages[defaultLocale]) {
    currentLocale = defaultLocale;
  }
}

export function t(key) {
  const parts = key.split('.');
  let value = messages[currentLocale];
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value === 'function') return value;
  return value ?? key;
}

export function tf(key, data) {
  const parts = key.split('.');
  let value = messages[currentLocale];
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value === 'function') return value(data);
  return value ?? key;
}

export function getSessionTypeLabel(id) {
  const map = {
    any: t('sessionTypeAny'),
    training: t('sessionTypeTraining'),
    '3x3': t('sessionType3x3'),
    open: t('sessionTypeOpen'),
  };
  return map[id] ?? id;
}

export const LOCALE_LABELS = {
  ru: 'Рус',
  en: 'Eng',
  th: 'ไทย',
};
