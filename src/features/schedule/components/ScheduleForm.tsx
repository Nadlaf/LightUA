import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { citiesQuery } from '@/api/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { SelectOption } from '@/components/ui/Select';
import Select from '@/components/ui/Select';
import { buildWeek } from '@/lib/date';

import { useRegionDays } from '../hooks/useRegionDays';
import type { ScheduleParams } from '../hooks/useScheduleParams';
import WeekPicker from './WeekPicker';

interface ScheduleFormProps {
  /** Current submitted search, used to seed the form from a shared link. */
  params: ScheduleParams | null;
  onSubmit: (params: ScheduleParams) => void;
}

const ScheduleForm = ({ params, onSubmit }: ScheduleFormProps) => {
  const { t } = useTranslation();

  // Draft selections. The submitted search lives in the URL; this is what the
  // user is currently choosing, which is why Show still gates the result.
  const [region, setRegion] = useState(params?.region ?? '');
  const [queue, setQueue] = useState(params?.queue ?? '');
  const [pickedDate, setPickedDate] = useState<string | null>(params?.date ?? null);
  const [error, setError] = useState('');

  const cities = useQuery(citiesQuery());
  const channelId = region === '' ? null : Number(region);
  const days = useRegionDays(channelId);

  const availableDates = new Set(days.availableDates);
  const weekDates = days.todayDate ? buildWeek(days.todayDate) : [];

  // Reconciled during render: a queue or date carried over from another region
  // is only honoured while it still exists in the current one.
  const effectiveQueue = days.queues.includes(queue) ? queue : '';
  const effectiveDate =
    pickedDate && availableDates.has(pickedDate) ? pickedDate : days.todayDate;

  const cityOptions: SelectOption[] = (cities.data ?? []).map((city) => ({
    value: String(city.id),
    label: city.name,
  }));

  const queueOptions: SelectOption[] = days.queues.map((value) => ({
    value,
    label: t('form.queueOption', { queue: value }),
  }));

  const loadError = cities.isError
    ? t('errors.cities')
    : days.isError
      ? t('errors.regionSchedule')
      : channelId !== null && !days.isLoading && !days.todayDate
        ? t('errors.regionNoData')
        : '';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (region === '') {
      setError(t('form.validation.region'));
      return;
    }
    if (effectiveQueue === '') {
      setError(t('form.validation.queue'));
      return;
    }
    if (!effectiveDate) {
      setError(t('form.validation.date'));
      return;
    }

    setError('');
    onSubmit({ region, queue: effectiveQueue, date: effectiveDate });
  };

  return (
    <Card className="p-8">
      <Card.Header>
        <Card.Title>{t('form.title')}</Card.Title>
        <Zap size={24} className="rotate-10 text-accent" fill="currentColor" />
      </Card.Header>

      {loadError !== '' && (
        <div className="mb-5 rounded-xl bg-status-off-bg px-4 py-3 text-[0.9rem] leading-snug text-status-off-fg">
          {loadError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Select
          label={t('form.regionLabel')}
          placeholder={t('form.regionPlaceholder')}
          options={cityOptions}
          value={region}
          onChange={(event) => {
            setRegion(event.target.value);
            setQueue('');
          }}
        />

        <Select
          label={t('form.queueLabel')}
          placeholder={
            region === '' ? t('form.queuePlaceholderNoRegion') : t('form.queuePlaceholder')
          }
          options={queueOptions}
          value={effectiveQueue}
          disabled={region === ''}
          onChange={(event) => setQueue(event.target.value)}
        />

        <WeekPicker
          dates={weekDates}
          availableDates={availableDates}
          selectedDate={effectiveDate}
          onSelect={setPickedDate}
        />

        {error !== '' && (
          <div className="mb-2.5 text-center text-[0.9rem] text-danger">{error}</div>
        )}

        <Button
          variant="primary"
          type="submit"
          className="mt-2.5 w-full rounded-xl py-4 text-[1.1rem]"
        >
          {t('form.submit')}
        </Button>
      </form>
    </Card>
  );
};

export default ScheduleForm;
