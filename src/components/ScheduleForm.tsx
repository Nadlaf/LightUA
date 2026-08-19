import { Zap } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { getCities, getSchedule } from '../api/scheduleService';
import type { City, ScheduleRequest } from '../types';

interface ScheduleFormProps {
  onSearch: (request: ScheduleRequest) => void;
}

/** Everything loaded for one region, tagged so a stale response can be ignored. */
interface RegionData {
  region: string;
  todayDate: string;
  availableDates: Set<string>;
  queues: string[];
}

const DAYS_IN_WEEK = 7;
const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const toLocalIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Parses "YYYY-MM-DD" in local time. `new Date(iso)` would parse it as UTC. */
const parseIsoDateLocal = (iso: string): Date => {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Monday-first week containing the given date. Does not mutate any Date. */
const buildWeek = (isoDate: string): string[] => {
  const current = parseIsoDateLocal(isoDate);
  const weekDay = current.getDay();
  const mondayDate = current.getDate() - weekDay + (weekDay === 0 ? -(DAYS_IN_WEEK - 1) : 1);
  const monday = new Date(current.getFullYear(), current.getMonth(), mondayDate);

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) =>
    toLocalIsoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
  );
};

const errorMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error ? cause.message : fallback;

const byQueueNumber = (a: string, b: string): number => parseFloat(a) - parseFloat(b);

const ScheduleForm = ({ onSearch }: ScheduleFormProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [region, setRegion] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<RegionData | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setCities(await getCities());
        setLoadError('');
      } catch (cause) {
        setLoadError(errorMessage(cause, 'Не вдалося завантажити список областей.'));
      }
    };

    void loadCities();
  }, []);

  useEffect(() => {
    if (!region) return;

    let cancelled = false;
    const channelId = Number(region);

    const loadRegion = async () => {
      try {
        const [todayData, tomorrowData] = await Promise.all([
          getSchedule(channelId, 'today'),
          getSchedule(channelId, 'tomorrow'),
        ]);
        if (cancelled) return;

        if (!todayData) {
          setRegionData({ region, todayDate: '', availableDates: new Set(), queues: [] });
          setLoadError('Немає даних для обраної області.');
          return;
        }

        const availableDates = new Set([todayData.date]);
        if (tomorrowData) availableDates.add(tomorrowData.date);

        setLoadError('');
        setRegionData({
          region,
          todayDate: todayData.date,
          availableDates,
          queues: Object.keys(todayData.schedule).sort(byQueueNumber),
        });
      } catch (cause) {
        if (cancelled) return;
        setRegionData({ region, todayDate: '', availableDates: new Set(), queues: [] });
        setLoadError(errorMessage(cause, 'Не вдалося завантажити графік для області.'));
      }
    };

    void loadRegion();

    return () => {
      cancelled = true;
    };
  }, [region]);

  // Derived during render: data belonging to a previously selected region is
  // ignored rather than being cleared through an effect.
  const loaded = regionData?.region === region ? regionData : null;
  const availableQueues = loaded?.queues ?? [];
  const availableDates = loaded?.availableDates ?? new Set<string>();
  const weekDates = loaded?.todayDate ? buildWeek(loaded.todayDate) : [];

  // A date picked for one region is kept only while it still exists in the next.
  const selectedDate =
    pickedDate && availableDates.has(pickedDate) ? pickedDate : (loaded?.todayDate ?? null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!region) {
      setError('Оберіть область');
      return;
    }
    if (!group) {
      setError('Оберіть чергу');
      return;
    }
    if (!selectedDate) {
      setError('Дата не обрана');
      return;
    }
    setError('');
    onSearch({ region, group, date: selectedDate });
  };

  const handleRegionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value);
    setGroup('');
  };

  const handleGroupChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setGroup(e.target.value);
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <h2>Графік відключень світла</h2>
        <Zap size={24} fill="#f59e0b" color="#f59e0b" className="icon-zap" />
      </div>

      {loadError && <div className="load-error">{loadError}</div>}

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
              onChange={handleGroupChange}
              disabled={!region}
            >
              <option value="">{!region ? 'Спочатку оберіть область' : 'Оберіть чергу'}</option>
              {availableQueues.map((queue) => (
                <option key={queue} value={queue}>
                  Черга {queue}
                </option>
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
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`day-circle ${selectedDate === dateStr ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  onClick={() => setPickedDate(dateStr)}
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
        .form-card {
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

        .load-error {
          background: var(--status-red-bg);
          color: var(--status-red-text);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          line-height: 1.4;
        }

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
