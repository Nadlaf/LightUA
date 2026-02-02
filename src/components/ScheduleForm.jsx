import React, { useState } from 'react';
import { Zap } from 'lucide-react';

// Приймаємо функцію onSearch, яку нам передасть App.jsx
const ScheduleForm = ({ onSearch }) => {
  const [activeDay, setActiveDay] = useState(0); // 0 - сьогодні, 1 - завтра
  const [region, setRegion] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проста валідація
    if (!region) {
      setError('Будь ласка, оберіть область');
      return;
    }
    if (!group) {
      setError('Вкажіть вашу чергу');
      return;
    }

    setError(''); // Очищаємо помилки
    
    // Відправляємо дані нагору в App.jsx
    onSearch({
      region,
      group,
      day: activeDay === 0 ? 'today' : 'tomorrow'
    });
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2>Графік відключень світла</h2>
        <Zap size={24} fill="#f59e0b" color="#f59e0b" className="icon-zap" />
      </div>

      <form className="form" onSubmit={handleSubmit}>
        {/* Область */}
        <div className="form-group">
          <label>Область</label>
          <div className="select-wrapper">
            <select 
              className="form-control"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Оберіть область</option>
              <option value="kyiv">Київська</option>
              <option value="lviv">Львівська</option>
              <option value="dnipro">Дніпропетровська</option>
              <option value="odesa">Одеська</option>
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

        {/* Черга */}
        <div className="form-group">
          <label>Черга</label>
          <input 
            type="number" 
            className="form-control" 
            placeholder="Наприклад: 4" 
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            min="1"
            max="6"
          />
        </div>

        {/* День (перемикач) */}
        <div className="form-group">
          <label>День</label>
          <div className="toggle-group">
            <button 
              type="button" 
              className={`toggle-btn ${activeDay === 0 ? 'active' : ''}`}
              onClick={() => setActiveDay(0)}
            >
              Сьогодні
            </button>
            <button 
              type="button" 
              className={`toggle-btn ${activeDay === 1 ? 'active' : ''}`}
              onClick={() => setActiveDay(1)}
            >
              Завтра
            </button>
          </div>
        </div>
        
        {/* Повідомлення про помилку */}
        {error && <div className="error-message">{error}</div>}

        {/* Кнопка type="submit" тепер справді відправляє форму */}
        <button type="submit" className="btn-submit">
          Показати графік
        </button>
      </form>

      <style>{`
        .card {
          background: var(--bg-card);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .icon-zap {
          transform: rotate(10deg);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 8px;
        }

        .form-control {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 1rem;
          color: var(--text-main);
          background: white;
          outline: none;
          appearance: none;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          border-color: var(--primary);
        }

        .select-wrapper {
          position: relative;
        }

        .select-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.7rem;
          color: var(--text-light);
          pointer-events: none;
        }

        .toggle-group {
          display: flex;
          background: #eef2ff;
          padding: 4px;
          border-radius: 12px;
        }

        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--text-light);
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.2s;
        }

        .btn-submit:hover {
          background: var(--primary-hover);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.9rem;
          margin-bottom: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ScheduleForm;