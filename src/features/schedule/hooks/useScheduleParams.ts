import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import { isIsoDate } from '@/lib/date';

export interface ScheduleParams {
  region: string;
  queue: string;
  date: string;
}

const PARAM_REGION = 'region';
const PARAM_QUEUE = 'queue';
const PARAM_DATE = 'date';

const isPositiveInteger = (value: string): boolean => /^\d+$/.test(value) && Number(value) > 0;

/** Queue numbers look like "1.1" or "2.10". */
const isQueueId = (value: string): boolean => /^\d+(\.\d+)?$/.test(value);

/**
 * The submitted search, mirrored in the query string so a schedule can be
 * linked to. Values arriving from a pasted URL are validated here; anything
 * malformed is dropped rather than sent to the API, which would 404 and surface
 * as an error on first load.
 */
export const useScheduleParams = (): {
  params: ScheduleParams | null;
  setParams: (next: ScheduleParams) => void;
} => {
  const [searchParams, setSearchParams] = useSearchParams();

  const region = searchParams.get(PARAM_REGION) ?? '';
  const queue = searchParams.get(PARAM_QUEUE) ?? '';
  const date = searchParams.get(PARAM_DATE) ?? '';

  const isComplete =
    isPositiveInteger(region) && isQueueId(queue) && date !== '' && isIsoDate(date);

  const setParams = useCallback(
    (next: ScheduleParams) => {
      setSearchParams(
        { [PARAM_REGION]: next.region, [PARAM_QUEUE]: next.queue, [PARAM_DATE]: next.date },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    params: isComplete ? { region, queue, date } : null,
    setParams,
  };
};
