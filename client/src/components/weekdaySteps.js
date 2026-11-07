const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function averageStepsByWeekday(logs) {
  const days = WEEKDAYS.map((day) => ({ day, total: 0, count: 0 }));
  for (const log of logs) {
    if (log.steps == null || String(log.steps).trim() === '') continue;
    const steps = Number(log.steps);
    if (!Number.isFinite(steps) || steps < 0) continue;
    // A log is a calendar date. UTC parsing avoids shifting it to the prior day.
    const date = new Date(`${log.log_date.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) continue;
    const day = days[(date.getUTCDay() + 6) % 7];
    day.total += steps;
    day.count += 1;
  }
  return days.map(({ day, total, count }) => ({
    day,
    count,
    average: count ? Math.round(total / count) : null,
  }));
}
