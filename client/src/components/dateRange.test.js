import test from 'node:test';
import assert from 'node:assert/strict';
import { filterLogsByRange, getDateRange } from './dateRange.js';

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
