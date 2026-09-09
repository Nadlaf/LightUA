import { useTranslation } from 'react-i18next';

import { DEGREES_PER_MINUTE, minutesToHours, timeToMinutes } from '@/lib/timeline';
import type { ScheduleStats, TimelineInterval } from '@/types/schedule';

interface ClockChartProps {
  timeline: TimelineInterval[];
  stats: ScheduleStats;
}

const HOUR_LABELS = [
  { hour: '00', position: 'top-0 left-1/2 -translate-x-1/2' },
  { hour: '06', position: 'right-0 top-1/2 -translate-y-1/2' },
  { hour: '12', position: 'bottom-0 left-1/2 -translate-x-1/2' },
  { hour: '18', position: 'left-0 top-1/2 -translate-y-1/2' },
] as const;

/**
 * A 24-hour clock face. Each timeline segment becomes a conic-gradient stop, so
 * the final segment must reach 360deg — which is why minutesToTime/timeToMinutes
 * round-trip "24:00" through 1440 rather than wrapping to 0.
 */
const toGradient = (timeline: TimelineInterval[]): string => {
  const stops = timeline.map((interval) => {
    const startDeg = timeToMinutes(interval.start) * DEGREES_PER_MINUTE;
    const endDeg = timeToMinutes(interval.end) * DEGREES_PER_MINUTE;
    const color = interval.type === 'off' ? 'var(--danger)' : 'var(--success)';
    return `${color} ${String(startDeg)}deg ${String(endDeg)}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

const ClockChart = ({ timeline, stats }: ClockChartProps) => {
  const { t } = useTranslation();
  const hours = minutesToHours(stats.totalOffMinutes);
  const label = `${String(stats.percentage)}% ${t('result.offLabel')}`;

  return (
    <div className="relative p-5">
      <div aria-hidden="true">
        {HOUR_LABELS.map((entry) => (
          <span
            key={entry.hour}
            className={`absolute text-[0.85rem] font-semibold text-muted ${entry.position}`}
          >
            {entry.hour}
          </span>
        ))}
      </div>

      <div
        role="img"
        aria-label={label}
        className="relative flex size-[200px] items-center justify-center rounded-full"
        style={{ background: toGradient(timeline) }}
      >
        <div className="absolute left-0 top-0 z-2 size-full rounded-full bg-[repeating-conic-gradient(transparent_0deg_14deg,var(--bg-card)_14deg_15deg)]" />
        <div className="z-3 flex size-[130px] flex-col items-center justify-center rounded-full bg-card leading-tight shadow-[0_0_20px_rgb(0_0_0/0.05)]">
          <span className="text-[2.2rem] font-bold text-main">{stats.percentage}%</span>
          <span className="mb-0.5 text-[0.9rem] text-muted">{t('result.offLabel')}</span>
          <span className="text-[1.2rem] font-semibold text-main">
            {t('result.offHours', { hours })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClockChart;
