import React from 'react';
import { Search } from 'lucide-react';

//Графік не знайдено
const ScheduleResult = ({ scheduleData }) => {
  if (!scheduleData) {
    return (
        <div className="empty-card">
          <div className="empty-content">
            <Search className="icon-search" />
            <h3>Графік не обрано</h3>
            <p>Будь ласка, вкажіть вашу адресу в панелі зліва, щоб побачити розклад відключень.</p>
          </div>
          <StyleBlock />
        </div>
    );
  }

  const { timeline, stats, day } = scheduleData;
  const offPercentage = stats.percentage;
  const offHoursText = Math.round(stats.totalOffMinutes / 60);

  //Перетворення дати з YYYY.MM.DD на DD.MM.YYYY
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate; //Якщо вдруг, то повертаємо старий формат
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  return (
      <div className="results-wrapper">

        {/* Картка 1: Діаграма */}
        <div className="card chart-card">
          <div className="chart-container">
            <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(
                #ef4444 0% ${offPercentage}%, 
                #22c55e ${offPercentage}% 100%
              )`
                }}
            >
              <div className="donut-hole">
                <span className="percent-text">{offPercentage}%</span>
                <span className="label-text">Без світла</span>
                <span className="hours-text">~{offHoursText} год</span>
              </div>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <span className="dot dot-green"></span>
                <span>Є світло</span>
              </div>
              <div className="legend-item">
                <span className="dot dot-red"></span>
                <span>Немає світла</span>
              </div>
            </div>
          </div>
        </div>

        {/* Картка 2: Список точних інтервалів */}
        <div className="card list-card">
          <div className="list-header">
            <h2>Графік світла</h2>
            {/* Використовуємо нашу нову функцію тут */}
            <div className="date-badge">{formatDate(day)}</div>
          </div>

          <div className="intervals-list">
            {timeline.map((interval, index) => {
              const isOff = interval.type === 'off';

              return (
                  <div key={index} className={`interval-row ${isOff ? 'row-off' : 'row-on'}`}>
                <span className="time-range">
                  {interval.start}-{interval.end}
                </span>
                    <span className="status-label">
                  {isOff ? 'немає світла' : 'Світло є'}
                </span>
                  </div>
              );
            })}
          </div>
        </div>

        <StyleBlock />
      </div>
  );
};

const StyleBlock = () => (
    <style>{`
    .empty-card {
      min-height: 600px;
      height: 100%;
      border: 2px dashed #3b82f6; 
      background-color: #ffffff;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 320px;
    }

    .icon-search {
      width: 150px;
      height: 150px;
      color: #000000;
      stroke-width: 2.5;
      margin-bottom: 30px;
      opacity: 0.9;
    }

    .empty-card h3 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #000000;
      margin-bottom: 16px;
    }

    .empty-card p {
      color: #4b5563;
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .results-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .chart-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 60px;
      flex-wrap: wrap;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .donut-hole {
      width: 140px;
      height: 140px;
      background: white;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.1;
    }

    .percent-text {
      font-size: 2.2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .label-text {
      font-size: 0.9rem;
      color: #9ca3af;
      margin-bottom: 2px;
    }

    .hours-text {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1f2937;
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
      font-size: 1.05rem;
    }

    .dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
    
    .dot-green { background: #22c55e; }
    .dot-red { background: #ef4444; }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }

    .list-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .date-badge {
      background: #3b82f6;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .intervals-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .interval-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 1.1rem;
    }

    .row-on {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .row-on .status-label {
      color: #22c55e;
      font-weight: 600;
    }

    .row-off {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .row-off .status-label {
      color: #ef4444;
      font-weight: 600;
      text-transform: lowercase;
    }

    .time-range {
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  `}</style>
);

export default ScheduleResult;