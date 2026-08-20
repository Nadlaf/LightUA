import { useTranslation } from 'react-i18next';

import ErrorState from '@/components/ui/ErrorState';
import Spinner from '@/components/ui/Spinner';

import EmergencyBanner from './components/EmergencyBanner';
import ScheduleForm from './components/ScheduleForm';
import ScheduleResult from './components/ScheduleResult';
import { useDaySchedule } from './hooks/useDaySchedule';
import { useRegionDays } from './hooks/useRegionDays';
import { useScheduleParams } from './hooks/useScheduleParams';
import type { ScheduleUnavailableReason } from './types';

const SchedulePage = () => {
  const { t } = useTranslation();
  const { params, setParams } = useScheduleParams();

  const channelId = params ? Number(params.region) : null;
  const regionDays = useRegionDays(channelId);

  const search = params
    ? { channelId: Number(params.region), queue: params.queue, date: params.date }
    : null;
  const { outcome, isLoading, isError } = useDaySchedule(
    search,
    regionDays.todayDate,
    !regionDays.isLoading,
  );

  const unavailableMessage = (reason: ScheduleUnavailableReason): string =>
    reason.kind === 'noDataForDate'
      ? t('errors.noDataForDate', { date: reason.date })
      : t('errors.noDataForQueue', { queue: reason.queue });

  const renderPanel = () => {
    if (isLoading) {
      return (
        <div className="flex size-full min-h-[600px] items-center justify-center rounded-3xl bg-card shadow-card transition-[background] duration-300">
          <Spinner />
        </div>
      );
    }

    if (isError) {
      return <ErrorState title={t('errors.title')} message={t('errors.schedule')} />;
    }

    if (outcome?.status === 'unavailable') {
      return <ErrorState title={t('errors.title')} message={unavailableMessage(outcome.reason)} />;
    }

    return <ScheduleResult schedule={outcome?.status === 'ok' ? outcome.schedule : null} />;
  };

  return (
    <main className="page-container w-full flex-1 pb-[60px] pt-10">
      {outcome?.status === 'ok' && outcome.schedule.emergencyOutages && <EmergencyBanner />}

      <div className="grid items-start gap-[30px] min-[900px]:grid-cols-[350px_minmax(0,1fr)] min-[1100px]:grid-cols-[400px_minmax(0,1fr)] min-[1100px]:gap-10">
        <div>
          <ScheduleForm params={params} onSubmit={setParams} />
        </div>

        <div className="relative w-full">{renderPanel()}</div>
      </div>
    </main>
  );
};

export default SchedulePage;
