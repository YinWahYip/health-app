import { useEffect, useState } from 'react';
import { DATE_RANGES, fillDateRange, filterLogsByRange, getDateRange } from './dateRange.js';
import { averageStepsByWeekday } from './weekdaySteps.js';
import {
  LineChart, Line, BarChart, Bar, LabelList, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea,
}
  from 'recharts';

const SLEEP_MIN = 6;
const SLEEP_MAX = 9;
const SLEEP_GOAL = 8;

const card = {
  background: '#1e293b',
  borderRadius: 12,
  padding: '16px',
  marginBottom: 20,
};

const label = {
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 8,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const statRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 20,
};

const stat = {
  flex: 1,
  background: '#1e293b',
  borderRadius: 12,
  padding: '14px 12px',
  textAlign: 'center',
};

const statVal = {
  fontSize: 24,
  fontWeight: 700,
  color: '#38bdf8',
};

const statLbl = {
  fontSize: 12,
  color: '#94a3b8',
  marginTop: 2,
};

const LBS_TO_KG = 0.453592;

// Height: 5'10" = 70 inches
const HEIGHT_IN = 70;

const BMI_RANGES = [
  { label: 'Underweight', max: 18.5, color: '#60a5fa' },
  { label: 'Healthy', max: 25, color: '#4ade80' },
  { label: 'Overweight', max: 30, color: '#fbbf24' },
  { label: 'Obese', max: 999, color: '#f87171' },
];

function calcBMI(weightLbs) {
  if (!weightLbs) return null;
  return ((parseFloat(weightLbs) * 703) / (HEIGHT_IN * HEIGHT_IN)).toFixed(1);
}

function getBMICategory(bmi) {
  return BMI_RANGES.find((r) => bmi < r.max) || BMI_RANGES[3];
}

const unitToggle = (active) => ({
  padding: '3px 8px',
  borderRadius: 6,
  border: 'none',
  background: active ? '#38bdf8' : 'transparent',
  color: active ? '#0f172a' : '#64748b',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
});

function avg(arr, key) {
  const vals = arr.map((r) => r[key]).filter((v) => v != null);
  if (!vals.length) return '—';
  return (vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length).toFixed(1);
}

function streak(logs) {
  // logs sorted newest first
  let count = 0;
  let d = new Date();
  for (const log of logs) {
    const logD = new Date(log.log_date);
    const diff = Math.round((d - logD) / 86400000);
    if (diff > 1) break;
    if (log.worked_out) count++;
    d = logD;
  }
  return count;
}

function walkingStreak(logs) {
  // logs sorted newest first
  let count = 0;
  let d = new Date();
  for (const log of logs) {
    const logD = new Date(log.log_date);
    const diff = Math.round((d - logD) / 86400000);
    if (diff > 1) break;
    if (log.minutes_walked && parseInt(log.minutes_walked) > 0) count++;
    d = logD;
  }
  return count;
}

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetch('/api/logs')
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  if (!logs.length)
    return <p style={{ color: '#94a3b8' }}>No data yet — start logging!</p>;

  const toDisplayWeight = (lbs) => {
    if (lbs == null || lbs === '') return null;
    const val = weightUnit === 'kg' ? parseFloat(lbs) * LBS_TO_KG : parseFloat(lbs);
    return parseFloat(val.toFixed(1));
  };

  const filledLogs = logs.filter((r) =>
    r.weight || r.sleep_hours || (r.steps != null && r.steps !== '') || r.minutes_walked || r.screen_time || r.water_cups || r.worked_out
  );
  const selectedRange = getDateRange(dateRange);
  const rangeLogs = filterLogsByRange(filledLogs, selectedRange);
  const weekdaySteps = averageStepsByWeekday(rangeLogs);
  const formatDate = (date) => {
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year}`;
  };

  const chartData = fillDateRange(rangeLogs, selectedRange).map((r) => ({
    date: r.log_date.slice(0, 10),
    weight: toDisplayWeight(r.weight),
    sleep: r.sleep_hours != null && r.sleep_hours !== '' ? parseFloat(r.sleep_hours) : null,
    steps: r.steps != null && r.steps !== '' ? parseInt(r.steps) : null,
    calories: (r.minutes_walked != null && r.minutes_walked !== '' && r.weight)
      ? Math.round(3.5 * (parseFloat(r.weight) * 0.453592) * (parseInt(r.minutes_walked) / 60))
      : null,
    water: r.water_cups,
  }));

  const workoutDays = rangeLogs.filter((r) => r.worked_out).length;
  const walkStreak = walkingStreak(filledLogs);
  const latestWeight = filledLogs.find((r) => r.weight)?.weight;

  // Calories via MET formula: MET × weight_kg × hours_walked
  // MET 3.5 = casual walking pace
  function calcCalories(minutesWalked, weightLbs) {
    if (!minutesWalked || !weightLbs) return null;
    const weightKg = parseFloat(weightLbs) * 0.453592;
    const hours = parseInt(minutesWalked) / 60;
    return Math.round(3.5 * weightKg * hours);
  }
  const todayLog = filledLogs[0]; // most recent
  const todayCalories = calcCalories(todayLog?.minutes_walked, todayLog?.weight);
  const currentBMI = calcBMI(latestWeight);
  const bmiCategory = currentBMI ? getBMICategory(parseFloat(currentBMI)) : null;

  // BMI scale: clamp display between 15–40
  const bmiPos = currentBMI
    ? Math.min(Math.max(((parseFloat(currentBMI) - 15) / 25) * 100, 0), 100)
    : null;

  return (
    <div>
      <div style={{
        ...card,
        position: 'sticky',
        top: 'max(8px, env(safe-area-inset-top))',
        zIndex: 20,
        padding: 12,
        border: '1px solid #334155',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      }}>
        <div id="date-range-label" style={label}>Past period</div>
        <div role="group" aria-labelledby="date-range-label" style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 8, padding: 4 }}>
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              aria-pressed={dateRange === range.value}
              onClick={() => setDateRange(range.value)}
              style={{ ...unitToggle(dateRange === range.value), flex: 1, minHeight: 36, color: dateRange === range.value ? '#0f172a' : '#94a3b8' }}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div aria-live="polite" style={{ ...statLbl, marginTop: 10 }}>
          {formatDate(selectedRange.start)} – {formatDate(selectedRange.end)} · CT · {rangeLogs.length} logged days
        </div>
      </div>
      <div style={statRow}>
        <div style={stat}>
          <div style={statVal}>{avg(rangeLogs, 'sleep_hours')}</div>
          <div style={statLbl}>Avg Sleep (hrs)</div>
        </div>
        <div style={stat}>
          <div style={statVal}>{workoutDays}</div>
          <div style={statLbl}>Workouts</div>
        </div>
        <div style={stat}>
          <div style={statVal}>{todayCalories ?? '—'}</div>
          <div style={statLbl}>Cal (today)</div>
        </div>
        <div style={stat}>
          <div style={statVal}>{walkStreak > 0 ? `${walkStreak}🔥` : '—'}</div>
          <div style={statLbl}>Walk streak</div>
        </div>
      </div>

      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={label}>Screen Time <span style={{ color: '#475569', fontSize: 11, fontWeight: 400, textTransform: 'none' }}>· today</span></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#38bdf8' }}>{todayLog?.screen_time ?? '—'}</span>
          {todayLog?.screen_time && <span style={{ fontSize: 13, color: '#64748b' }}>hrs</span>}
        </div>
      </div>

      {currentBMI && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={label}>BMI <span style={{ color: '#475569', fontSize: 11, fontWeight: 400, textTransform: 'none' }}>· 5′10″</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: bmiCategory.color }}>{currentBMI}</span>
              <span style={{ fontSize: 13, color: bmiCategory.color, fontWeight: 600 }}>{bmiCategory.label}</span>
            </div>
          </div>

          {/* BMI scale bar */}
          <div style={{ position: 'relative', height: 10, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 6 }}>
            <div style={{ flex: 18.5 - 15, background: '#60a5fa', borderRadius: '4px 0 0 4px' }} />
            <div style={{ flex: 25 - 18.5, background: '#4ade80', outline: '2px solid #0f172a' }} />
            <div style={{ flex: 30 - 25, background: '#fbbf24', outline: '2px solid #0f172a' }} />
            <div style={{ flex: 40 - 30, background: '#f87171', borderRadius: '0 4px 4px 0', outline: '2px solid #0f172a' }} />
          </div>
          {/* Marker */}
          <div style={{ position: 'relative', height: 12, marginBottom: 8 }}>
            <div style={{
              position: 'absolute',
              left: `${bmiPos}%`,
              transform: 'translateX(-50%)',
              width: 2,
              height: 12,
              background: '#f1f5f9',
              borderRadius: 1,
            }} />
          </div>

          {/* Range labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
            {BMI_RANGES.map((r) => (
              <span key={r.label} style={{ color: r.color }}>{r.label}</span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginTop: 2 }}>
            <span>15</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>40</span>
          </div>
        </div>
      )}

      {!rangeLogs.length && (
        <p role="status" style={{ color: '#94a3b8' }}>No data for this period. Select a longer range or add a log.</p>
      )}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Weight</div>
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: 6, padding: 2 }}>
            <button style={unitToggle(weightUnit === 'kg')} onClick={() => setWeightUnit('kg')}>kg</button>
            <button style={unitToggle(weightUnit === 'lbs')} onClick={() => setWeightUnit('lbs')}>lbs</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{
              fill: '#64748b',
              fontSize: 11
            }} domain={['auto', 'auto']}
            />
            <Tooltip labelFormatter={formatDate} contentStyle={{ background: '#0f172a', border: 'none' }} formatter={(v) => [`${v} ${weightUnit}`]} />
            <Line type="linear" dataKey="weight" stroke="#38bdf8" dot={{ r: 2 }} strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>



      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Steps</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>avg {avg(rangeLogs, 'steps').toLocaleString?.() ?? avg(rangeLogs, 'steps')} / day</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip labelFormatter={formatDate} contentStyle={{ background: '#0f172a', border: 'none' }} formatter={(v) => [`${v.toLocaleString()} steps`]} />
            <Line type="linear" dataKey="steps" stroke="#fb923c" dot={{ r: 2 }} strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={label}>Average steps by weekday</div>
        <div style={{ ...statLbl, marginBottom: 16 }}>Selected period · only days with recorded steps</div>
        {weekdaySteps.some((day) => day.count > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weekdaySteps} margin={{ top: 24, right: 4, left: -12, bottom: 0 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(day) => day.slice(0, 3)} interval={0} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#334155', fillOpacity: 0.4 }}
                contentStyle={{ background: '#0f172a', border: 'none', color: '#f1f5f9' }}
                labelFormatter={(day, entries) => {
                  const count = entries?.[0]?.payload?.count;
                  return `${day} · ${count ?? 0} recorded ${count === 1 ? 'day' : 'days'}`;
                }}
                formatter={(value) => [`${value.toLocaleString()} steps`, 'Average']}
              />
              <Bar dataKey="average" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={36}>
                <LabelList dataKey="average" position="top" fill="#cbd5e1" fontSize={10} formatter={(value) => value == null ? '' : value.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No step entries in this period.</p>
        )}
        <div style={{ ...statLbl, marginTop: 8 }}>Unrecorded weekdays stay blank. Recorded zeroes count toward the average.</div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Calories Burned</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>walking · MET 3.5</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip labelFormatter={formatDate} contentStyle={{ background: '#0f172a', border: 'none' }} formatter={(v) => [`${v} kcal`]} />
            <Line type="linear" dataKey="calories" stroke="#f472b6" dot={{ r: 2 }} strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Sleep (hrs)</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
            <span><span style={{ color: '#86efac' }}>―</span> Goal {SLEEP_GOAL}h</span>
            <span><span style={{ color: '#334155' }}>▭</span> Range {SLEEP_MIN}–{SLEEP_MAX}h</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 12]} />
            <Tooltip labelFormatter={formatDate} contentStyle={{ background: '#0f172a', border: 'none' }} />
            {/* Ideal range shading */}
            <ReferenceArea y1={SLEEP_MIN} y2={SLEEP_MAX} fill="#1e3a2f" fillOpacity={0.6} />
            {/* Goal line */}
            <ReferenceLine y={SLEEP_GOAL} stroke="#86efac" strokeDasharray="4 3" strokeWidth={1.5} />
            <Line type="linear" dataKey="sleep" stroke="#a78bfa" dot={{ r: 2 }} strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={label}>Recent logs</div>
        {rangeLogs.slice(0, 7).map((r) => (
          <div
            key={r.log_date}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #0f172a',
              fontSize: 14,
            }}
          >
            <span style={{ color: '#94a3b8' }}>{(() => { const [y, m, d] = r.log_date.slice(0, 10).split('-'); return `${m}/${d}/${y}`; })()}</span>
            <span>{r.weight ? `${toDisplayWeight(r.weight)} ${weightUnit}` : '—'}</span>
            <span>{r.sleep_hours ? `${r.sleep_hours}h` : '—'}</span>
            <span>{r.steps ? r.steps.toLocaleString() : '—'}</span>
            <span>{r.worked_out ? '🏋️' : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
