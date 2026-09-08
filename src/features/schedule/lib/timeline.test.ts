import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildTimeline,
  DEGREES_PER_MINUTE,
  minutesToHours,
  minutesToTime,
  type Timeline,
  timeToMinutes,
} from './timeline.ts';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;
const DEGREES_PER_TURN = 360;
const MAX_PERCENTAGE = 100;
const OUT_OF_RANGE_MINUTES = 1500;
const DAY_START = '00:00';
const DAY_END = '24:00';

/** Independent of the module under test, so the invariants are not self-referential. */
const parseTime = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
};

const sumOffMinutes = (result: Timeline): number =>
  result.timeline
    .filter((segment) => segment.type === 'off')
    .reduce((sum, segment) => sum + parseTime(segment.end) - parseTime(segment.start), 0);

/**
 * Invariants every timeline must satisfy. `endsAt` defaults to 24:00 and is only
 * ever anything else for out-of-range input, which the builder does not clamp —
 * see the "out of range" case below.
 */
const assertInvariants = (result: Timeline, endsAt: string = DAY_END): void => {
  const { timeline, stats } = result;

  assert.ok(timeline.length > 0, 'a timeline is never empty');
  assert.equal(timeline.at(0)?.start, DAY_START, 'must start at midnight');
  assert.equal(timeline.at(-1)?.end, endsAt, `must end at ${endsAt}`);

  timeline.forEach((segment, index) => {
    assert.ok(
      parseTime(segment.end) > parseTime(segment.start),
      `segment ${index} must move forward, got ${segment.start}-${segment.end}`,
    );

    const previous = timeline[index - 1];
    if (!previous) return;
    assert.equal(segment.start, previous.end, `no gap allowed before segment ${index}`);
    assert.notEqual(segment.type, previous.type, `segment ${index} repeats the previous type`);
  });

  assert.ok(stats.percentage >= 0, 'percentage is never negative');
  assert.ok(stats.percentage <= MAX_PERCENTAGE, 'percentage never exceeds 100');
  assert.equal(stats.totalOffMinutes, sumOffMinutes(result), 'stats must match the off segments');
};

describe('timeToMinutes / minutesToTime', () => {
  it('round-trips the 24:00 sentinel', () => {
    assert.equal(timeToMinutes(DAY_END), MINUTES_PER_DAY);
    assert.equal(minutesToTime(MINUTES_PER_DAY), DAY_END);
    assert.equal(minutesToTime(0), DAY_START);
  });

  it('keeps 24:00 exactly one full turn on the clock face', () => {
    assert.equal(timeToMinutes(DAY_END) * DEGREES_PER_MINUTE, DEGREES_PER_TURN);
  });

  it('does not validate the hour, so 25:00 is 1500 minutes', () => {
    assert.equal(timeToMinutes('25:00'), OUT_OF_RANGE_MINUTES);
  });
});

describe('minutesToHours', () => {
  it('rounds rather than truncating', () => {
    // 810 min is 13.5 h, which both charts render as 14. Both directions are
    // pinned so neither Math.floor nor Math.ceil can pass.
    assert.equal(minutesToHours(810), 14, 'must round up at the half hour');
    assert.equal(minutesToHours(809), 13, 'must round down below the half hour');
  });
});

describe('buildTimeline', () => {
  it('splits a midnight-crossing range into a head and a tail', () => {
    const result = buildTimeline(['22:00-01:00']);
    assertInvariants(result);

    assert.deepEqual(result.timeline, [
      { start: '00:00', end: '01:00', type: 'off' },
      { start: '01:00', end: '22:00', type: 'on' },
      { start: '22:00', end: '24:00', type: 'off' },
    ]);
    // 22:00-01:00 is a three-hour span: 120 min before midnight plus 60 after.
    assert.equal(result.stats.totalOffMinutes, 180);
    assert.equal(result.stats.percentage, 13);
  });

  it('counts overlapping ranges once', () => {
    const result = buildTimeline(['01:00-03:00', '02:00-04:00']);
    assertInvariants(result);

    assert.equal(result.stats.totalOffMinutes, 180);
    assert.deepEqual(
      result.timeline.filter((segment) => segment.type === 'off'),
      [{ start: '01:00', end: '04:00', type: 'off' }],
    );
  });

  it('merges ranges that merely touch', () => {
    const result = buildTimeline(['00:00-01:00', '01:00-02:00']);
    assertInvariants(result);

    const off = result.timeline.filter((segment) => segment.type === 'off');
    assert.equal(off.length, 1, 'touching ranges must collapse into one segment');
    assert.deepEqual(off, [{ start: '00:00', end: '02:00', type: 'off' }]);
    assert.equal(result.stats.totalOffMinutes, 120);
    assert.deepEqual(result.timeline, [
      { start: '00:00', end: '02:00', type: 'off' },
      { start: '02:00', end: '24:00', type: 'on' },
    ]);
  });

  it('merges a wrapped head piece into a range that already covers it', () => {
    const result = buildTimeline(['22:00-01:00', '00:30-02:00']);
    assertInvariants(result);

    assert.deepEqual(result.timeline, [
      { start: '00:00', end: '02:00', type: 'off' },
      { start: '02:00', end: '22:00', type: 'on' },
      { start: '22:00', end: '24:00', type: 'off' },
    ]);
    assert.equal(result.stats.totalOffMinutes, 240);
    assert.equal(result.stats.percentage, 17);
  });

  it('lets an out-of-range hour through and overruns the day', () => {
    const result = buildTimeline(['25:00-26:00']);
    // There is no domain validation: the range survives the end > start filter,
    // so the timeline runs past 24:00 rather than being clamped or dropped.
    assertInvariants(result, '26:00');

    assert.deepEqual(result.timeline, [
      { start: '00:00', end: '25:00', type: 'on' },
      { start: '25:00', end: '26:00', type: 'off' },
    ]);
    assert.equal(result.stats.totalOffMinutes, 60);
  });

  it('reports a full-day outage as a single segment with no trailing on', () => {
    const result = buildTimeline(['00:00-24:00']);
    assertInvariants(result);

    assert.deepEqual(result.timeline, [{ start: '00:00', end: '24:00', type: 'off' }]);
    assert.equal(result.stats.percentage, MAX_PERCENTAGE);
    assert.equal(result.stats.totalOffMinutes, MINUTES_PER_DAY);
  });

  it('drops a zero-length range as malformed', () => {
    const result = buildTimeline(['00:00-00:00']);
    assertInvariants(result);

    assert.deepEqual(result.timeline, [{ start: '00:00', end: '24:00', type: 'on' }]);
    assert.equal(result.stats.percentage, 0);
    assert.equal(result.stats.totalOffMinutes, 0);
  });

  it('covers the whole day with one on segment when there are no outages', () => {
    const result = buildTimeline([]);
    assertInvariants(result);

    assert.deepEqual(result.timeline, [{ start: '00:00', end: '24:00', type: 'on' }]);
    assert.equal(result.stats.totalOffMinutes, 0);
  });
});

describe('buildTimeline known-good schedules', () => {
  it('handles a five-outage day ending on a 00:00 wrap with no head piece', () => {
    const result = buildTimeline([
      '00:00-01:00',
      '04:00-07:00',
      '09:30-13:00',
      '15:30-19:00',
      '21:30-00:00',
    ]);
    assertInvariants(result);

    assert.equal(result.stats.totalOffMinutes, 810);
    assert.equal(result.stats.percentage, 56);
    assert.equal(result.timeline.length, 9, 'segment count');
    assert.deepEqual(result.timeline[0], { start: '00:00', end: '01:00', type: 'off' });
    assert.deepEqual(result.timeline.at(-1), { start: '21:30', end: '24:00', type: 'off' });
  });

  it('handles a four-outage day', () => {
    const result = buildTimeline(['00:00-01:30', '05:00-08:30', '12:00-15:30', '19:00-00:00']);
    assertInvariants(result);

    assert.equal(result.stats.totalOffMinutes, 810);
    assert.equal(result.stats.percentage, 56);
    assert.equal(result.timeline.length, 7, 'segment count');
  });

  it('handles a six-outage day whose last range crosses midnight', () => {
    const result = buildTimeline([
      '02:00-04:00',
      '06:00-08:00',
      '10:00-12:00',
      '14:00-17:00',
      '18:00-20:00',
      '22:00-01:00',
    ]);
    assertInvariants(result);

    assert.equal(result.stats.totalOffMinutes, 840);
    assert.equal(result.stats.percentage, 58);
    assert.equal(result.timeline.length, 13, 'segment count');
    assert.deepEqual(result.timeline[0], { start: '00:00', end: '01:00', type: 'off' });
    assert.deepEqual(result.timeline.at(-1), { start: '22:00', end: '24:00', type: 'off' });
  });
});
