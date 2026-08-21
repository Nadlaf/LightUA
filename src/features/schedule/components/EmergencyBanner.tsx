import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmergencyBanner = () => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="mb-[30px] flex items-center gap-3 rounded-xl border border-status-off-fg/25 bg-status-off-bg px-4 py-2.5 text-status-off-fg shadow-[0_2px_10px_rgb(239_68_68/0.05)] motion-safe:animate-slide-down motion-reduce:animate-fade-in min-[900px]:h-11 min-[900px]:py-0"
    >
      <TriangleAlert size={18} className="shrink-0" />
      <span className="text-[0.95rem] font-medium min-[900px]:truncate">
        {t('app.emergencyBanner')}
      </span>
    </div>
  );
};

export default EmergencyBanner;
