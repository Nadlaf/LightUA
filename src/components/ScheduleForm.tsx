import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Zap } from 'lucide-react';
import { getCalendarInfo } from '../api/scheduleService';
import type { CitiesResponse, City, ScheduleJsonRow, ScheduleRequest } from '../types';

interface ScheduleFormProps {
  onSearch: (request: ScheduleRequest) => void;
}

const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const ScheduleForm = ({ onSearch }: ScheduleFormProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [region, setRegion] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(() => new Set());

  const [availableQueues, setAvailableQueues] = useState<string[]>([]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        let response = await fetch('/backend/cities.json');
        if (!response.ok) response = await fetch('/cities.json');

        if (response.ok) {
          const data = (await response.json()) as CitiesResponse | City[];
          setCities(Array.isArray(data) ? data : data.cities ?? []);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };

    void loadCities();
  }, []);

  useEffect(() => {
    const updateCalendar = async () => {
      const info = await getCalendarInfo(region);

      if (info.todayDate) {
        setAvailableDates(new Set(info.availableDates));
        setSelectedDate((currentSelectedDate) => {
          if (currentSelectedDate && info.availableDates.includes(currentSelectedDate)) {
            return currentSelectedDate;
          }

          return info.todayDate;
        });

        const current = new Date(info.todayDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(current.setDate(diff));
        const week: string[] = [];

        for (let i = 0; i < 7; i += 1) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          week.push(d.toISOString().split('T')[0] ?? '');
        }

        setWeekDates(week);
      }
    };

    void updateCalendar();
  }, [region]);

  useEffect(() => {
    if (!region) {
      return;
    }

    const loadQueues = async () => {
      try {
        const res = await fetch('/schedule_today.json');
        const dataArray = (await res.json()) as ScheduleJsonRow[];

        if (!Array.isArray(dataArray)) {
          setAvailableQueues([]);
          return;
        }

        const regionData = dataArray.find((item) => item.channel_id === Number(region));
        if (regionData?.schedule) {
          const queues = Object.keys(regionData.schedule).sort((a, b) => parseFloat(a) - parseFloat(b));
          setAvailableQueues(queues);
        } else {
          setAvailableQueues([]);
        }
      } catch {
        setAvailableQueues([]);
      }
    };

    void loadQueues();
  }, [region]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!region) return setError('Оберіть область');
    if (!group) return setError('Оберіть чергу');
    if (!selectedDate) return setError('Дата не обрана');
    setError('');
    onSearch({ region, group, date: selectedDate });
  };

  const handleRegionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextRegion = e.target.value;
    setRegion(nextRegion);
    setGroup('');
    setAvailableQueues([]);
  };

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
            <select className="form-control" value={region} onChange={handleRegionChange}>
              <option value="">Оберіть область</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

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
              {availableQueues.map((q) => (
                <option key={q} value={q}>Черга {q}</option>
              ))}
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
                  onClick={() => {
                    if (isAvailable) setSelectedDate(dateStr);
                  }}
                  disabled={!isAvailable}
                  title={dateStr}
                >
                  {weekDayNames[index]}
                </button>
              );
            })}
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
          color: var(--text-main);
          border-radius: 24px;
          padding: 32px;
          box-shadow: var(--shadow);
          transition: background 0.3s, color 0.3s;
        }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .card-header h2 { font-size: 1.25rem; font-weight: 700; }
        .icon-zap { transform: rotate(10deg); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; }
        .form-control {
          width: 100%; padding: 14px 16px; border: 1px solid var(--border);
          border-radius: 12px; font-size: 1rem; color: var(--text-main);
          background: var(--bg-card); outline: none; appearance: none; cursor: pointer;
          transition: border-color 0.2s, background 0.3s;
        }
        .form-control:focus { border-color: var(--primary); }
        .form-control:disabled { background-color: var(--bg-element); color: var(--text-secondary); cursor: not-allowed; }
        .select-wrapper { position: relative; }
        .select-arrow { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: var(--text-secondary); pointer-events: none; }
        
        .week-selector { display: flex; justify-content: space-between; gap: 5px; }
        .day-circle {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: var(--bg-element); color: var(--text-secondary);
          font-weight: 500; font-size: 0.9rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .day-circle:not(.disabled):hover { background: var(--bg-element-hover); color: var(--primary); }
        .day-circle.selected { background: var(--primary); color: white; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4); }
        .day-circle.disabled { background: var(--bg-element); opacity: 0.5; cursor: not-allowed; }

        .btn-submit {
          width: 100%; padding: 16px; background: var(--primary); color: white;
          border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600;
          cursor: pointer; margin-top: 10px; transition: background 0.2s;
        }
        .btn-submit:hover { background: var(--primary-hover); }
        .error-message { color: #ef4444; font-size: 0.9rem; margin-bottom: 10px; text-align: center; }
      `}</style>
    </div>
  );
};

export default ScheduleForm;
