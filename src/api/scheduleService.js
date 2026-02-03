export const fetchSchedule = async (requestData) => {
    const jsonFileUrl = requestData.day === 'tomorrow'
        ? '/schedule_tomorrow.json'
        : '/schedule_today.json';

    try {
        const response = await fetch(jsonFileUrl);

        if (!response.ok) {
            throw new Error(`Файл графіку (${jsonFileUrl}) не знайдено`);
        }

        const data = await response.json();
        const availableDates = Object.keys(data);
        if (availableDates.length === 0) throw new Error("Файл порожній");

        const dateKey = availableDates[0];
        const dayData = data[dateKey];
        const requestedGroup = requestData.group;
        const schedule = dayData.schedule;

        if (!schedule || !schedule[requestedGroup]) {
            throw new Error(`Дані для черги ${requestedGroup} відсутні у файлі`);
        }

        const rawOffRanges = schedule[requestedGroup];

        const { timeline, stats } = generateExactTimeline(rawOffRanges);

        return {
            region: 'Черкаська область',
            group: requestedGroup,
            day: dateKey,
            timeline: timeline,
            stats: stats
        };

    } catch (error) {
        console.error("Помилка API:", error);
        throw error;
    }
};

export const checkTomorrowAvailability = async () => {
    try {
        const [todayRes, tomorrowRes] = await Promise.all([
            fetch('/schedule_today.json'),
            fetch('/schedule_tomorrow.json')
        ]);

        if (!tomorrowRes.ok || !todayRes.ok) return false;

        const todayData = await todayRes.json();
        const tomorrowData = await tomorrowRes.json();

        const todayDateStr = Object.keys(todayData)[0];
        const tomorrowDateStr = Object.keys(tomorrowData)[0];

        if (!todayDateStr || !tomorrowDateStr) return false;

        const todayDate = new Date(todayDateStr);
        const tomorrowDate = new Date(tomorrowDateStr);

        return todayDate < tomorrowDate;

    } catch (error) {
        return false;
    }
};

// --- ВИПРАВЛЕНА ЛОГІКА ТАЙМЛАЙНУ ---

const generateExactTimeline = (offRangesStr) => {
    let offIntervals = offRangesStr.map(range => {
        const [startStr, endStr] = range.split('-');

        let start = timeToMinutes(startStr);
        let end = timeToMinutes(endStr);

        // ВАЖЛИВИЙ ФІКС:
        // Якщо кінець інтервалу 00:00 (0 хвилин), це означає опівніч наступної доби (24:00 = 1440 хв)
        // Але тільки якщо це не старт інтервалу (бо 00:00-04:00 - це ок)
        if (end === 0) {
            end = 1440;
        }

        return { start, end };
    });

    // Сортуємо
    offIntervals.sort((a, b) => a.start - b.start);

    const timeline = [];
    let currentCursor = 0;
    let totalOffMinutes = 0;

    offIntervals.forEach(off => {
        // 1. Зелений блок (якщо є проміжок до початку відключення)
        if (off.start > currentCursor) {
            timeline.push({
                start: minutesToTime(currentCursor),
                end: minutesToTime(off.start),
                type: 'on'
            });
        }

        // 2. Червоний блок (саме відключення)
        // Додаткова перевірка, щоб не додавати "від'ємні" інтервали, якщо дані криві
        if (off.end > off.start) {
            timeline.push({
                start: minutesToTime(off.start),
                end: minutesToTime(off.end), // Тут тепер буде 24:00 замість 00:00
                type: 'off'
            });

            // Оновлюємо курсор і статистику
            totalOffMinutes += (off.end - off.start);
            currentCursor = Math.max(currentCursor, off.end);
        }
    });

    // 3. Додаємо фінальний зелений блок, якщо доба ще не скінчилась
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