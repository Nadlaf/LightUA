/**
 * All user-facing copy. Keys are consumed through `t()`; the shape of this
 * object is what makes those keys type-checked (see i18next.d.ts).
 */
export const uk = {
  app: {
    name: 'СвітлоUA',
    emergencyBanner: 'Наразі працюють аварійні відключення. Графіки можуть бути неточними.',
  },
  nav: {
    about: 'Про проєкт',
    contacts: 'Контакти',
    support: 'Підтримка',
  },
  theme: {
    toDark: 'Увімкнути темну тему',
    toLight: 'Увімкнути світлу тему',
  },
  footer: {
    copyright: '© 2026 Графік відключень світла. Всі права захищені.',
  },
  modal: {
    close: 'Закрити',
    about: {
      title: 'Перехід на GitHub',
      description: 'Ви переходите на сторінку з вихідним кодом проєкту. Бажаєте продовжити?',
      cancel: 'Скасувати',
      confirm: 'Перейти',
    },
    contacts: {
      title: "Зв'язок з розробниками",
      description: 'Маєте пропозиції чи знайшли помилку? Пишіть нам:',
    },
    support: {
      title: 'Функція в розробці',
      acknowledge: 'Зрозуміло',
    },
  },
  form: {
    title: 'Графік відключень світла',
    regionLabel: 'Область',
    regionPlaceholder: 'Оберіть область',
    queueLabel: 'Черга',
    queuePlaceholderNoRegion: 'Спочатку оберіть область',
    queuePlaceholder: 'Оберіть чергу',
    queueOption: 'Черга {{queue}}',
    dayLabel: 'День',
    submit: 'Показати графік',
    weekDays: {
      mon: 'Пн',
      tue: 'Вт',
      wed: 'Ср',
      thu: 'Чт',
      fri: 'Пт',
      sat: 'Сб',
      sun: 'Нд',
    },
    validation: {
      region: 'Оберіть область',
      queue: 'Оберіть чергу',
      date: 'Дата не обрана',
    },
  },
  result: {
    emptyTitle: 'Графік не обрано',
    emptyDescription:
      'Будь ласка, вкажіть вашу адресу в панелі зліва, щоб побачити розклад відключень.',
    listTitle: 'Графік світла',
    offLabel: 'Без світла',
    offHours: '~{{hours}} год',
    legendOn: 'Є світло',
    legendOff: 'Немає світла',
    rowOn: 'Світло є',
    rowOff: 'немає світла',
    showDonut: 'Показати звичайну діаграму',
    showClock: 'Показати погодинний циферблат',
  },
  errors: {
    title: 'Не вдалося показати графік',
    schedule: 'Не вдалося завантажити графік для обраної дати.',
    cities: 'Не вдалося завантажити список областей.',
    regionSchedule: 'Не вдалося завантажити графік для області.',
    regionNoData: 'Немає даних для обраної області.',
    noDataForDate: 'Дані за {{date}} відсутні.',
    noDataForQueue: 'Дані для черги {{queue}} відсутні.',
  },
} as const;
