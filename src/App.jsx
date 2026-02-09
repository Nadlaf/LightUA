import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScheduleForm from './components/ScheduleForm';
import ScheduleResult from './components/ScheduleResult';
import Footer from './components/Footer';
import { fetchSchedule } from './api/scheduleService';

function App() {
    const [scheduleData, setScheduleData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Стан теми (читаємо з localStorage або ставимо 'light')
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    // 2. Ефект: при зміні теми оновлюємо атрибут на <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleSearch = async (formData) => {
        setIsLoading(true);
        setScheduleData(null);

        try {
            const data = await fetchSchedule(formData);
            setScheduleData(data);
        } catch (error) {
            console.error("Помилка:", error);
            alert("Не вдалося завантажити графік для обраної дати.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-wrapper">
            {/* Передаємо theme та toggleTheme у Header */}
            <Header theme={theme} toggleTheme={toggleTheme} />

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

        .wide-container { max-width: 1440px !important; }

        .main-content {
          padding-top: 60px;
          padding-bottom: 60px;
          flex: 1;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 400px minmax(0, 1fr); 
          gap: 40px;
          align-items: start;
        }

        .right-panel { width: 100%; position: relative; }
        
        /* Loading State - використовуємо змінні! */
        .loading-state {
          width: 100%; 
          min-height: 600px;
          height: 100%;
          background: var(--bg-card); /* ЗМІННЕ */
          border-radius: 24px;
          box-shadow: var(--shadow);  /* ЗМІННЕ */
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          transition: background 0.3s;
        }

        .spinner {
          width: 70px;
          height: 70px;
          border: 5px solid var(--bg-element); /* ЗМІННЕ */
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
          .grid-layout { grid-template-columns: 1fr; }
          .wide-container { max-width: 100% !important; }
        }
      `}</style>
        </div>
    );
}

export default App;