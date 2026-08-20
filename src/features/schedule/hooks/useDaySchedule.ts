import { useQuery } from '@tanstack/react-query';

import { scheduleQuery } from '@/api/queries';
import type { ScheduleWhen } from '@/api/schedules';

import { buildTimeline } from '../lib/timeline';
import type { DaySchedule, ScheduleUnavailableReason } from '../types';

export interface ScheduleSearch {
  channelId: number;
  queue: string;
  date: string;
}

/**
 * Missing data is an expected outcome, not an exception, so it is modelled as a
 * value. Throwing inside a TanStack `select` is not a documented error path and
 * can surface during render instead of as `query.error`.
 */
export type ScheduleOutcome =
  | { status: 'ok'; schedule: DaySchedule }
  | { status: 'unavailable'; reason: ScheduleUnavailableReason };

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

export const useDaySchedule = (
  search: ScheduleSearch | null,
  todayDate: string | null,
  /**
   * Whether the region's today/tomorrow probes have settled. Until they have,
   * `todayDate` is still null and whenFor would fall through to the history
   * endpoint — firing a wasted 404 on every cold load from a shared link, and
   * briefly reporting "no data" before correcting itself.
   */
  isRegionReady: boolean,
): DayScheduleResult => {
  const when = search ? whenFor(search.date, todayDate) : 'today';
  const isEnabled = Boolean(search) && isRegionReady;

  const query = useQuery({
    ...scheduleQuery(search && isRegionReady ? search.channelId : null, when),
    select: (data): ScheduleOutcome => {
      if (!data) {
        return {
          status: 'unavailable',
          reason: { kind: 'noDataForDate', date: search?.date ?? '' },
        };
      }

      const offRanges = search ? data.schedule[search.queue] : undefined;
      if (!offRanges) {
        return {
          status: 'unavailable',
          reason: { kind: 'noDataForQueue', queue: search?.queue ?? '' },
        };
      }

      const { timeline, stats } = buildTimeline(offRanges);

      return {
        status: 'ok',
        schedule: {
          channelId: search?.channelId ?? 0,
          queue: search?.queue ?? '',
          date: data.date,
          timeline,
          stats,
          emergencyOutages: data.emergency_outages,
        },
      };
    },
  });

  return {
    outcome: isEnabled ? (query.data ?? null) : null,
    // Report loading while the region probes are still in flight, so the panel
    // shows a spinner rather than an empty or error state.
    isLoading: Boolean(search) && (!isRegionReady || query.isLoading),
    isError: query.isError,
  };
};
