import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <a href="#">Про проєкт</a>
          <a href="#">Контакти</a>
          <a href="#">Політика конфіденційності</a>
        </div>
        <p className="copyright">
          &copy; 2026 Графік відключень світла. Всі права захищені.
        </p>
      </div>

      <style>{`
        .footer {
          padding: 40px 0;
          background: white; /* Або прозорий, як на макеті */
          border-top: 1px solid var(--border);
          margin-top: auto; /* Притискаємо до низу, якщо контенту мало */
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .footer-links a {
          text-decoration: none;
          color: var(--text-light);
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        .copyright {
          text-align: center;
          color: #9ca3af; /* Світліший сірий */
          font-size: 0.85rem;
        }
      `}</style>
    </footer>
  );
};

export default Footer;