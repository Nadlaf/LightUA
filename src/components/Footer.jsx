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
          background: var(--bg-card); /* ЗМІНЕНО: тепер бере колір з теми */
          border-top: 1px solid var(--border); /* ЗМІНЕНО: тепер бере колір з теми */
          margin-top: auto; 
          transition: background 0.3s, border-color 0.3s;
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
          color: var(--text-secondary); /* ЗМІНЕНО */
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        .copyright {
          text-align: center;
          color: var(--text-secondary); /* ЗМІНЕНО */
          font-size: 0.85rem;
        }
      `}</style>
        </footer>
    );
};

export default Footer;