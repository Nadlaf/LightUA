/**
 * Server DTOs. These mirror the hosted API's wire format — snake_case included
 * — and are the source of truth for the shape of what comes over the network.
 */

export interface CityDto {
  id: number;
  name: string;
}

export interface CitiesResponseDto {
  cities: CityDto[];
}

export interface ScheduleResponseDto {
  channel_id: number;
  city_name: string;
  date: string;
  time: string;
  /** Queue number -> list of "HH:MM-HH:MM" outage ranges. */
  schedule: Record<string, string[]>;
  emergency_outages: boolean;
}

export interface StatusResponseDto {
  last_update: {
    timestamp: string | null;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
  };
  parsing_in_progress: boolean;
  auto_update_interval_minutes: number;
}

export interface ErrorResponseDto {
  error: string;
}
