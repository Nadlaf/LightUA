import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorState from '@/components/ui/ErrorState';
import Panel from '@/components/ui/Panel';
import Spinner from '@/components/ui/Spinner';

import EmergencyBanner from './components/EmergencyBanner';
import ScheduleForm from './components/ScheduleForm';
import ScheduleResult from './components/ScheduleResult';
import { useDaySchedule } from './hooks/useDaySchedule';
import { useScheduleParams } from './hooks/useScheduleParams';
import type { ChartView, ScheduleUnavailableReason } from './types';

const SchedulePage = () => {
  const { t } = useTranslation();
  const { params, setParams } = useScheduleParams();

  const search = params
    ? { channelId: Number(params.region), queue: params.queue, date: params.date }
    : null;
  const { outcome, isLoading, isError } = useDaySchedule(search);

  // Owned here, not in ScheduleResult: renderPanel returns a different element type
  // while loading, so the panel unmounts and any state inside it is discarded.
  const [view, setView] = useState<ChartView>('donut');
  const handleToggleView = () => {
    setView((current) => (current === 'clock' ? 'donut' : 'clock'));
  };

  const unavailableMessage = (reason: ScheduleUnavailableReason): string =>
    reason.kind === 'noDataForDate'
      ? t('errors.noDataForDate', { date: reason.date })
      : t('errors.noDataForQueue', { queue: reason.queue });

  const renderPanel = () => {
    if (isLoading) {
      return (
        <Panel>
          <Spinner />
        </Panel>
      );
    }

    if (isError) {
      return <ErrorState title={t('errors.title')} message={t('errors.schedule')} />;
    }

    if (outcome?.status === 'unavailable') {
      return <ErrorState title={t('errors.title')} message={unavailableMessage(outcome.reason)} />;
    }

    return (
      <ScheduleResult
        schedule={outcome?.status === 'ok' ? outcome.schedule : null}
        view={view}
        onToggleView={handleToggleView}
      />
    );
  };

  return (
    <main className="page-container w-full flex-1 pb-[60px] pt-10">
      {outcome?.status === 'ok' && outcome.schedule.emergencyOutages && <EmergencyBanner />}

      <div className="grid items-start gap-[30px] md:grid-cols-[350px_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-10">
        <div>
          <ScheduleForm params={params} onSubmit={setParams} />
        </div>

        <div className="relative w-full">{renderPanel()}</div>
      </div>
    </main>
  );
};

export default SchedulePage;
