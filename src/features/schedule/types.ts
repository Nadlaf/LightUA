/** Domain models. Independent of the server's wire format. */

export type TimelineIntervalType = 'on' | 'off';

export interface TimelineInterval {
  start: string;
  end: string;
  type: TimelineIntervalType;
}

/** Internal to timeline construction: an interval in minutes from midnight. */
export interface MinuteInterval {
  start: number;
  end: number;
}

export interface ScheduleStats {
  totalOffMinutes: number;
  percentage: number;
}

export interface DaySchedule {
  channelId: number;
  queue: string;
  date: string;
  timeline: TimelineInterval[];
  stats: ScheduleStats;
  emergencyOutages: boolean;
}

/** Which of the two charts the result panel is showing. */
export type ChartView = 'donut' | 'clock';

/** Why a requested schedule could not be produced, as a translatable reason. */
export type ScheduleUnavailableReason =
  | { kind: 'noDataForDate'; date: string }
  | { kind: 'noDataForQueue'; queue: string };

export class ScheduleUnavailableError extends Error {
  readonly reason: ScheduleUnavailableReason;

  constructor(reason: ScheduleUnavailableReason) {
    super(reason.kind);
    this.name = 'ScheduleUnavailableError';
    this.reason = reason;
  }
}
