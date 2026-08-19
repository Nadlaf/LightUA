import { Moon, Sun, Zap } from 'lucide-react';
import { useState } from 'react';

import InfoModals from '../features/info/InfoModals';
import type { ActiveModal, ModalType, Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
}

const NAV_ITEMS: ReadonlyArray<{ modal: ModalType; label: string }> = [
  { modal: 'github', label: 'Про проєкт' },
  { modal: 'contacts', label: 'Контакти' },
  { modal: 'support', label: 'Підтримка' },
];

const Header = ({ theme, toggleTheme }: HeaderProps) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <Zap className="logo-icon" size={24} color="#f59e0b" fill="#f59e0b" />
            <span>СвітлоUA</span>
          </div>

          <div className="nav-wrapper">
            <nav className="nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.modal}
                  className="nav-link btn-link"
                  onClick={() => setActiveModal(item.modal)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} color="#f59e0b" />}
            </button>
          </div>
        </div>
      </header>

      <InfoModals activeModal={activeModal} onClose={closeModal} />

      <style>{`
        .header {
          background-color: var(--bg-card);
          padding: 15px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: background 0.3s;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-wrapper { display: flex; align-items: center; gap: 20px; }

        .logo {
          display: flex; align-items: center; gap: 8px;
          font-weight: 700; font-size: 1.25rem;
          color: var(--text-main);
        }
        .logo-icon { transform: rotate(-10deg); }

        .nav { display: flex; gap: 20px; align-items: center; }

        .nav-link {
          text-decoration: none;
          color: var(--text-main);
          font-size: 0.95rem; font-weight: 500;
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          font-family: inherit;
        }
        .nav-link:hover { color: var(--primary); }

        .theme-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--bg-element);
          color: var(--text-main);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .theme-btn:hover { border-color: var(--primary); transform: scale(1.05); }

        @media (max-width: 768px) { .nav { display: none; } }
      `}</style>
    </>
  );
};

export default Header;
