import { Moon, Sun, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import InfoModals from '@/features/info/InfoModals';
import type { ActiveModal, ModalType, Theme } from '@/types/ui';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
}

type NavLabelKey = 'about' | 'contacts' | 'support';

const NAV_ITEMS: ReadonlyArray<{ modal: ModalType; labelKey: NavLabelKey }> = [
  { modal: 'github', labelKey: 'about' },
  { modal: 'contacts', labelKey: 'contacts' },
  { modal: 'support', labelKey: 'support' },
];

const Header = ({ theme, toggleTheme }: HeaderProps) => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = () => setActiveModal(null);
  const themeLabel = theme === 'light' ? t('theme.toDark') : t('theme.toLight');

  return (
    <>
      <header className="sticky top-0 z-100 bg-card py-[15px] shadow-[0_1px_3px_rgb(0_0_0/0.05)] transition-[background] duration-300">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-2 text-[1.25rem] font-bold text-main">
            <Zap size={24} className="-rotate-10 text-accent" fill="currentColor" />
            <span>{t('app.name')}</span>
          </div>

          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-5 md:flex">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.modal}
                  variant="ghost"
                  onClick={() => setActiveModal(item.modal)}
                  className="text-[0.95rem] text-main hover:text-primary"
                >
                  {t(`nav.${item.labelKey}`)}
                </Button>
              ))}
            </nav>

            <Button
              variant="icon"
              onClick={toggleTheme}
              title={themeLabel}
              aria-label={themeLabel}
              className="size-10 rounded-full border border-edge bg-element text-main transition-all hover:scale-105 hover:border-primary"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-accent" />}
            </Button>
          </div>
        </div>
      </header>

      <InfoModals activeModal={activeModal} onClose={closeModal} />
    </>
  );
};

export default Header;
