import test from 'node:test';
import assert from 'node:assert/strict';
import { DATE_RANGES, fillDateRange, filterLogsByRange, getDateRange } from './dateRange.js';

test('week includes today and the six preceding calendar days', () => {
  assert.deepEqual(getDateRange('week', new Date(2026, 10, 7)), {
    start: '2026-11-01', end: '2026-11-07',
  });
});

test('month and three-month periods cross year boundaries', () => {
  const today = new Date(2026, 0, 7);
  assert.deepEqual(getDateRange('month', today), {
    start: '2025-12-08', end: '2026-01-07',
  });
  assert.deepEqual(getDateRange('quarter', today), {
    start: '2025-10-08', end: '2026-01-07',
  });
});

test('calendar subtraction clamps month ends and leap days', () => {
  assert.deepEqual(getDateRange('month', new Date(2026, 2, 31)), {
    start: '2026-03-01', end: '2026-03-31',
  });
  assert.deepEqual(getDateRange('year', new Date(2024, 1, 29)), {
    start: '2023-03-01', end: '2024-02-29',
  });
});

test('filter includes both boundaries, excludes older and future logs, and preserves order', () => {
  const logs = [
    { log_date: '2026-11-08' },
    { log_date: '2026-11-07T00:00:00.000Z' },
    { log_date: '2026-11-01' },
    { log_date: '2026-10-31' },
  ];
  const range = getDateRange('week', new Date(2026, 10, 7));
  assert.deepEqual(filterLogsByRange(logs, range), logs.slice(1, 3));
  assert.deepEqual(filterLogsByRange([logs[3]], range), []);
});

for (const { value } of DATE_RANGES) {
  test(`${value} preserves missing days and missing metrics between recorded points`, () => {
    const range = getDateRange(value, new Date(2026, 10, 7));
    const logs = [
      { log_date: '2026-11-07', weight: 78, steps: 0 },
      { log_date: '2026-11-05', sleep_hours: 8 },
      { log_date: '2026-11-03T00:00:00.000Z', weight: 74 },
    ];
    const days = fillDateRange(logs, range);
    assert.equal(days[0].log_date.slice(0, 10), range.start);
    assert.equal(days.at(-1).log_date, range.end);
    assert.equal(days.length, (Date.parse(range.end) - Date.parse(range.start)) / 86400000 + 1);
    assert.deepEqual(days.slice(-5).map((day) => day.weight ?? null), [74, null, null, null, 78]);
    assert.equal(days.at(-1).steps, 0);
    assert.equal(days.at(-3).sleep_hours, 8);
  });
}
