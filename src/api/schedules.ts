import { apiFetch, apiFetchOrNull } from './http';
import type { CitiesResponseDto, CityDto, ScheduleResponseDto, StatusResponseDto } from './types';

/** Which day to ask for. A concrete date routes to the history endpoint. */
export type ScheduleWhen = 'today' | 'tomorrow' | { date: string };

/** Stable string form of a ScheduleWhen, for use inside a query key. */
export const whenToKey = (when: ScheduleWhen): string =>
  typeof when === 'string' ? when : when.date;

const schedulePath = (channelId: number, when: ScheduleWhen): string => {
  const params = new URLSearchParams({ channel_id: String(channelId) });

  if (when === 'today') return `/api/schedules/today?${params.toString()}`;
  if (when === 'tomorrow') return `/api/schedules/tomorrow?${params.toString()}`;

  params.set('date', when.date);
  return `/api/schedules?${params.toString()}`;
};

export const getCities = async (): Promise<CityDto[]> => {
  const data = await apiFetch<CitiesResponseDto>('/api/cities');
  return data.cities;
};

/**
 * Fetches a whole day for one region.
 *
 * Deliberately never filters by queue: the caller needs every queue to populate
 * its selector, and the server answers 404 for an unknown queue rather than
 * returning an empty result. Keeping the request unfiltered is also what makes
 * (channelId, when) a complete cache key — adding a queue argument without
 * putting it in the key would collide two queues onto one cache entry.
 */
export const getSchedule = (
  channelId: number,
  when: ScheduleWhen,
): Promise<ScheduleResponseDto | null> =>
  apiFetchOrNull<ScheduleResponseDto>(schedulePath(channelId, when));

export const getStatus = (): Promise<StatusResponseDto> =>
  apiFetch<StatusResponseDto>('/api/status');
