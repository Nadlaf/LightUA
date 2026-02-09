// URL файлів
const FILES = {
    today: '/schedule_today.json',
    tomorrow: '/schedule_tomorrow.json',
    history: '/schedule_history.json'
};

// --- ГОЛОВНА ФУНКЦІЯ ОТРИМАННЯ ДАНИХ ---
export const fetchSchedule = async (requestData) => {
    // requestData тепер має поле 'date' (YYYY-MM-DD), а не 'day'
    const targetDate = requestData.date;

    try {
        // 1. Спочатку дізнаємося, де шукати цю дату (Сьогодні, Завтра чи Історія)
        const source = await determineSourceForDate(targetDate);

        if (!source) {
            throw new Error(`Дані за ${targetDate} відсутні.`);
        }

        // 2. Отримуємо "сирі" дані з правильного джерела
        let rawData = null;
        let schedule = null;

        if (source.type === 'history') {
            // Історія - це масив, треба знайти потрібний об'єкт
            const historyArr = await fetch(FILES.history).then(r => r.json());
            const dayObj = historyArr.find(d => d.schedule_date === targetDate);
            if (dayObj) schedule = dayObj.schedule;
        } else {
            // Сьогодні або Завтра - це об'єкт з ключем-датою
            const response = await fetch(source.url);
            const data = await response.json();
            // Ключ може бути датою, тому беремо data[targetDate] або просто перший ключ
            schedule = data[targetDate]?.schedule || Object.values(data)[0]?.schedule;
        }

        if (!schedule) {
            throw new Error(`Графік на ${targetDate} не знайдено.`);
        }

        // 3. Перевіряємо чергу
        const requestedGroup = requestData.group;
        if (!schedule[requestedGroup]) {
            throw new Error(`Дані для черги ${requestedGroup} відсутні.`);
        }

        // 4. Генеруємо таймлайн
        const { timeline, stats } = generateExactTimeline(schedule[requestedGroup]);

        return {
            region: 'Черкаська область',
            group: requestedGroup,
            day: targetDate,
            timeline: timeline,
            stats: stats
        };

    } catch (error) {
        console.error("Помилка API:", error);
        throw error;
    }
};

// --- ОТРИМАННЯ ІНФОРМАЦІЇ ПРО ДОСТУПНІ ДАТИ ---
// Ця функція викликається при завантаженні, щоб намалювати календар
export const getCalendarInfo = async () => {
    const info = {
        todayDate: null, // Яка дата вважається "сьогодні" (з файлу)
        availableDates: [] // Список всіх дат, для яких є графіки (YYYY-MM-DD)
    };

    try {
        // 1. Дізнаємось дату "Сьогодні"
        const todayRes = await fetch(FILES.today);
        if (todayRes.ok) {
            const data = await todayRes.json();
            // Беремо перший ключ об'єкта як дату
            info.todayDate = Object.keys(data)[0];
            info.availableDates.push(info.todayDate);
        }

        // 2. Перевіряємо "Завтра"
        const tmrRes = await fetch(FILES.tomorrow);
        if (tmrRes.ok) {
            const data = await tmrRes.json();
            const tmrDate = Object.keys(data)[0];
            if (tmrDate) info.availableDates.push(tmrDate);
        }

        // 3. Завантажуємо історію
        const histRes = await fetch(FILES.history);
        if (histRes.ok) {
            const historyData = await histRes.json(); // Це масив
            if (Array.isArray(historyData)) {
                const historyDates = historyData.map(d => d.schedule_date);
                info.availableDates.push(...historyDates);
            }
        }

        // Прибираємо дублікати і сортуємо
        info.availableDates = [...new Set(info.availableDates)].sort();

        return info;

    } catch (e) {
        console.error("Помилка ініціалізації календаря:", e);
        return info;
    }
};

// --- Helpers ---

// Визначає, з якого файлу брати дату
async function determineSourceForDate(date) {
    // Перевіряємо "Сьогодні"
    const info = await getCalendarInfo(); // Це трохи неоптимально викликати щоразу, але надійно

    if (date === info.todayDate) return { type: 'today', url: FILES.today };

    // Перевіряємо "Завтра" (якщо дата більша за сьогодні)
    if (date > info.todayDate) return { type: 'tomorrow', url: FILES.tomorrow };

    // Інакше шукаємо в історії
    return { type: 'history', url: FILES.history };
}

const generateExactTimeline = (offRangesStr) => {
    let offIntervals = offRangesStr.map(range => {
        const [startStr, endStr] = range.split('-');
        let start = timeToMinutes(startStr);
        let end = timeToMinutes(endStr);
        if (end === 0) end = 1440;
        return { start, end };
    });

    offIntervals.sort((a, b) => a.start - b.start);

    const timeline = [];
    let currentCursor = 0;
    let totalOffMinutes = 0;

    offIntervals.forEach(off => {
        if (off.start > currentCursor) {
            timeline.push({
                start: minutesToTime(currentCursor),
                end: minutesToTime(off.start),
                type: 'on'
            });
        }
        if (off.end > off.start) {
            timeline.push({
                start: minutesToTime(off.start),
                end: minutesToTime(off.end),
                type: 'off'
            });
            totalOffMinutes += (off.end - off.start);
            currentCursor = Math.max(currentCursor, off.end);
        }
    });

    if (currentCursor < 1440) {
        timeline.push({
            start: minutesToTime(currentCursor),
            end: "24:00",
            type: 'on'
        });
    }

    return {
        timeline,
        stats: {
            totalOffMinutes,
            percentage: Math.round((totalOffMinutes / 1440) * 100)
        }
    };
};

const timeToMinutes = (timeStr) => {
    if (timeStr === "24:00") return 1440;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (minutes) => {
    if (minutes === 1440) return "24:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};