import type {
  CalendarInfo,
  ScheduleJsonPayload,
  ScheduleJsonRow,
  ScheduleRequest,
  ScheduleResultData,
  ScheduleStats,
  TimelineInterval,
} from '../types';

const FILES = {
  cities: '/cities.json',
  today: '/schedule_today.json',
  tomorrow: '/schedule_tomorrow.json',
  historyBase: '/schedule_history_',
} as const;

interface ScheduleSource {
  type: 'today' | 'tomorrow' | 'history';
  url: string;
}

interface MinuteInterval {
  start: number;
  end: number;
}

export const fetchSchedule = async (requestData: ScheduleRequest): Promise<ScheduleResultData> => {
  const targetDate = requestData.date;
  const regionId = Number(requestData.region);

  try {
    const source = await determineSourceForDate(targetDate, regionId);

    if (!source) {
      throw new Error(`Дані за ${targetDate} відсутні.`);
    }

    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`Не вдалося завантажити файл ${source.url}`);

    const dataArray = (await response.json()) as ScheduleJsonPayload;
    let dayData: ScheduleJsonRow | undefined;

    if (Array.isArray(dataArray)) {
      dayData = dataArray.find((item) => item.schedule_date === targetDate && item.channel_id === regionId);
    } else {
      dayData = dataArray[targetDate];
    }

    if (!dayData?.schedule) {
      throw new Error(`Графік для регіону (ID: ${regionId}) на ${targetDate} не знайдено.`);
    }

    const schedule = dayData.schedule;
    const requestedGroup = requestData.group;
    const isEmergency = dayData.emergency_outages ?? false;

    if (!schedule[requestedGroup]) {
      throw new Error(`Дані для черги ${requestedGroup} відсутні.`);
    }

    const { timeline, stats } = generateExactTimeline(schedule[requestedGroup]);

    return {
      region: regionId,
      group: requestedGroup,
      day: targetDate,
      timeline,
      stats,
      emergencyOutages: isEmergency,
    };
  } catch (error) {
    console.error('Помилка API:', error);
    throw error;
  }
};

export const getCalendarInfo = async (regionId: string): Promise<CalendarInfo> => {
  const info: CalendarInfo = { todayDate: null, availableDates: [] };
  const availableDates = new Set<string>();

  try {
    const todayRes = await fetch(FILES.today);
    if (todayRes.ok) {
      const data = (await todayRes.json()) as ScheduleJsonRow[];
      if (Array.isArray(data) && data.length > 0) {
        info.todayDate = data[0]?.schedule_date ?? null;
        if (regionId && info.todayDate) {
          const hasRegion = data.some((d) => d.channel_id === Number(regionId));
          if (hasRegion) availableDates.add(info.todayDate);
        }
      }
    }

    if (!regionId) return { todayDate: info.todayDate, availableDates: [] };

    const rId = Number(regionId);

    try {
      const tmrRes = await fetch(FILES.tomorrow);
      if (tmrRes.ok) {
        const data = (await tmrRes.json()) as ScheduleJsonRow[];
        if (Array.isArray(data)) {
          const hasRegion = data.some((d) => d.channel_id === rId);
          const scheduleDate = data[0]?.schedule_date;
          if (hasRegion && scheduleDate) availableDates.add(scheduleDate);
        }
      }
    } catch {
      // Tomorrow schedule is optional.
    }

    try {
      const historyUrl = `${FILES.historyBase}${rId}.json`;
      const histRes = await fetch(historyUrl);
      if (histRes.ok) {
        const historyData = (await histRes.json()) as ScheduleJsonRow[];
        if (Array.isArray(historyData)) {
          historyData.forEach((item) => {
            if (item.schedule_date && item.channel_id === rId) availableDates.add(item.schedule_date);
          });
        }
      }
    } catch {
      console.warn(`Історія для регіону ${rId} не знайдена.`);
    }

    return { todayDate: info.todayDate, availableDates: Array.from(availableDates).sort() };
  } catch {
    return info;
  }
};

async function determineSourceForDate(date: string, regionId: number): Promise<ScheduleSource> {
  let todayDate: string | null = null;

  try {
    const res = await fetch(FILES.today);
    const data = (await res.json()) as ScheduleJsonRow[];
    if (Array.isArray(data) && data.length > 0) todayDate = data[0]?.schedule_date ?? null;
  } catch {
    // Fall back to history if today's file cannot be read.
  }

  if (todayDate && date === todayDate) return { type: 'today', url: FILES.today };
  if (todayDate && date > todayDate) return { type: 'tomorrow', url: FILES.tomorrow };
  return { type: 'history', url: `${FILES.historyBase}${regionId}.json` };
}

const generateExactTimeline = (offRangesStr: string[]): { timeline: TimelineInterval[]; stats: ScheduleStats } => {
  const offIntervals: MinuteInterval[] = offRangesStr.map((range) => {
    const [startStr, endStr] = range.split('-');
    const start = timeToMinutes(startStr ?? '00:00');
    let end = timeToMinutes(endStr ?? '00:00');
    if (end === 0 && start !== 0) end = 1440;
    return { start, end };
  });

  offIntervals.sort((a, b) => a.start - b.start);

  const timeline: TimelineInterval[] = [];
  let currentCursor = 0;
  let totalOffMinutes = 0;

  offIntervals.forEach((off) => {
    if (off.start > currentCursor) {
      timeline.push({ start: minutesToTime(currentCursor), end: minutesToTime(off.start), type: 'on' });
    }

    if (off.end > off.start) {
      timeline.push({ start: minutesToTime(off.start), end: minutesToTime(off.end), type: 'off' });
      totalOffMinutes += off.end - off.start;
      currentCursor = Math.max(currentCursor, off.end);
    }
  });

  if (currentCursor < 1440) {
    timeline.push({ start: minutesToTime(currentCursor), end: '24:00', type: 'on' });
  }

  return { timeline, stats: { totalOffMinutes, percentage: Math.round((totalOffMinutes / 1440) * 100) } };
};

const timeToMinutes = (timeStr: string): number => {
  if (timeStr === '24:00') return 1440;
  const [h = 0, m = 0] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  if (minutes === 1440) return '24:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
