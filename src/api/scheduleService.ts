import type {
  CalendarInfo,
  City,
  ScheduleRequest,
  ScheduleResponse,
  ScheduleResultData,
  ScheduleStats,
  StatusResponse,
  TimelineInterval,
} from '../types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface MinuteInterval {
  start: number;
  end: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

let _citiesCache: City[] | null = null;

export async function getCities(): Promise<City[]> {
  if (_citiesCache) return _citiesCache;
  const data = await apiFetch<{ cities: City[] }>('/api/cities');
  _citiesCache = data.cities;
  return _citiesCache;
}

export async function getScheduleToday(
  channelId: number,
  queue?: string,
): Promise<ScheduleResponse | null> {
  const params = new URLSearchParams({ channel_id: String(channelId) });
  if (queue) params.set('queue', queue);

  const res = await fetch(`${BASE}/api/schedules/today?${params.toString()}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<ScheduleResponse>;
}

export async function getScheduleTomorrow(
  channelId: number,
  queue?: string,
): Promise<ScheduleResponse | null> {
  const params = new URLSearchParams({ channel_id: String(channelId) });
  if (queue) params.set('queue', queue);

  const res = await fetch(`${BASE}/api/schedules/tomorrow?${params.toString()}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<ScheduleResponse>;
}

export async function getScheduleForDate(
  channelId: number,
  date: string,
  queue?: string,
): Promise<ScheduleResponse | null> {
  const params = new URLSearchParams({ channel_id: String(channelId), date });
  if (queue) params.set('queue', queue);

  const res = await fetch(`${BASE}/api/schedules?${params.toString()}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<ScheduleResponse>;
}

export async function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>('/api/status');
}

export async function triggerUpdate(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE}/api/update`, { method: 'POST' });
  return res.json() as Promise<{ status: string; message: string }>;
}

export const fetchSchedule = async (requestData: ScheduleRequest): Promise<ScheduleResultData> => {
  const channelId = Number(requestData.region);
  const requestedGroup = requestData.group;
  const targetDate = requestData.date;

  try {
    const todayResponse = await getScheduleToday(channelId);
    const todayDate = todayResponse?.date ?? null;

    let apiResponse: ScheduleResponse | null = null;

    if (todayDate && targetDate === todayDate) {
      apiResponse = await getScheduleToday(channelId);
    } else if (todayDate && targetDate > todayDate) {
      apiResponse = await getScheduleTomorrow(channelId);
    } else {
      apiResponse = await getScheduleForDate(channelId, targetDate);
    }

    if (!apiResponse) {
      throw new Error(`Дані за ${targetDate} відсутні.`);
    }

    if (!apiResponse.schedule[requestedGroup]) {
      throw new Error(`Дані для черги ${requestedGroup} відсутні.`);
    }

    const { timeline, stats } = generateExactTimeline(apiResponse.schedule[requestedGroup]);

    return {
      region: channelId,
      group: requestedGroup,
      day: apiResponse.date,
      timeline,
      stats,
      emergencyOutages: apiResponse.emergency_outages,
    };
  } catch (error) {
    console.error('Помилка API:', error);
    throw error;
  }
};

export const getCalendarInfo = async (regionId: string): Promise<CalendarInfo> => {
  const info: CalendarInfo = { todayDate: null, availableDates: [] };

  if (!regionId) return info;

  const channelId = Number(regionId);
  const availableDates = new Set<string>();

  try {
    const todayData = await getScheduleToday(channelId);
    if (todayData) {
      info.todayDate = todayData.date;
      availableDates.add(todayData.date);
    }
  } catch {
    /* ignore */
  }

  try {
    const tomorrowData = await getScheduleTomorrow(channelId);
    if (tomorrowData) {
      availableDates.add(tomorrowData.date);
    }
  } catch {
    /* ignore */
  }

  return {
    todayDate: info.todayDate,
    availableDates: Array.from(availableDates).sort(),
  };
};

const generateExactTimeline = (
  offRangesStr: string[],
): { timeline: TimelineInterval[]; stats: ScheduleStats } => {
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
