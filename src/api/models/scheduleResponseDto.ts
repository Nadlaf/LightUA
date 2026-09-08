export interface ScheduleResponseDto {
  channel_id: number;
  city_name: string;
  date: string;
  time: string;
  /** Queue number -> list of "HH:MM-HH:MM" outage ranges. */
  schedule: Record<string, string[]>;
  emergency_outages: boolean;
}
