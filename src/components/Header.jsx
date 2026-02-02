// src/components/Header.jsx
import React from 'react';
import { Zap } from 'lucide-react'; // Імпортуємо іконку блискавки

const Header = () => {
  return (
    <header className="header">
      <div className="container header-content">
        {/* Логотип */}
        <div className="logo">
          <Zap className="logo-icon" size={24} color="#f59e0b" fill="#f59e0b" /> {/* Жовта блискавка */}
          <span>СвітлоUA</span>
        </div>

        {/* Навігація */}
        <nav className="nav">
          <a href="#">Про проєкт</a>
          <a href="#">Контакти</a>
          <a href="#">Підтримка</a>
        </nav>
      </div>

      {/* Стилі саме для хедера */}
      <style>{`
        .header {
          background-color: var(--bg-card);
          padding: 15px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-main);
        }
        
        /* Робимо блискавку трохи нахиленою як на дизайні */
        .logo-icon {
          transform: rotate(-10deg);
        }

        .nav {
          display: flex;
          gap: 30px;
        }

        .nav a {
          text-decoration: none;
          color: var(--text-main);
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav a:hover {
          color: var(--primary);
        }
      `}</style>
    </header>
  );
};

export default Header;