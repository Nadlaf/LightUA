const JSON_FILE_URL = '/schedule_today.json';

export const fetchSchedule = async (requestData) => {
    try {
        const response = await fetch(JSON_FILE_URL);
        if (!response.ok) {
            throw new Error('Файл schedule_today.json не знайдено');
        }
        const data = await response.json();

        const availableDates = Object.keys(data);
        if (availableDates.length === 0) throw new Error("Файл порожній");
        const dateKey = availableDates[0];
        const dayData = data[dateKey];

        const requestedGroup = requestData.group;
        const schedule = dayData.schedule;

        if (!schedule[requestedGroup]) {
            throw new Error(`Дані для черги ${requestedGroup} відсутні`);
        }

        //Години відключень напряму з файлу
        const rawOffRanges = schedule[requestedGroup];

        //Генерація годин коли світло є, таймлайн
        const { timeline, stats } = generateExactTimeline(rawOffRanges);

        return {
            region: 'Черкаська область',
            group: requestedGroup,
            day: dateKey,
            timeline: timeline, // Новий формат даних: список точних інтервалів
            stats: stats        // Статистика для діаграми
        };

    } catch (error) {
        console.error("Помилка API:", error);
        throw error;
    }
};

const generateExactTimeline = (offRangesStr) => {
    //Перетворюємо рядки ["00:00-04:00"] у хвилини [{start: 0, end: 240}]
    let offIntervals = offRangesStr.map(range => {
        const [startStr, endStr] = range.split('-');
        return {
            start: timeToMinutes(startStr),
            end: timeToMinutes(endStr)
        };
    });

    //Сортуємо за часом початку
    offIntervals.sort((a, b) => a.start - b.start);

    const timeline = [];
    let currentCursor = 0; // Починаємо з 00:00 (0 хвилин)
    let totalOffMinutes = 0;

    //Проходимося по відключеннях і заповнюємо проміжки зі світлом
    offIntervals.forEach(off => {
        if (off.start > currentCursor) {
            timeline.push({
                start: minutesToTime(currentCursor),
                end: minutesToTime(off.start),
                type: 'on'
            });
        }

        //Додаємо саме відключення
        timeline.push({
            start: minutesToTime(off.start),
            end: minutesToTime(off.end),
            type: 'off'
        });

        totalOffMinutes += (off.end - off.start);
        currentCursor = Math.max(currentCursor, off.end);
    });

    //Якщо після останнього відключення ще не 24:00
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

//Переводимо години в хвилини, наприклад: 14:30 -> 870 хвилин
const timeToMinutes = (timeStr) => {
    if (timeStr === "24:00") return 1440;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

//Переводимо хвилини в години, наприкла: 870 це 14:30
const minutesToTime = (minutes) => {
    if (minutes === 1440) return "24:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};