import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

//Підвантаження черги по запросу з форми
const ScheduleForm = ({ onSearch }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [region, setRegion] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  //Додаємо стан для зберігання динамічного списку черг
  const [availableQueues, setAvailableQueues] = useState([]);

  //Ефект для завантаження черг з файлу при виборі Черкаської області
  useEffect(() => {
    if (region === 'cherkasy') {
      fetch('/schedule_today.json')
          .then(res => res.json())
          .then(data => {
            // Беремо першу доступну дату
            const dateKey = Object.keys(data)[0];
            const schedule = data[dateKey]?.schedule;

            if (schedule) {
              //Отримуємо номери черги та сортуємо їх
              const queues = Object.keys(schedule).sort();
              setAvailableQueues(queues);
            }
          })
          .catch(err => {
            console.error("Не вдалося завантажити список черг:", err);
            setAvailableQueues([]);
          });
    } else {
      setAvailableQueues([]);
    }
  }, [region]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!region) {
      setError('Будь ласка, оберіть область');
      return;
    }
    if (!group) {
      setError('Будь ласка, оберіть вашу чергу');
      return;
    }

    setError('');

    onSearch({
      region,
      group,
      day: activeDay === 0 ? 'today' : 'tomorrow'
    });
  };

  //Якщо перевибрали область, то виводимо необхідну чергу
  const handleRegionChange = (e) => {
    setRegion(e.target.value);
    setGroup('');
  };

  return (
      <div className="card form-card">
        <div className="card-header">
          <h2>Графік відключень світла</h2>
          <Zap size={24} fill="#f59e0b" color="#f59e0b" className="icon-zap" />
        </div>

        <form className="form" onSubmit={handleSubmit}>

          {/*Селектор областей*/}
          <div className="form-group">
            <label>Область</label>
            <div className="select-wrapper">
              <select
                  className="form-control"
                  value={region}
                  onChange={handleRegionChange}
              >
                <option value="">Оберіть область</option>
                <option value="cherkasy">Черкаська область</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          {/*Список черг*/}
          <div className="form-group">
            <label>Черга</label>
            <div className={`select-wrapper ${!region ? 'disabled' : ''}`}>
              <select
                  className="form-control"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  disabled={!region}
              >
                <option value="">
                  {!region ? 'Спочатку оберіть область' : 'Оберіть чергу'}
                </option>

                {/*Recheck чи є необхідна черга в файлі*/}
                {availableQueues.map((q) => (
                    <option key={q} value={q}>
                      Черга {q}
                    </option>
                ))}
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          {/*Сьогодні/Завтра селектор*/}
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

          {error && <div className="error-message">{error}</div>}

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
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          border-color: var(--primary);
        }

        /* Стиль для заблокованого селекта */
        .form-control:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .select-wrapper {
          position: relative;
        }
        
        .select-wrapper.disabled .select-arrow {
          opacity: 0.5;
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