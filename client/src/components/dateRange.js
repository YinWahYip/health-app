export const DATE_RANGES = [
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', months: 1 },
  { value: 'quarter', label: '3 months', months: 3 },
  { value: 'year', label: 'Year', months: 12 },
];

// Use local calendar dates, rather than UTC timestamps, to match daily logs.
export function getDateRange(value, now = new Date()) {
  const range = DATE_RANGES.find((option) => option.value === value);
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const start = new Date(end);

  if (range.days) {
    start.setUTCDate(start.getUTCDate() - range.days + 1);
  } else {
    // Clamp month-end dates (e.g. March 31 -> February 28), then include
    // today in the rolling period without counting the first day twice.
    const day = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - range.months);
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(day, lastDay) + 1);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function filterLogsByRange(logs, { start, end }) {
  return logs.filter((log) => {
    const date = log.log_date.slice(0, 10);
    return date >= start && date <= end;
  });
}
