import { useState } from 'react';

import InfoModals from '../features/info/InfoModals';
import type { ActiveModal, ModalType } from '../types';

const FOOTER_ITEMS: ReadonlyArray<{ modal: ModalType; label: string }> = [
  { modal: 'github', label: 'Про проєкт' },
  { modal: 'contacts', label: 'Контакти' },
  { modal: 'support', label: 'Підтримка' },
];

const Footer = () => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            {FOOTER_ITEMS.map((item) => (
              <button
                key={item.modal}
                className="footer-btn"
                onClick={() => setActiveModal(item.modal)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="copyright">
            &copy; 2026 Графік відключень світла. Всі права захищені.
          </p>
        </div>
      </footer>

      <InfoModals activeModal={activeModal} onClose={closeModal} />

      <style>{`
        .footer {
          padding: 40px 0;
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          margin-top: auto;
          transition: background 0.3s, border-color 0.3s;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .footer-btn {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
        }

        .footer-btn:hover {
          color: var(--primary);
        }

        .copyright {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
      `}</style>
    </>
  );
};

export default Footer;
