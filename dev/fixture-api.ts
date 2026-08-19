import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Plugin } from 'vite';

const FIXTURE_DIR = resolve(import.meta.dirname, '../fixtures');

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const AUTO_UPDATE_INTERVAL_MINUTES = 30;

interface CityFixture {
  id: number;
  name: string;
}

interface ScheduleRecord {
  channel_id: number;
  schedule_date?: string;
  schedule_time?: string;
  schedule?: Record<string, string[]>;
  emergency_outages?: boolean;
}

const readFixture = <T>(file: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(resolve(FIXTURE_DIR, file), 'utf8')) as T;
  } catch {
    return fallback;
  }
};

const readCities = (): CityFixture[] =>
  readFixture<{ cities?: CityFixture[] }>('cities.json', {}).cities ?? [];

const readRecords = (file: string): ScheduleRecord[] => {
  const data = readFixture<ScheduleRecord[] | Record<string, ScheduleRecord>>(file, []);
  return Array.isArray(data) ? data : Object.values(data);
};

const cityName = (channelId: number): string =>
  readCities().find((city) => city.id === channelId)?.name ?? 'Невідоме місто';

/**
 * Mirrors the hosted Flask API's response envelope, including its quirk of
 * treating an empty `schedule` object as "not found" rather than as empty data.
 */
const scheduleResponse = (
  record: ScheduleRecord | undefined,
  channelId: number,
  queue: string | null,
): { status: number; body: unknown } => {
  const schedule = record?.schedule;
  if (!schedule || Object.keys(schedule).length === 0) {
    return { status: HTTP_NOT_FOUND, body: { error: 'Розклад не знайдено' } };
  }

  if (queue && !(queue in schedule)) {
    return { status: HTTP_NOT_FOUND, body: { error: `Черга ${queue} не знайдена` } };
  }

  return {
    status: 200,
    body: {
      channel_id: channelId,
      city_name: cityName(channelId),
      date: record?.schedule_date ?? '',
      time: record?.schedule_time ?? '',
      schedule: queue ? { [queue]: schedule[queue] } : schedule,
      emergency_outages: record?.emergency_outages ?? false,
    },
  };
};

export const fixtureApi = (): Plugin => ({
  name: 'lightua:fixture-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api', (req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const channelId = Number(url.searchParams.get('channel_id'));
      const queue = url.searchParams.get('queue');

      const send = (status: number, body: unknown): void => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(body));
      };

      const requireChannel = (): boolean => {
        if (!channelId) {
          send(HTTP_BAD_REQUEST, { error: "channel_id параметр обов'язковий" });
          return false;
        }
        return true;
      };

      if (url.pathname === '/cities') {
        send(200, { cities: readCities() });
        return;
      }

      if (url.pathname === '/status') {
        send(200, {
          last_update: {
            timestamp: new Date().toISOString(),
            status: 'success',
            message: 'fixture-api (dev)',
          },
          parsing_in_progress: false,
          auto_update_interval_minutes: AUTO_UPDATE_INTERVAL_MINUTES,
        });
        return;
      }

      if (url.pathname === '/schedules/today' || url.pathname === '/schedules/tomorrow') {
        if (!requireChannel()) return;
        const file =
          url.pathname === '/schedules/today' ? 'schedule_today.json' : 'schedule_tomorrow.json';
        const record = readRecords(file).find((item) => item.channel_id === channelId);
        const { status, body } = scheduleResponse(record, channelId, queue);
        send(status, body);
        return;
      }

      if (url.pathname === '/schedules') {
        if (!requireChannel()) return;
        const date = url.searchParams.get('date');
        const record = readRecords(`schedule_history_${channelId}.json`).find(
          (item) => item.schedule_date === date,
        );
        const { status, body } = scheduleResponse(record, channelId, queue);
        send(status, body);
        return;
      }

      next();
    });
  },
});
