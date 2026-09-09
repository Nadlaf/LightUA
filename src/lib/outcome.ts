import type { ScheduleResponseDto } from '@/api/models';
import type { ScheduleOutcome, ScheduleSearch } from '@/types/schedule';

import { buildTimeline } from './timeline';

export const toScheduleOutcome = (
  dto: ScheduleResponseDto | null,
  search: ScheduleSearch,
): ScheduleOutcome => {
  // `whenFor` sends any future date to the tomorrow endpoint, since ISO dates
  // compare lexicographically — so `?date=2026-12-31` fetches tomorrow. Trust
  // the date the server served, not the endpoint that was chosen for it.
  if (!dto || dto.date !== search.date) {
    return { status: 'unavailable', reason: { kind: 'noDataForDate', date: search.date } };
  }

  const offRanges = dto.schedule[search.queue];
  if (!offRanges) {
    return { status: 'unavailable', reason: { kind: 'noDataForQueue', queue: search.queue } };
  }

  const { timeline, stats } = buildTimeline(offRanges);

  return {
    status: 'ok',
    schedule: {
      channelId: search.channelId,
      queue: search.queue,
      date: dto.date,
      timeline,
      stats,
      emergencyOutages: dto.emergency_outages,
    },
  };
};
