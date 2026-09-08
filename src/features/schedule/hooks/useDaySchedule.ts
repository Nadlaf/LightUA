import { useQuery } from '@tanstack/react-query';

import { scheduleQuery } from '@/api/queries';
import type { ScheduleWhen } from '@/api/schedules';

import { toScheduleOutcome } from '../lib/outcome';
import type { ScheduleOutcome, ScheduleSearch } from '../types';
import { useRegionDays } from './useRegionDays';

export interface DayScheduleResult {
  outcome: ScheduleOutcome | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Picks the cheapest endpoint for a date. `todayDate` comes from the already
 * cached today request, so choosing between today/tomorrow/history is free.
 */
const whenFor = (date: string, todayDate: string | null): ScheduleWhen => {
  if (todayDate && date === todayDate) return 'today';
  if (todayDate && date > todayDate) return 'tomorrow';
  return { date };
};

export const useDaySchedule = (search: ScheduleSearch | null): DayScheduleResult => {
  const channelId = search ? search.channelId : null;
  const region = useRegionDays(channelId);
  // A skipped query reports `isLoading === false` — it is `isPending && isFetching`,
  // and `fetchStatus` is 'idle' — so "nothing to load" and "settled" are the same
  // value, which is what makes this read correct before a region is chosen.
  const isRegionReady = !region.isLoading;

  // Held back until the region probes settle: `todayDate` is null before then, so
  // `whenFor` would route to the history endpoint and fire a wasted 404.
  const activeChannelId = isRegionReady ? channelId : null;
  const when = search ? whenFor(search.date, region.todayDate) : 'today';
  const query = useQuery(scheduleQuery(activeChannelId, when));

  return {
    outcome:
      search && isRegionReady && query.isSuccess ? toScheduleOutcome(query.data, search) : null,
    isLoading: Boolean(search) && (!isRegionReady || query.isLoading),
    // A failed region probe only matters when it left `todayDate` null: `whenFor`
    // then falls through to the history endpoint, whose 404 would read as "no data
    // for that date" instead of a load failure. When today resolved and only the
    // tomorrow probe failed, the schedule is still correct and must still render.
    isError: query.isError || (region.isError && !region.todayDate),
  };
};
