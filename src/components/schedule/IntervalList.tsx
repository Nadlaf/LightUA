import { useTranslation } from 'react-i18next';

import Card from '@/components/ui/Card';
import { formatDisplayDate } from '@/lib/date';
import type { TimelineInterval } from '@/types/schedule';

interface IntervalListProps {
  timeline: TimelineInterval[];
  date: string;
}

const IntervalList = ({ timeline, date }: IntervalListProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="mb-[25px] flex items-center justify-between">
        <h2 className="text-[1.5rem] font-semibold text-main">{t('result.listTitle')}</h2>
        <div className="rounded-full bg-primary px-4 py-1.5 text-[0.95rem] font-medium text-white">
          {formatDisplayDate(date)}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {timeline.map((interval, index) => {
          const isOff = interval.type === 'off';
          return (
            <li
              key={`${interval.start}-${interval.end}-${String(index)}`}
              className={`flex items-center justify-between rounded-xl px-5 py-4 text-[1.1rem] ${
                isOff
                  ? 'bg-status-off-bg text-status-off-fg'
                  : 'bg-status-on-bg text-status-on-fg'
              }`}
            >
              <span className="font-medium tracking-wide">
                {interval.start}-{interval.end}
              </span>
              <span className="font-semibold">
                {isOff ? t('result.rowOff') : t('result.rowOn')}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default IntervalList;
