import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { getCalendarInfo } from '../api/scheduleService';

// ... (Весь JS код залишається таким самим, як був) ...
// Я його скорочу, щоб показати головне - стилі. Скопіюй логіку з попереднього файлу.

const ScheduleForm = ({ onSearch }) => {
  // ... (тут твої хуки та логіка) ...
  const [region, setRegion] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [todayDate, setTodayDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [availableQueues, setAvailableQueues] = useState([]);

  useEffect(() => {
    const initCalendar = async () => {
      const info = await getCalendarInfo();
      if (info.todayDate) {
        setTodayDate(info.todayDate);
        setAvailableDates(new Set(info.availableDates));
        setSelectedDate(info.todayDate);
        const current = new Date(info.todayDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(current.setDate(diff));
        const week = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          week.push(d.toISOString().split('T')[0]);
        }
        setWeekDates(week);
      }
    };
    initCalendar();
  }, []);

  useEffect(() => {
    if (region === 'cherkasy') {
      fetch('/schedule_today.json').then(r=>r.json()).then(d=>{
        const k=Object.keys(d)[0]; const s=d[k]?.schedule;
        if(s) setAvailableQueues(Object.keys(s).sort());
      }).catch(e=>setAvailableQueues([]));
    } else { setAvailableQueues([]); }
  }, [region]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!region) return setError('Оберіть область');
    if (!group) return setError('Оберіть чергу');
    if (!selectedDate) return setError('Оберіть дату');
    setError('');
    onSearch({ region, group, date: selectedDate });
  };

  const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
      <div className="card form-card">
        <div className="card-header">
          <h2>Графік відключень світла</h2>
          <Zap size={24} fill="#f59e0b" color="#f59e0b" className="icon-zap" />
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Область</label>
            <div className="select-wrapper">
              <select className="form-control" value={region} onChange={(e) => {setRegion(e.target.value); setGroup('')}}>
                <option value="">Оберіть область</option>
                <option value="cherkasy">Черкаська область</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          <div className="form-group">
            <label>Черга</label>
            <div className={`select-wrapper ${!region ? 'disabled' : ''}`}>
              <select className="form-control" value={group} onChange={(e) => setGroup(e.target.value)} disabled={!region}>
                <option value="">{!region ? 'Спочатку оберіть область' : 'Оберіть чергу'}</option>
                {availableQueues.map(q => <option key={q} value={q}>Черга {q}</option>)}
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          <div className="form-group">
            <label>День</label>
            <div className="week-selector">
              {weekDates.map((dateStr, index) => {
                const isAvailable = availableDates.has(dateStr);
                const isSelected = selectedDate === dateStr;
                return (
                    <button
                        key={dateStr}
                        type="button"
                        className={`day-circle ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                        onClick={() => isAvailable && setSelectedDate(dateStr)}
                        disabled={!isAvailable}
                    >
                      {weekDayNames[index]}
                    </button>
                );
              })}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-submit">Показати графік</button>
        </form>

        <style>{`
        .card {
          background: var(--bg-card); /* ЗМІННА */
          color: var(--text-main);    /* ЗМІННА */
          border-radius: 24px; padding: 32px;
          box-shadow: var(--shadow);
          transition: background 0.3s;
        }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .card-header h2 { font-size: 1.25rem; font-weight: 700; }
        .icon-zap { transform: rotate(10deg); }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; }

        .form-control {
          width: 100%; padding: 14px 16px;
          border: 1px solid var(--border); /* ЗМІННА */
          border-radius: 12px; font-size: 1rem;
          color: var(--text-main);         /* ЗМІННА */
          background: var(--bg-card);      /* ЗМІННА */
          outline: none; appearance: none; cursor: pointer;
          transition: all 0.2s;
        }
        .form-control:focus { border-color: var(--primary); }
        .form-control:disabled { 
          background-color: var(--bg-element); /* ЗМІННА */
          color: var(--text-secondary); cursor: not-allowed; 
        }

        .select-wrapper { position: relative; }
        .select-arrow {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          font-size: 0.7rem; color: var(--text-secondary); pointer-events: none;
        }

        /* Календар */
        .week-selector { display: flex; justify-content: space-between; gap: 5px; }
        .day-circle {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: var(--bg-element); /* ЗМІННА */
          color: var(--text-secondary);  /* ЗМІННА */
          font-weight: 500; font-size: 0.9rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .day-circle:not(.disabled):hover {
          background: var(--bg-element-hover); color: var(--primary);
        }
        .day-circle.selected {
          background: var(--primary); color: white;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
        }
        .day-circle.disabled {
          background: var(--bg-element); opacity: 0.5; cursor: not-allowed;
        }

        .btn-submit {
          width: 100%; padding: 16px; background: var(--primary); color: white;
          border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600;
          cursor: pointer; margin-top: 10px; transition: background 0.2s;
        }
        .btn-submit:hover { background: var(--primary-hover); }
        .error-message { color: #ef4444; margin-bottom: 10px; text-align: center; }
      `}</style>
      </div>
  );
};

export default ScheduleForm;