import { X } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { createContext, use, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Button from './Button';

interface ModalContextValue {
  onClose: () => void;
  titleId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const useModalContext = (): ModalContextValue => {
  const context = use(ModalContext);
  if (!context) throw new Error('Modal.Title / Modal.Body / Modal.Actions require a <Modal> parent');
  return context;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Built on the native <dialog>, which supplies Escape-to-close, focus trapping,
 * focus restoration and top-layer stacking that a div overlay cannot.
 */
const ModalRoot = ({ isOpen, onClose, children }: ModalProps) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The open *attribute* yields a non-modal dialog with no backdrop and no top
    // layer, so opening has to go through showModal().
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  /**
   * Escape and any other native dismissal close the element without going
   * through React. If that is not mirrored back into state, `isOpen` stays true
   * while the dialog is shut and it can never be reopened — clicking the trigger
   * sets the same value, so nothing re-renders.
   *
   * Handled through React's own `cancel`/`close` props rather than a manual
   * addEventListener so it uses the framework's event delegation. The guard stops
   * a feedback loop when the effect above closes the dialog itself.
   */
  const handleNativeDismiss = () => {
    if (isOpen) onClose();
  };

  // Unambiguous because the dialog carries no padding of its own — padding lives
  // on the inner wrapper, so a click landing on the dialog is a backdrop click.
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleNativeDismiss}
      onClose={handleNativeDismiss}
      aria-labelledby={titleId}
      className="m-auto w-[90%] max-w-[400px] animate-modal-in rounded-[20px] bg-card p-0 text-main shadow-card"
    >
      <ModalContext value={{ onClose, titleId }}>
        <div className="relative p-[30px]">
          <Button
            variant="icon"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="absolute right-[15px] top-[15px] text-muted hover:text-main"
          >
            <X size={20} />
          </Button>
          {children}
        </div>
      </ModalContext>
    </dialog>
  );
};

const ModalTitle = ({ children }: { children: ReactNode }) => {
  const { titleId } = useModalContext();
  return (
    <h3 id={titleId} className="mb-2.5 text-[1.25rem] font-bold">
      {children}
    </h3>
  );
};

const ModalBody = ({ children }: { children: ReactNode }) => (
  <div className="mb-5 leading-relaxed text-muted">{children}</div>
);

const ModalActions = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full justify-center gap-[15px]">{children}</div>
);

const Modal = Object.assign(ModalRoot, {
  Title: ModalTitle,
  Body: ModalBody,
  Actions: ModalActions,
});

export default Modal;
