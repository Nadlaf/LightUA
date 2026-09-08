import { Clock, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

import type { ChartView, DaySchedule } from '../types';
import ClockChart from './ClockChart';
import DonutChart from './DonutChart';
import IntervalList from './IntervalList';

interface ScheduleResultProps {
  schedule: DaySchedule | null;
  view: ChartView;
  onToggleView: () => void;
}

const Legend = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 text-[1.05rem] font-medium text-main">
        <span className="size-4 rounded-full bg-success" />
        <span>{t('result.legendOn')}</span>
      </div>
      <div className="flex items-center gap-2.5 text-[1.05rem] font-medium text-main">
        <span className="size-4 rounded-full bg-danger" />
        <span>{t('result.legendOff')}</span>
      </div>
    </div>
  );
};

const ScheduleResult = ({ schedule, view, onToggleView }: ScheduleResultProps) => {
  const { t } = useTranslation();

  if (!schedule) {
    return <EmptyState title={t('result.emptyTitle')} message={t('result.emptyDescription')} />;
  }

  const isClock = view === 'clock';
  const toggleLabel = isClock ? t('result.showDonut') : t('result.showClock');

  return (
    <div className="flex flex-col gap-5">
      <Card className="relative">
        <Button
          variant="icon"
          onClick={onToggleView}
          title={toggleLabel}
          aria-label={toggleLabel}
          className="absolute right-5 top-5 z-10 size-10 rounded-xl border border-edge bg-element text-muted transition-all hover:border-primary hover:text-primary"
        >
          {isClock ? <PieChart size={20} /> : <Clock size={20} />}
        </Button>

        <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-[60px]">
          {isClock ? (
            <ClockChart timeline={schedule.timeline} stats={schedule.stats} />
          ) : (
            <DonutChart stats={schedule.stats} />
          )}
          <Legend />
        </div>
      </Card>

      <IntervalList timeline={schedule.timeline} date={schedule.date} />
    </div>
  );
};

export default ScheduleResult;
