import React from 'react';
import { Search } from 'lucide-react';

const ScheduleResult = ({ scheduleData }) => {
  // --- Логіка відображення порожнього стану ---
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

  // --- Логіка обробки даних для графіка ---
  
  // 1. Рахуємо статистику
  const totalHours = scheduleData.hours.length;
  const offHoursCount = scheduleData.hours.filter(h => h.type === 'off').length;
  const offPercentage = Math.round((offHoursCount / totalHours) * 100);

  // 2. Групуємо години в інтервали (Range Logic)
  // Перетворюємо [0, 1, 2, 3...] на [{start:0, end:4, type:'on'}, ...]
  const ranges = [];
  let currentRange = null;

  scheduleData.hours.forEach((h, index) => {
    if (!currentRange) {
      currentRange = { start: h.hour, count: 1, type: h.type };
    } else if (h.type === currentRange.type) {
      currentRange.count++;
    } else {
      // Закінчуємо попередній діапазон
      ranges.push(currentRange);
      // Починаємо новий
      currentRange = { start: h.hour, count: 1, type: h.type };
    }
  });
  // Додаємо останній шматочок
  if (currentRange) ranges.push(currentRange);


  // --- Рендер активного стану ---
  return (
    <div className="results-wrapper">
      
      {/* Картка 1: Кругова діаграма */}
      <div className="card chart-card">
        <div className="chart-container">
          {/* CSS Donut Chart */}
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
              <span className="hours-text">{offHoursCount} год</span>
            </div>
          </div>

          {/* Легенда */}
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

      {/* Картка 2: Список інтервалів */}
      <div className="card list-card">
        <div className="list-header">
          <h2>Графік світла</h2>
          <div className="date-badge">23 січня</div>
        </div>

        <div className="intervals-list">
          {ranges.map((range, index) => {
            // Форматуємо час: 0 -> "00:00", 10 -> "10:00"
            const startTime = `${range.start.toString().padStart(2, '0')}:00`;
            const endTime = `${(range.start + range.count).toString().padStart(2, '0')}:00`;
            const isOff = range.type === 'off';

            return (
              <div key={index} className={`interval-row ${isOff ? 'row-off' : 'row-on'}`}>
                <span className="time-range">
                  {startTime}-{endTime}
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

// --- CSS STYLES ---
const StyleBlock = () => (
  <style>{`
    /* Загальні стилі для порожнього стану */
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

    /* --- АКТИВНИЙ СТАН (Дві картки) --- */
    .results-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px; /* Відступ між картками */
    }

    .card {
      background: white;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    /* Chart Card Styles */
    .chart-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 60px; /* Відстань між бубликом і легендою */
      flex-wrap: wrap;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      position: relative;
      /* Градієнт задається інлайном в компоненті */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .donut-hole {
      width: 140px; /* Товщина кільця = (180-140)/2 = 20px */
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


    /* List Card Styles */
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

    /* Зелений рядок */
    .row-on {
      background-color: #dcfce7; /* Дуже світлий зелений */
      color: #166534; /* Темно-зелений текст */
    }
    
    .row-on .status-label {
      color: #22c55e; /* Яскраво зелений текст статусу */
      font-weight: 600;
    }

    /* Червоний рядок */
    .row-off {
      background-color: #fee2e2; /* Дуже світлий червоний */
      color: #991b1b;
    }

    .row-off .status-label {
      color: #ef4444; /* Яскраво червоний текст статусу */
      font-weight: 600;
      text-transform: lowercase; /* Як на макеті */
    }

    .time-range {
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  `}</style>
);

export default ScheduleResult;