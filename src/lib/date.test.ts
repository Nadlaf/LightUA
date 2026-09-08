import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildWeek,
  formatDisplayDate,
  isIsoDate,
  parseIsoDateLocal,
  toLocalIsoDate,
} from './date.ts';

// The UTC-vs-local distinction these tests exist to catch is invisible under
// TZ=UTC, which is what the CI runner uses: the buggy `new Date(iso)` form
// passes every assertion below at offset 0. Pin a non-zero offset so the guard
// is real in CI, not just on a developer machine.
//
// This runs *after* the import above, because ESM hoists imports. That is only
// safe because date.ts constructs no Date at module scope — every Date is built
// inside a function, by which time the zone is set. Keep it that way.
process.env.TZ = 'Europe/Kyiv';

const DAYS_IN_WEEK = 7;
const SUNDAY = 0;

describe('isIsoDate', () => {
  it('accepts a real calendar date', () => {
    assert.equal(isIsoDate('2026-02-05'), true);
  });

  it('rejects a well-shaped date that does not exist', () => {
    // Date rolls 2026-02-30 over to March 2, so the round-trip no longer matches.
    assert.equal(isIsoDate('2026-02-30'), false);
    assert.equal(isIsoDate('2026-13-01'), false);
  });

  it('rejects anything that is not zero-padded YYYY-MM-DD', () => {
    assert.equal(isIsoDate('2026-2-5'), false);
    assert.equal(isIsoDate('not-a-date'), false);
    assert.equal(isIsoDate(''), false);
    assert.equal(isIsoDate('2026-02-05T00:00'), false);
  });
});

describe('parseIsoDateLocal / toLocalIsoDate', () => {
  it('round-trips without shifting the day', () => {
    assert.equal(toLocalIsoDate(parseIsoDateLocal('2026-02-05')), '2026-02-05');
    assert.equal(toLocalIsoDate(parseIsoDateLocal('2026-12-31')), '2026-12-31');
    assert.equal(toLocalIsoDate(parseIsoDateLocal('2026-01-01')), '2026-01-01');
  });

  it('reads the ISO string as local midnight, not UTC midnight', () => {
    const parsed = parseIsoDateLocal('2026-02-05');
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 1);
    assert.equal(parsed.getDate(), 5);
    assert.equal(parsed.getHours(), 0);
  });
});

describe('buildWeek', () => {
  const MONDAY_FIRST_WEEK = [
    '2026-02-02',
    '2026-02-03',
    '2026-02-04',
    '2026-02-05',
    '2026-02-06',
    '2026-02-07',
    '2026-02-08',
  ];

  it('returns seven Monday-first days containing a midweek input', () => {
    assert.deepEqual(buildWeek('2026-02-05'), MONDAY_FIRST_WEEK);
  });

  it('puts a Sunday at the end of the preceding week, not the start of a new one', () => {
    // 2026-02-08 is a Sunday, which is the weekDay === 0 branch.
    assert.equal(parseIsoDateLocal('2026-02-08').getDay(), SUNDAY);

    assert.deepEqual(buildWeek('2026-02-08'), MONDAY_FIRST_WEEK);
  });

  it('returns the same week for a Monday input', () => {
    assert.deepEqual(buildWeek('2026-02-02'), MONDAY_FIRST_WEEK);
  });

  it('crosses a month boundary', () => {
    const week = buildWeek('2026-03-01');
    assert.equal(week.length, DAYS_IN_WEEK);
    assert.deepEqual(week, [
      '2026-02-23',
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });
});

describe('formatDisplayDate', () => {
  it('reverses the ISO parts into dotted day-first form', () => {
    assert.equal(formatDisplayDate('2026-02-05'), '05.02.2026');
  });

  it('returns anything without three dash-separated parts unchanged', () => {
    assert.equal(formatDisplayDate('oops'), 'oops');
    assert.equal(formatDisplayDate(''), '');
    assert.equal(formatDisplayDate('2026-02'), '2026-02');
  });
});
