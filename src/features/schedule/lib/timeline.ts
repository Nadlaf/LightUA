import type { MinuteInterval, ScheduleStats, TimelineInterval } from '../types';

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HOUR = 60;
const PERCENT_SCALE = 100;

export const timeToMinutes = (timeStr: string): number => {
  if (timeStr === '24:00') return MINUTES_PER_DAY;
  const [hours = 0, minutes = 0] = timeStr.trim().split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
};

export const minutesToTime = (minutes: number): string => {
  if (minutes === MINUTES_PER_DAY) return '24:00';
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return `${hours.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
};

/**
 * Expands one "HH:MM-HH:MM" range into same-day intervals.
 *
 * A range whose end is earlier than its start crosses midnight and becomes two
 * pieces: the tail of this day and the head of it. Before this, such a range was
 * discarded entirely, hiding a real outage — "22:00-01:00" parsed to
 * start=1320/end=60, the end===0 special case never fired, and the
 * `end > start` guard threw the interval away.
 *
 * Equal start and end is treated as malformed and dropped, matching the
 * previous behaviour rather than reading it as a 24-hour outage.
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

/** Collapses overlapping intervals so no minute is counted twice. */
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

export interface Timeline {
  timeline: TimelineInterval[];
  stats: ScheduleStats;
}

/** Turns the server's outage ranges into a gap-free 00:00-24:00 timeline. */
export const buildTimeline = (offRanges: string[]): Timeline => {
  const offIntervals = mergeIntervals(
    offRanges.flatMap(toDayIntervals).filter((interval) => interval.end > interval.start),
  );

  const timeline: TimelineInterval[] = [];
  let cursor = 0;
  let totalOffMinutes = 0;

  offIntervals.forEach((off) => {
    if (off.start > cursor) {
      timeline.push({ start: minutesToTime(cursor), end: minutesToTime(off.start), type: 'on' });
    }

    timeline.push({ start: minutesToTime(off.start), end: minutesToTime(off.end), type: 'off' });
    totalOffMinutes += off.end - off.start;
    cursor = off.end;
  });

  if (cursor < MINUTES_PER_DAY) {
    timeline.push({ start: minutesToTime(cursor), end: '24:00', type: 'on' });
  }

  return {
    timeline,
    stats: {
      totalOffMinutes,
      percentage: Math.round((totalOffMinutes / MINUTES_PER_DAY) * PERCENT_SCALE),
    },
  };
};

/** Degrees per minute on a 24-hour clock face, for the conic-gradient charts. */
export const DEGREES_PER_MINUTE = 360 / MINUTES_PER_DAY;

export const minutesToHours = (minutes: number): number => Math.round(minutes / MINUTES_PER_HOUR);
