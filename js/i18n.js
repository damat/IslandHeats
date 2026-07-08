const messages = {
  ru: {
    siteName: 'Island Heats',
    siteTitle: 'Баскетбольный корт',
    linkInstagram: 'Instagram',
    linkLocation: 'Локация',
    menu: 'Меню',
    pricing: 'Цены',
    pricingCoachTitle: 'Тренировка с тренером',
    pricingCoach1: '100 бат — тренер',
    pricingCoach2: '100 бат — каждый ученик',
    pricingCoach3: 'Максимум 90 минут',
    pricingCoach4: 'Корт полностью ваш',
    pricingIndividualTitle: 'Индивидуальное посещение',
    pricingIndividual1: '100 бат с человека за 90 минут',
    pricingIndividual2: 'Корт не блокируется для других',
    pricingFullCourtTitle: 'Полный выкуп корта',
    pricingFullCourt1: '600 бат за корт',
    pricingFullCourt2: 'Если людей больше 6 — оплата всё равно с каждого',
    bookingNotice:
      'Отправка через WhatsApp не является подтверждённым бронированием. Дождитесь подтверждения в чате.',
    bookingCallPrefix: 'Если у вас нет WhatsApp, вы можете',
    callDirectly: 'позвонить напрямую',
    players: 'Людей',
    players6plus: '6+',
    playersUnit: (d) => `${d.n} чел.`,
    bookingSummary: (d) =>
      `Играю ${d.date}, ${d.start} – ${d.end}, ${d.players}`,
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
    bookingSubtitle: 'Выберите время — откроется WhatsApp с готовым сообщением',
    date: 'Дата',
    startTime: 'Начало',
    duration: 'Длительность',
    sessionTime: 'Сессия',
    sessionType: 'Тип сессии',
    sessionTypeAny: 'Любой',
    sessionTypeTraining: 'Training Session',
    sessionType3x3: '3x3 Game',
    sessionTypeOpen: 'Open Game',
    submitBooking: 'Отправить в WhatsApp',
    cancel: 'Отмена',
    minutes: 'мин',
    hour: 'ч',
    hours: 'ч',
    invalidTime: 'Выберите время в рабочих часах',
    conflictWarning: 'В это время уже есть событие. Менеджер уточнит доступность.',
    lang: 'Язык',
    eventTypes: {
      training: 'Training Session',
      '3x3': '3x3 Game',
      open: 'Open Game',
      other: 'Другое',
    },
    whatsappMessage: (d) =>
      `Здравствуйте! Хочу забронировать корт Island Heats.\n\n` +
      `📅 ${d.date}\n` +
      `⏰ ${d.start} – ${d.end}\n` +
      `👥 ${d.players}\n` +
      `🏀 ${d.sessionType}`,
  },
  en: {
    siteName: 'Island Heats',
    siteTitle: 'Basketball Court',
    linkInstagram: 'Instagram',
    linkLocation: 'Location',
    menu: 'Menu',
    pricing: 'Pricing',
    pricingCoachTitle: 'Coach session',
    pricingCoach1: '100 THB — coach',
    pricingCoach2: '100 THB — each student',
    pricingCoach3: 'Maximum 90 minutes',
    pricingCoach4: 'Full court reserved for you',
    pricingIndividualTitle: 'Drop-in play',
    pricingIndividual1: '100 THB per person for 90 minutes',
    pricingIndividual2: 'Court stays open for others',
    pricingFullCourtTitle: 'Full court rental',
    pricingFullCourt1: '600 THB for the court',
    pricingFullCourt2: 'If more than 6 people — still pay per person',
    bookingNotice:
      'Sending via WhatsApp is not a confirmed booking. Please wait for confirmation in the chat.',
    bookingCallPrefix: "If you don't have WhatsApp, you can",
    callDirectly: 'call directly',
    players: 'People',
    players6plus: '6+',
    playersUnit: (d) => `${d.n} people`,
    bookingSummary: (d) =>
      `Playing on ${d.date}, ${d.start} – ${d.end}, ${d.players}`,
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
    bookingSubtitle: 'Pick a time — WhatsApp will open with a ready message',
    date: 'Date',
    startTime: 'Start',
    duration: 'Duration',
    sessionTime: 'Session',
    sessionType: 'Session type',
    sessionTypeAny: 'Any',
    sessionTypeTraining: 'Training Session',
    sessionType3x3: '3x3 Game',
    sessionTypeOpen: 'Open Game',
    submitBooking: 'Send via WhatsApp',
    cancel: 'Cancel',
    minutes: 'min',
    hour: 'h',
    hours: 'h',
    invalidTime: 'Choose a time within working hours',
    conflictWarning: 'There is already an event at this time. The manager will confirm availability.',
    lang: 'Language',
    eventTypes: {
      training: 'Training Session',
      '3x3': '3x3 Game',
      open: 'Open Game',
      other: 'Other',
    },
    whatsappMessage: (d) =>
      `Hello! I'd like to book Island Heats court.\n\n` +
      `📅 ${d.date}\n` +
      `⏰ ${d.start} – ${d.end}\n` +
      `👥 ${d.players}\n` +
      `🏀 ${d.sessionType}`,
  },
  th: {
    siteName: 'Island Heats',
    siteTitle: 'สนามบาสเกตบอล',
    linkInstagram: 'Instagram',
    linkLocation: 'ที่ตั้ง',
    menu: 'เมนู',
    pricing: 'ราคา',
    pricingCoachTitle: 'เซสชันกับโค้ช',
    pricingCoach1: '100 บาท — โค้ช',
    pricingCoach2: '100 บาท — นักเรียนแต่ละคน',
    pricingCoach3: 'สูงสุด 90 นาที',
    pricingCoach4: 'จองสนามทั้งหมดให้คุณ',
    pricingIndividualTitle: 'มาเล่นแยก',
    pricingIndividual1: '100 บาทต่อคน 90 นาที',
    pricingIndividual2: 'สนามไม่ปิดสำหรับคนอื่น',
    pricingFullCourtTitle: 'เช่าสนามทั้งหมด',
    pricingFullCourt1: '600 บาทต่อสนาม',
    pricingFullCourt2: 'ถ้ามากกว่า 6 คน — ยังจ่ายต่อคน',
    bookingNotice:
      'การส่งผ่าน WhatsApp ไม่ใช่การจองที่ยืนยันแล้ว กรุณารอการยืนยันในแชท',
    bookingCallPrefix: 'หากไม่มี WhatsApp คุณสามารถ',
    callDirectly: 'โทรโดยตรง',
    players: 'จำนวนคน',
    players6plus: '6+',
    playersUnit: (d) => `${d.n} คน`,
    bookingSummary: (d) =>
      `เล่น ${d.date} ${d.start} – ${d.end}, ${d.players}`,
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
    bookingSubtitle: 'เลือกเวลา — จะเปิด WhatsApp พร้อมข้อความ',
    date: 'วันที่',
    startTime: 'เริ่ม',
    duration: 'ระยะเวลา',
    sessionTime: 'เซสชัน',
    sessionType: 'ประเภทเซสชัน',
    sessionTypeAny: 'ไม่ระบุ',
    sessionTypeTraining: 'Training Session',
    sessionType3x3: '3x3 Game',
    sessionTypeOpen: 'Open Game',
    submitBooking: 'ส่งผ่าน WhatsApp',
    cancel: 'ยกเลิก',
    minutes: 'นาที',
    hour: 'ชม.',
    hours: 'ชม.',
    invalidTime: 'เลือกเวลาในช่วงเวลาทำการ',
    conflictWarning: 'มีกิจกรรมในช่วงเวลานี้แล้ว ผู้จัดการจะยืนยันความพร้อม',
    lang: 'ภาษา',
    eventTypes: {
      training: 'Training Session',
      '3x3': '3x3 Game',
      open: 'Open Game',
      other: 'อื่นๆ',
    },
    whatsappMessage: (d) =>
      `สวัสดีครับ/ค่ะ ต้องการจองสนาม Island Heats\n\n` +
      `📅 ${d.date}\n` +
      `⏰ ${d.start} – ${d.end}\n` +
      `👥 ${d.players}\n` +
      `🏀 ${d.sessionType}`,
  },
};

let currentLocale = 'en';

export function setLocale(locale) {
  if (messages[locale]) {
    currentLocale = locale;
    localStorage.setItem('island-heats-locale', locale);
  }
}

export function getLocale() {
  return currentLocale;
}

function detectBrowserLocale(defaultLocale) {
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const lang of langs) {
    const code = lang.toLowerCase().split('-')[0];
    if (messages[code]) return code;
  }
  return defaultLocale;
}

export function initLocale(defaultLocale) {
  const saved = localStorage.getItem('island-heats-locale');
  if (saved && messages[saved]) {
    currentLocale = saved;
  } else {
    currentLocale = detectBrowserLocale(defaultLocale);
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
  ru: 'Русский',
  en: 'English',
  th: 'ไทย',
};
