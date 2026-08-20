import { AlertCircle, ExternalLink, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import GithubIcon from '@/components/ui/GithubIcon';
import Modal from '@/components/ui/Modal';
import type { ActiveModal } from '@/types/ui';

const REPO_URL = 'https://github.com/Nadlaf/LightUA';
const CONTACTS = [
  { handle: '@faldanchik', url: 'https://t.me/faldanchik' },
  { handle: '@NeToR_1', url: 'https://t.me/NeToR_1' },
] as const;

const ICON_WRAPPER =
  'mb-[15px] flex size-[60px] items-center justify-center rounded-full bg-element';
const CENTERED = 'flex flex-col items-center text-center';
const LINK_AS_PRIMARY_BUTTON =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-primary px-6 py-2.5 font-semibold text-white no-underline transition-colors hover:bg-primary-hover';

interface InfoModalsProps {
  activeModal: ActiveModal;
  onClose: () => void;
}

/**
 * The three shared informational modals. Rendered by both Header and Footer,
 * which each own their own open/closed state.
 */
const InfoModals = ({ activeModal, onClose }: InfoModalsProps) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={activeModal !== null} onClose={onClose}>
      {activeModal === 'github' && (
        <div className={CENTERED}>
          <div className={ICON_WRAPPER}>
            <GithubIcon size={40} color="currentColor" className="text-primary" />
          </div>
          <Modal.Title>{t('modal.about.title')}</Modal.Title>
          <Modal.Body>{t('modal.about.description')}</Modal.Body>
          <Modal.Actions>
            <Button variant="secondary" onClick={onClose}>
              {t('modal.about.cancel')}
            </Button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={LINK_AS_PRIMARY_BUTTON}
            >
              {t('modal.about.confirm')} <ExternalLink size={16} />
            </a>
          </Modal.Actions>
        </div>
      )}

      {activeModal === 'contacts' && (
        <div>
          <Modal.Title>{t('modal.contacts.title')}</Modal.Title>
          <Modal.Body>{t('modal.contacts.description')}</Modal.Body>
          <div className="flex flex-col gap-2.5">
            {CONTACTS.map((contact) => (
              <a
                key={contact.handle}
                href={contact.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl bg-element p-3 font-medium text-main no-underline transition-colors hover:bg-element-hover hover:text-primary"
              >
                <Send size={18} /> {contact.handle}
              </a>
            ))}
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div className={CENTERED}>
          <div className={ICON_WRAPPER}>
            <AlertCircle size={40} className="text-primary" />
          </div>
          <Modal.Title>{t('modal.support.title')}</Modal.Title>
          <Button variant="primary" onClick={onClose}>
            {t('modal.support.acknowledge')}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default InfoModals;
