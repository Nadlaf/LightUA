import { useTranslation } from 'react-i18next';

import { parseIsoDateLocal } from '@/lib/date';

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface WeekPickerProps {
  /** Seven ISO dates, Monday first. */
  dates: readonly string[];
  availableDates: ReadonlySet<string>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const WeekPicker = ({ dates, availableDates, selectedDate, onSelect }: WeekPickerProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-5">
      <span className="mb-2 block text-[0.85rem] text-muted">{t('form.dayLabel')}</span>

      <div role="group" aria-label={t('form.dayLabel')} className="flex justify-between gap-[5px]">
        {dates.map((date, index) => {
          const key = WEEK_DAY_KEYS[index] ?? 'mon';
          const isAvailable = availableDates.has(date);
          const isSelected = selectedDate === date;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              // Screen readers get the full date; the visible glyph is the short day name.
              aria-label={parseIsoDateLocal(date).toLocaleDateString('uk-UA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              className={`flex size-[42px] cursor-pointer items-center justify-center rounded-full border-none text-[0.9rem] font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-[0_4px_10px_rgb(59_130_246/0.4)]'
                  : 'bg-element text-muted'
              } ${
                isAvailable
                  ? 'hover:bg-element-hover hover:text-primary'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              {t(`form.weekDays.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekPicker;
