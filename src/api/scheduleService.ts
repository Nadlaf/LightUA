import type {
  City,
  ScheduleRequest,
  ScheduleResponse,
  ScheduleResultData,
  ScheduleStats,
  StatusResponse,
  TimelineInterval,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

interface MinuteInterval {
  start: number;
  end: number;
}

const HTTP_NOT_FOUND = 404;

/** Pulls the server's Ukrainian error message when present, else a status label. */
const readErrorMessage = async (res: Response): Promise<string> => {
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // body was not JSON - fall through to the status label
  }
  return `HTTP ${res.status}`;
};

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<T>;
}

/** Same as apiFetch, but treats 404 as "no data" rather than an error. */
async function apiFetchOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === HTTP_NOT_FOUND) return null;
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<T>;
}

export async function getCities(): Promise<City[]> {
  const data = await apiFetch<{ cities: City[] }>('/api/cities');
  return data.cities;
}

/** Which day to ask for. A concrete date goes to the history endpoint. */
export type ScheduleWhen = 'today' | 'tomorrow' | { date: string };

const schedulePath = (channelId: number, when: ScheduleWhen): string => {
  const params = new URLSearchParams({ channel_id: String(channelId) });

  if (when === 'today') return `/api/schedules/today?${params.toString()}`;
  if (when === 'tomorrow') return `/api/schedules/tomorrow?${params.toString()}`;

  params.set('date', when.date);
  return `/api/schedules?${params.toString()}`;
};

/**
 * Fetches a whole day for one region. Deliberately never filters by queue: the
 * caller needs every queue to populate its selector, and the server 404s on an
 * unknown queue rather than returning an empty result.
 */
export const getSchedule = (
  channelId: number,
  when: ScheduleWhen,
): Promise<ScheduleResponse | null> => apiFetchOrNull<ScheduleResponse>(schedulePath(channelId, when));

export async function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>('/api/status');
}

export const fetchSchedule = async (requestData: ScheduleRequest): Promise<ScheduleResultData> => {
  const channelId = Number(requestData.region);
  const requestedGroup = requestData.group;
  const targetDate = requestData.date;

  const todayResponse = await getSchedule(channelId, 'today');
  const todayDate = todayResponse?.date ?? null;

  let apiResponse: ScheduleResponse | null;
  if (todayDate && targetDate === todayDate) {
    apiResponse = todayResponse;
  } else if (todayDate && targetDate > todayDate) {
    apiResponse = await getSchedule(channelId, 'tomorrow');
  } else {
    apiResponse = await getSchedule(channelId, { date: targetDate });
  }

  if (!apiResponse) {
    throw new Error(`Дані за ${targetDate} відсутні.`);
  }

  const offRanges = apiResponse.schedule[requestedGroup];
  if (!offRanges) {
    throw new Error(`Дані для черги ${requestedGroup} відсутні.`);
  }

  const { timeline, stats } = generateExactTimeline(offRanges);

  return {
    region: channelId,
    group: requestedGroup,
    day: apiResponse.date,
    timeline,
    stats,
    emergencyOutages: apiResponse.emergency_outages,
  };
};

const MINUTES_PER_DAY = 1440;
const PERCENT_SCALE = 100;

/**
 * Expands one "HH:MM-HH:MM" range into same-day intervals. A range whose end is
 * earlier than its start crosses midnight and becomes two pieces: the tail of
 * this day and the head of it. Equal start/end is treated as malformed and
 * dropped, matching the previous behaviour.
 */
const toDayIntervals = (range: string): MinuteInterval[] => {
  const [startStr, endStr] = range.split('-');
  const start = timeToMinutes(startStr ?? '00:00');
  const end = timeToMinutes(endStr ?? '00:00');

  if (end > start) return [{ start, end }];
  if (end === start) return [];

  const wrapped: MinuteInterval[] = [{ start, end: MINUTES_PER_DAY }];
  if (end > 0) wrapped.push({ start: 0, end });
  return wrapped;
};

/** Collapses sorted, possibly overlapping intervals so no minute is counted twice. */
const mergeIntervals = (intervals: MinuteInterval[]): MinuteInterval[] => {
  const merged: MinuteInterval[] = [];

  [...intervals]
    .sort((a, b) => a.start - b.start)
    .forEach((interval) => {
      const last = merged.at(-1);
      if (last && interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
        return;
      }
      merged.push({ ...interval });
    });

  return merged;
};

const generateExactTimeline = (
  offRangesStr: string[],
): { timeline: TimelineInterval[]; stats: ScheduleStats } => {
  const offIntervals = mergeIntervals(
    offRangesStr.flatMap(toDayIntervals).filter((interval) => interval.end > interval.start),
  );

  const timeline: TimelineInterval[] = [];
  let currentCursor = 0;
  let totalOffMinutes = 0;

  offIntervals.forEach((off) => {
    if (off.start > currentCursor) {
      timeline.push({
        start: minutesToTime(currentCursor),
        end: minutesToTime(off.start),
        type: 'on',
      });
    }

    timeline.push({ start: minutesToTime(off.start), end: minutesToTime(off.end), type: 'off' });
    totalOffMinutes += off.end - off.start;
    currentCursor = off.end;
  });

  if (currentCursor < MINUTES_PER_DAY) {
    timeline.push({ start: minutesToTime(currentCursor), end: '24:00', type: 'on' });
  }

  return {
    timeline,
    stats: {
      totalOffMinutes,
      percentage: Math.round((totalOffMinutes / MINUTES_PER_DAY) * PERCENT_SCALE),
    },
  };
};

const timeToMinutes = (timeStr: string): number => {
  if (timeStr === '24:00') return MINUTES_PER_DAY;
  const [h = 0, m = 0] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  if (minutes === MINUTES_PER_DAY) return '24:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
