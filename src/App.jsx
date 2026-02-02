import React, { useState } from 'react';
import Header from './components/Header';
import ScheduleForm from './components/ScheduleForm';
import ScheduleResult from './components/ScheduleResult';
import Footer from './components/Footer';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (formData) => {
    setIsLoading(true);
    // Ми НЕ скидаємо setScheduleData(null) тут.
    // Це маленька хитрість: поки вантажиться нове, 
    // старе (або порожнє) ще тримає ширину контейнера.
    // Але ми показуємо поверх нього лоадер через умову в рендері.
    
    // Хоча для чистоти експерименту, давай просто зафіксуємо ширину через CSS.
    setScheduleData(null); 

    setTimeout(() => {
      const newMockData = {
        region: getRegionName(formData.region),
        group: formData.group,
        day: formData.day === 'today' ? 'Сьогодні' : 'Завтра',
        hours: generateRandomSchedule() 
      };

      setScheduleData(newMockData);
      setIsLoading(false);
    }, 1500); 
  };

  const getRegionName = (code) => {
    const names = { kyiv: 'Київська обл.', lviv: 'Львівська обл.', dnipro: 'Дніпропетровська обл.', odesa: 'Одеська обл.' };
    return names[code] || 'Україна';
  };

  const generateRandomSchedule = () => {
    return Array.from({ length: 24 }, (_, i) => {
      let type = 'on';
      if (i >= 18 && i < 22) type = 'off'; 
      if (i >= 9 && i < 12 && Math.random() > 0.5) type = 'off';
      return { hour: i, type };
    });
  };

  return (
    <div className="app-wrapper">
      <Header />
      
      <main className="container wide-container main-content">
        <div className="grid-layout">
          <div className="left-panel">
            <ScheduleForm onSearch={handleSearch} />
          </div>
          
          <div className="right-panel">
            {isLoading ? (
               <div className="loading-state">
                 <div className="spinner"></div>
               </div> 
            ) : (
               <ScheduleResult scheduleData={scheduleData} />
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .app-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .wide-container {
          max-width: 1440px !important; 
        }

        .main-content {
          padding-top: 60px;
          padding-bottom: 60px;
          flex: 1;
        }

        .grid-layout {
          display: grid;
          /* FIX 1: Використовуємо minmax(0, 1fr) замість просто 1fr.
             Це стандартний фікс для Grid, щоб контент не розпирав колонку,
             але і не схлопував її менше доступного місця. */
          grid-template-columns: 400px minmax(0, 1fr); 
          gap: 40px;
          align-items: start;
        }

        .left-panel {
          /* Фіксуємо ліву панель, щоб вона не стискалась */
          width: 100%; 
        }

        /* FIX 2: Права панель */
        .right-panel {
          width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        
        /* Стиль лоадера */
        .loading-state {
          width: 100%; 
          min-height: 600px;
          
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* FIX 3: Додаємо box-sizing, щоб padding не впливав на ширину */
          box-sizing: border-box; 
        }

        .spinner {
          width: 70px;
          height: 70px;
          border: 5px solid #f3f4f6;
          border-top: 5px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .grid-layout {
             grid-template-columns: 350px minmax(0, 1fr);
             gap: 30px;
          }
        }

        @media (max-width: 900px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
          .wide-container { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

export default App;