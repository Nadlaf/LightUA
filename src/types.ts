export type Theme = 'light' | 'dark';

export type ModalType = 'github' | 'contacts' | 'support';

export type ActiveModal = ModalType | null;

export interface City {
  id: number;
  name: string;
}

export interface CitiesResponse {
  cities?: City[];
}

export interface ScheduleRequest {
  region: string;
  group: string;
  date: string;
}

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

export interface ScheduleResultData {
  region: number;
  group: string;
  day: string;
  timeline: TimelineInterval[];
  stats: ScheduleStats;
  emergencyOutages: boolean;
}

export interface CalendarInfo {
  todayDate: string | null;
  availableDates: string[];
}

export interface ScheduleJsonRow {
  channel_id: number;
  schedule_date?: string;
  schedule_time?: string;
  schedule?: Record<string, string[]>;
  emergency_outages?: boolean;
}

export type ScheduleJsonPayload = ScheduleJsonRow[] | Record<string, ScheduleJsonRow>;
