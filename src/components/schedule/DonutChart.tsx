import { useTranslation } from 'react-i18next';

import { minutesToHours } from '@/lib/timeline';
import type { ScheduleStats } from '@/types/schedule';

interface DonutChartProps {
  stats: ScheduleStats;
}

const DonutChart = ({ stats }: DonutChartProps) => {
  const { t } = useTranslation();
  const hours = minutesToHours(stats.totalOffMinutes);
  const label = `${String(stats.percentage)}% ${t('result.offLabel')}`;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative flex size-[200px] items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--danger) 0% ${String(stats.percentage)}%, var(--success) ${String(stats.percentage)}% 100%)`,
      }}
    >
      <div className="z-3 flex size-[130px] flex-col items-center justify-center rounded-full bg-card leading-tight shadow-[0_0_20px_rgb(0_0_0/0.05)]">
        <span className="text-[2.2rem] font-bold text-main">{stats.percentage}%</span>
        <span className="mb-0.5 text-[0.9rem] text-muted">{t('result.offLabel')}</span>
        <span className="text-[1.2rem] font-semibold text-main">
          {t('result.offHours', { hours })}
        </span>
      </div>
    </div>
  );
};

export default DonutChart;
