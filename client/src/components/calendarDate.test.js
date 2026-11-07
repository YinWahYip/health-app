import test from 'node:test';
import assert from 'node:assert/strict';
import { today, shiftDate } from './calendarDate.js';
import { getDateRange } from './dateRange.js';

test('Central Time does not roll over when UTC reaches the following day', () => {
  assert.equal(today(new Date('2026-11-08T05:59:59Z')), '2026-11-07');
  assert.equal(today(new Date('2026-11-08T06:00:00Z')), '2026-11-08');
  assert.equal(getDateRange('week', new Date('2026-11-08T02:00:00Z')).end, '2026-11-07');
});

test('Central Time automatically observes daylight saving time', () => {
  assert.equal(today(new Date('2026-07-08T04:59:59Z')), '2026-07-07');
  assert.equal(today(new Date('2026-07-08T05:00:00Z')), '2026-07-08');
});

test('date navigation crosses month, leap day, and daylight saving boundaries', () => {
  assert.equal(shiftDate('2026-11-01', -1), '2026-10-31');
  assert.equal(shiftDate('2024-02-28', 1), '2024-02-29');
  assert.equal(shiftDate('2026-03-08', 1), '2026-03-09');
});
