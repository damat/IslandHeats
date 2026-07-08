const messages = {
  ru: {
    siteName: 'Island Heats',
    siteTitle: 'Стритбол-корт на Пхукете',
    linkInstagram: 'Instagram',
    linkLocation: 'Локация',
    menu: 'Меню',
    menuInfoLinks: 'Инфо и ссылки',
    pricing: 'Цены',
    pricingCoachTitle: 'Сессия с тренером',
    pricingCoach1: 'Приходите со своим тренером или вы сами тренер',
    pricingCoach2: 'Тренер (гость корта): 100 бат',
    pricingCoach3: '90 мин: 100 бат каждый ученик · 2 часа: 150 бат',
    pricingCoach4: 'Корт полностью ваш',
    pricingIndividualTitle: 'Индивидуальное посещение',
    pricingIndividual1: '90 мин: 100 бат с человека · 2 часа: 150 бат',
    pricingIndividual2: 'Корт не блокируется для других',
    pricingFullCourtTitle: 'Полный выкуп корта',
    pricingFullCourt1: '90 минут: 600 бат',
    pricingFullCourt2: '2 часа: 900 бат',
    pricingFullCourt3: 'Если больше 6 человек — +100 бат за каждого дополнительного',
    pricingAskMore: 'Не нашли свой вариант? Напишите нам в WhatsApp',
    pricingAskWhatsApp: 'Здравствуйте! Хочу узнать прайс Island Heats подробнее.',
    priceHintLabel: 'Как считается цена',
    priceHintText:
      '90 мин — 100 бат с человека, 2 часа — 150 бат. Для сессии с тренером тренер тоже входит в расчёт (+1), но в число игроков не добавляется. Полный корт: 600 бат за 90 мин / 900 бат за 2 часа; сверх 6 человек — +100 бат за каждого.',
    bookingNotice: 'Отправка в WhatsApp — не подтверждение. Дождитесь ответа в чате.',
    bookingCallShort: 'Нет WhatsApp —',
    callDirectly: 'позвоните',
    players: 'Игроки',
    players6plus: '6+',
    playersUnit: (d) => {
      const n = d.n;
      if (n === 1) return '1 игрок';
      if (n >= 2 && n <= 4) return `${n} игрока`;
      return `${n} игроков`;
    },
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
    sessionTypeTraining: 'Сессия с тренером',
    sessionType3x3: 'Игра 3×3',
    sessionTypeOpen: 'Открытая игра',
    guestName: 'Имя (необязательно)',
    guestNamePlaceholder: 'Ваше имя',
    linkWhatsApp: 'WhatsApp',
    linkPhone: 'Телефон',
    bookingSummary: (d) => {
      const base = d.name
        ? `${d.name}, ${d.date}, ${d.start} – ${d.end}, ${d.players}`
        : `${d.date}, ${d.start} – ${d.end}, ${d.players}`;
      return d.price ? `${base}, ` : base;
    },
    submitBooking: 'Отправить в WhatsApp',
    cancel: 'Отмена',
    minutes: 'мин',
    hour: 'ч',
    hours: 'ч',
    invalidTime: 'Выберите время в рабочих часах',
    pastBooking: 'Нельзя бронировать время в прошлом',
    conflictWarning: 'В это время уже есть событие. Менеджер уточнит доступность.',
    lang: 'Язык',
    eventTypes: {
      training: 'Сессия с тренером',
      '3x3': 'Игра 3×3',
      open: 'Открытая игра',
      other: 'Другое',
    },
    addToCalendar: 'Добавить в календарь',
    whatsappMessage: (d) => {
      let msg = d.name
        ? `Здравствуйте! Меня зовут ${d.name}. Хочу забронировать корт Island Heats.\n\n`
        : `Здравствуйте! Хочу забронировать корт Island Heats.\n\n`;
      msg += `📅 ${d.date}\n⏰ ${d.start} – ${d.end}\n👥 ${d.players}`;
      if (d.price) msg += `\n💰 ${d.price}`;
      if (d.sessionType) msg += `\n🏀 ${d.sessionType}`;
      if (d.calendarUrl) msg += `\n\n${d.addToCalendar}:\n${d.calendarUrl}`;
      return msg;
    },
  },
  en: {
    siteName: 'Island Heats',
    siteTitle: 'Streetball court in Phuket',
    linkInstagram: 'Instagram',
    linkLocation: 'Location',
    menu: 'Menu',
    menuInfoLinks: 'Info & Links',
    pricing: 'Pricing',
    pricingCoachTitle: 'Session with a coach',
    pricingCoach1: 'You come with a coach or you are a coach yourself',
    pricingCoach2: 'Coach (court guest): 100 THB',
    pricingCoach3: '90 min: 100 THB each student · 2 hours: 150 THB',
    pricingCoach4: 'Full court reserved for you',
    pricingIndividualTitle: 'Drop-in play',
    pricingIndividual1: '90 min: 100 THB per person · 2 hours: 150 THB',
    pricingIndividual2: 'Court stays open for others',
    pricingFullCourtTitle: 'Full court rental',
    pricingFullCourt1: '90 minutes: 600 THB',
    pricingFullCourt2: '2 hours: 900 THB',
    pricingFullCourt3: 'If more than 6 people — +100 THB for each extra person',
    pricingAskMore: "Didn't find your option? Message us on WhatsApp",
    pricingAskWhatsApp: "Hello! I'd like to know Island Heats pricing in more detail.",
    priceHintLabel: 'How price is calculated',
    priceHintText:
      '90 min — 100 THB per person, 2 hours — 150 THB. For a coach session the coach is included in the price (+1) but not in the player count. Full court: 600 THB for 90 min / 900 THB for 2 hours; over 6 people — +100 THB each.',
    bookingNotice: 'WhatsApp is not a confirmed booking. Wait for a reply.',
    bookingCallShort: 'No WhatsApp?',
    callDirectly: 'Call',
    players: 'Players',
    players6plus: '6+',
    playersUnit: (d) => (d.n === 1 ? '1 player' : `${d.n} players`),
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
    sessionTypeTraining: 'Session with a coach',
    sessionType3x3: '3x3 Game',
    sessionTypeOpen: 'Open Game',
    guestName: 'Name (optional)',
    guestNamePlaceholder: 'Your name',
    linkWhatsApp: 'WhatsApp',
    linkPhone: 'Phone',
    bookingSummary: (d) => {
      const base = d.name
        ? `${d.name}, ${d.date}, ${d.start} – ${d.end}, ${d.players}`
        : `${d.date}, ${d.start} – ${d.end}, ${d.players}`;
      return d.price ? `${base}, ` : base;
    },
    submitBooking: 'Send via WhatsApp',
    cancel: 'Cancel',
    minutes: 'min',
    hour: 'hour',
    hours: 'hours',
    invalidTime: 'Choose a time within working hours',
    pastBooking: 'Past times cannot be booked',
    conflictWarning: 'There is already an event at this time. The manager will confirm availability.',
    lang: 'Language',
    eventTypes: {
      training: 'Session with a coach',
      '3x3': '3x3 Game',
      open: 'Open Game',
      other: 'Other',
    },
    addToCalendar: 'Add to your calendar',
    whatsappMessage: (d) => {
      let msg = d.name
        ? `Hello! My name is ${d.name}. I'd like to book Island Heats court.\n\n`
        : `Hello! I'd like to book Island Heats court.\n\n`;
      msg += `📅 ${d.date}\n⏰ ${d.start} – ${d.end}\n👥 ${d.players}`;
      if (d.price) msg += `\n💰 ${d.price}`;
      if (d.sessionType) msg += `\n🏀 ${d.sessionType}`;
      if (d.calendarUrl) msg += `\n\n${d.addToCalendar}:\n${d.calendarUrl}`;
      return msg;
    },
  },
  th: {
    siteName: 'Island Heats',
    siteTitle: 'สนามสตรีทบอลในภูเก็ต',
    linkInstagram: 'Instagram',
    linkLocation: 'ที่ตั้ง',
    menu: 'เมนู',
    menuInfoLinks: 'ข้อมูลและลิงก์',
    pricing: 'ราคา',
    pricingCoachTitle: 'เซสชันกับโค้ช',
    pricingCoach1: 'มาพร้อมโค้ช หรือคุณเป็นโค้ชเอง',
    pricingCoach2: 'โค้ช (ผู้ใช้สนาม): 100 บาท',
    pricingCoach3: '90 นาที: 100 บาทต่อนักเรียน · 2 ชม.: 150 บาท',
    pricingCoach4: 'จองสนามทั้งหมดให้คุณ',
    pricingIndividualTitle: 'มาเล่นแยก',
    pricingIndividual1: '90 นาที: 100 บาทต่อคน · 2 ชม.: 150 บาท',
    pricingIndividual2: 'สนามไม่ปิดสำหรับคนอื่น',
    pricingFullCourtTitle: 'เช่าสนามทั้งหมด',
    pricingFullCourt1: '90 นาที: 600 บาท',
    pricingFullCourt2: '2 ชม.: 900 บาท',
    pricingFullCourt3: 'ถ้ามากกว่า 6 คน — +100 บาทต่อคนเพิ่ม',
    pricingAskMore: 'ไม่เจอตัวเลือกที่ใช่? เขียนหาเราทาง WhatsApp',
    pricingAskWhatsApp: 'สวัสดีครับ/ค่ะ อยากทราบราคา Island Heats เพิ่มเติม',
    priceHintLabel: 'วิธีคิดราคา',
    priceHintText:
      '90 นาที — 100 บาทต่อคน, 2 ชม. — 150 บาท เซสชันกับโค้ชคิดโค้ชในราคา (+1) แต่ไม่นับในจำนวนผู้เล่น เช่าสนามทั้งหมด: 600 บาท 90 นาที / 900 บาท 2 ชม. เกิน 6 คน — +100 บาทต่อคน',
    bookingNotice: 'ส่งผ่าน WhatsApp ไม่ใช่การยืนยัน รอการตอบกลับ',
    bookingCallShort: 'ไม่มี WhatsApp?',
    callDirectly: 'โทร',
    players: 'ผู้เล่น',
    players6plus: '6+',
    playersUnit: (d) => `${d.n} คน`,
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
    sessionTypeTraining: 'เซสชันกับโค้ช',
    sessionType3x3: 'เกม 3×3',
    sessionTypeOpen: 'เกมเปิด',
    guestName: 'ชื่อ (ไม่บังคับ)',
    guestNamePlaceholder: 'ชื่อของคุณ',
    linkWhatsApp: 'WhatsApp',
    linkPhone: 'โทรศัพท์',
    bookingSummary: (d) => {
      const base = d.name
        ? `${d.name}, ${d.date}, ${d.start} – ${d.end}, ${d.players}`
        : `${d.date}, ${d.start} – ${d.end}, ${d.players}`;
      return d.price ? `${base}, ` : base;
    },
    submitBooking: 'ส่งผ่าน WhatsApp',
    cancel: 'ยกเลิก',
    minutes: 'นาที',
    hour: 'ชม.',
    hours: 'ชม.',
    invalidTime: 'เลือกเวลาในช่วงเวลาทำการ',
    pastBooking: 'จองเวลาย้อนหลังไม่ได้',
    conflictWarning: 'มีกิจกรรมในช่วงเวลานี้แล้ว ผู้จัดการจะยืนยันความพร้อม',
    lang: 'ภาษา',
    eventTypes: {
      training: 'เซสชันกับโค้ช',
      '3x3': 'เกม 3×3',
      open: 'เกมเปิด',
      other: 'อื่นๆ',
    },
    addToCalendar: 'เพิ่มในปฏิทิน',
    whatsappMessage: (d) => {
      let msg = d.name
        ? `สวัสดีครับ/ค่ะ ชื่อ ${d.name} ต้องการจองสนาม Island Heats\n\n`
        : `สวัสดีครับ/ค่ะ ต้องการจองสนาม Island Heats\n\n`;
      msg += `📅 ${d.date}\n⏰ ${d.start} – ${d.end}\n👥 ${d.players}`;
      if (d.price) msg += `\n💰 ${d.price}`;
      if (d.sessionType) msg += `\n🏀 ${d.sessionType}`;
      if (d.calendarUrl) msg += `\n\n${d.addToCalendar}:\n${d.calendarUrl}`;
      return msg;
    },
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
  en: 'Eng',
  ru: 'Рус',
  th: 'ไทย',
};
