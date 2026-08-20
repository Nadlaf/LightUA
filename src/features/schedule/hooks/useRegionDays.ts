import { useQueries } from '@tanstack/react-query';

import { scheduleQuery } from '@/api/queries';

export interface RegionDays {
  /** The server's notion of "today" for this region, if it has data. */
  todayDate: string | null;
  /** Dates the region has data for, sorted. */
  availableDates: string[];
  /** Queue numbers present today, sorted numerically. */
  queues: string[];
  isLoading: boolean;
  isError: boolean;
}

const byQueueNumber = (a: string, b: string): number => parseFloat(a) - parseFloat(b);

const EMPTY: string[] = [];

/**
 * Everything the form needs about a region, from exactly two requests.
 *
 * Previously this took three: one call fetched today for the calendar, another
 * fetched today again for the queue list, and a third fetched tomorrow. Both
 * days now share the (region, day) cache entry with every other consumer, so
 * the subsequent search issues no request at all.
 */
export const useRegionDays = (channelId: number | null): RegionDays => {
  const [today, tomorrow] = useQueries({
    queries: [scheduleQuery(channelId, 'today'), scheduleQuery(channelId, 'tomorrow')],
  });

  const todayData = today.data ?? null;
  const availableDates = [todayData?.date, tomorrow.data?.date].filter(
    (date): date is string => typeof date === 'string',
  );

  return {
    todayDate: todayData?.date ?? null,
    availableDates: [...new Set(availableDates)].sort(),
    queues: todayData ? Object.keys(todayData.schedule).sort(byQueueNumber) : EMPTY,
    isLoading: today.isLoading || tomorrow.isLoading,
    isError: today.isError || tomorrow.isError,
  };
};
