import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import InfoModals from '@/components/info/InfoModals';
import Button from '@/components/ui/Button';
import type { ActiveModal, ModalType } from '@/types/ui';

type NavLabelKey = 'about' | 'contacts' | 'support';

const FOOTER_ITEMS: ReadonlyArray<{ modal: ModalType; labelKey: NavLabelKey }> = [
  { modal: 'github', labelKey: 'about' },
  { modal: 'contacts', labelKey: 'contacts' },
  { modal: 'support', labelKey: 'support' },
];

const Footer = () => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="mt-auto border-t border-edge bg-card py-10 transition-[background,border-color] duration-300">
        <div className="page-container">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-[30px]">
            {FOOTER_ITEMS.map((item) => (
              <Button
                key={item.modal}
                variant="ghost"
                onClick={() => setActiveModal(item.modal)}
                className="text-[0.9rem] text-muted hover:text-primary"
              >
                {t(`nav.${item.labelKey}`)}
              </Button>
            ))}
          </div>

          <p className="text-center text-[0.85rem] text-muted">{t('footer.copyright')}</p>
        </div>
      </footer>

      <InfoModals activeModal={activeModal} onClose={closeModal} />
    </>
  );
};

export default Footer;
