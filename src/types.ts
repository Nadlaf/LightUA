export type Theme = 'light' | 'dark';

export type ModalType = 'github' | 'contacts' | 'support';

export type ActiveModal = ModalType | null;

export interface City {
  id: number;
  name: string;
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

export interface ScheduleResponse {
  channel_id: number;
  city_name: string;
  date: string;
  time: string;
  schedule: Record<string, string[]>;
  emergency_outages: boolean;
}

export interface StatusResponse {
  last_update: {
    timestamp: string | null;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
  };
  parsing_in_progress: boolean;
  auto_update_interval_minutes: number;
}
