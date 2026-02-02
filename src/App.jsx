import React, { useState } from 'react';
import Header from './components/Header';
import ScheduleForm from './components/ScheduleForm';
import ScheduleResult from './components/ScheduleResult';
import Footer from './components/Footer';

import { fetchSchedule } from './api/scheduleService';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  //Лоадер
  const handleSearch = async (formData) => {
    setIsLoading(true);
    //Прибираєм графік
    setScheduleData(null);

    try {
      //Підгружаємо дані про черги
      const data = await fetchSchedule(formData);
      setScheduleData(data);
    } catch (error) {
      console.error("Помилка:", error);
      alert("Не вдалося знайти графік для цієї черги або файл відсутній.");
    } finally {
      setIsLoading(false);
    }
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
          /* Ліва колонка фіксована, права - адаптивна */
          grid-template-columns: 400px minmax(0, 1fr); 
          gap: 40px;
          align-items: start;
        }

        .right-panel {
          width: 100%;
          position: relative;
        }
        
        .loading-state {
          width: 100%; 
          min-height: 600px;
          height: 100%;
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
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