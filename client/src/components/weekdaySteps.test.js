import test from 'node:test';
import assert from 'node:assert/strict';
import { averageStepsByWeekday } from './weekdaySteps.js';
import { DATE_RANGES, filterLogsByRange, getDateRange } from './dateRange.js';

test('averages matching weekdays, includes zero, and excludes missing or invalid steps', () => {
  const days = averageStepsByWeekday([
    { log_date: '2026-11-02', steps: '1000' },
    { log_date: '2026-10-26T00:00:00.000Z', steps: 3000 },
    { log_date: '2026-10-19', steps: 0 },
    { log_date: '2026-10-12', steps: null },
    { log_date: '2026-10-05', steps: '' },
    { log_date: '2026-09-28', steps: 'invalid' },
    { log_date: '2026-11-03', steps: 8000 },
    { log_date: '2026-11-01', steps: 7000 },
  ]);
  assert.deepEqual(days[0], { day: 'Monday', count: 3, average: 1333 });
  assert.deepEqual(days[1], { day: 'Tuesday', count: 1, average: 8000 });
  assert.deepEqual(days[2], { day: 'Wednesday', count: 0, average: null });
  assert.deepEqual(days[6], { day: 'Sunday', count: 1, average: 7000 });
});

test('empty history leaves all weekdays without an average', () => {
  const days = averageStepsByWeekday([]);
  assert.equal(days.length, 7);
  assert.ok(days.every((day) => day.average === null && day.count === 0));
});

for (const { value } of DATE_RANGES) {
  test(`${value} averages only entries inside the selected period`, () => {
    const range = getDateRange(value, new Date(Date.UTC(2026, 10, 7, 18)));
    const days = averageStepsByWeekday(filterLogsByRange([
      { log_date: '2026-11-02', steps: 2000 },
      { log_date: '2020-11-02', steps: 9000 },
      { log_date: '2026-11-09', steps: 9000 },
    ], range));
    assert.deepEqual(days[0], { day: 'Monday', count: 1, average: 2000 });
  });
}
