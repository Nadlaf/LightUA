import { queryOptions, skipToken } from '@tanstack/react-query';

import type { ScheduleWhen } from './schedules';
import { getCities, getSchedule, whenToKey } from './schedules';

const MINUTE = 60 * 1000;
const SCHEDULE_STALE_TIME = 5 * MINUTE;

export const queryKeys = {
  cities: () => ['cities'] as const,
  schedule: (channelId: number | null, when: ScheduleWhen) =>
    ['schedule', channelId, whenToKey(when)] as const,
};

export const citiesQuery = () =>
  queryOptions({
    queryKey: queryKeys.cities(),
    queryFn: getCities,
    staleTime: Infinity,
  });

/**
 * One entry per (region, day). Because the request is never queue-filtered,
 * every consumer of the same day — the queue selector, the available-date
 * probe, the search itself — shares a single cache entry and a single request.
 */
export const scheduleQuery = (channelId: number | null, when: ScheduleWhen) =>
  queryOptions({
    queryKey: queryKeys.schedule(channelId, when),
    queryFn: channelId === null ? skipToken : () => getSchedule(channelId, when),
    staleTime: SCHEDULE_STALE_TIME,
  });
