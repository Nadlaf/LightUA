/** Domain models. Independent of the server's wire format. */

export type TimelineIntervalType = 'on' | 'off';

export interface TimelineInterval {
  start: string;
  end: string;
  type: TimelineIntervalType;
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

export interface ScheduleSearch {
  channelId: number;
  queue: string;
  date: string;
}

/**
 * Missing data is an expected outcome, not an exception, so it is modelled as a
 * value. `toScheduleOutcome` is total for the same reason: it runs during render,
 * so a throw would surface there instead of as `query.error`.
 */
export type ScheduleOutcome =
  | { status: 'ok'; schedule: DaySchedule }
  | { status: 'unavailable'; reason: ScheduleUnavailableReason };
