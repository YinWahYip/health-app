import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
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

const MOOD_LABELS = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const LBS_TO_KG = 0.453592;

// Height: 5'10" = 70 inches
const HEIGHT_IN = 70;

const BMI_RANGES = [
  { label: 'Underweight', max: 18.5, color: '#60a5fa' },
  { label: 'Normal', max: 25, color: '#4ade80' },
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

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState('kg');

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
    if (lbs == null) return null;
    const val = weightUnit === 'kg' ? parseFloat(lbs) * LBS_TO_KG : parseFloat(lbs);
    return parseFloat(val.toFixed(1));
  };

  const chartData = [...logs].reverse().map((r) => ({
    date: (() => { const [y, m, d] = r.log_date.slice(0, 10).split('-'); return `${m}/${d}/${y}`; })(),
    weight: toDisplayWeight(r.weight),
    sleep: r.sleep_hours ? parseFloat(r.sleep_hours) : null,
    mood: r.mood,
    water: r.water_cups,
  }));

  const workoutDays = logs.filter((r) => r.worked_out).length;
  const latestWeight = logs.find((r) => r.weight)?.weight;
  const currentBMI = calcBMI(latestWeight);
  const bmiCategory = currentBMI ? getBMICategory(parseFloat(currentBMI)) : null;

  // BMI scale: clamp display between 15–40
  const bmiPos = currentBMI
    ? Math.min(Math.max(((parseFloat(currentBMI) - 15) / 25) * 100, 0), 100)
    : null;

  return (
    <div>
      <div style={statRow}>
        <div style={stat}>
          <div style={statVal}>{avg(logs, 'sleep_hours')}</div>
          <div style={statLbl}>Avg Sleep (hrs)</div>
        </div>
        <div style={stat}>
          <div style={statVal}>{avg(logs, 'mood')}</div>
          <div style={statLbl}>Avg Mood</div>
        </div>
        <div style={stat}>
          <div style={statVal}>{workoutDays}</div>
          <div style={statLbl}>Workouts</div>
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
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['auto', 'auto']} unit={weightUnit === 'kg' ? 'k' : ''} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} formatter={(v) => [`${v} ${weightUnit}`]} />
            <Line type="monotone" dataKey="weight" stroke="#38bdf8" dot={false} strokeWidth={2} connectNulls />
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
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 12]} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
            {/* Ideal range shading */}
            <ReferenceArea y1={SLEEP_MIN} y2={SLEEP_MAX} fill="#1e3a2f" fillOpacity={0.6} />
            {/* Goal line */}
            <ReferenceLine y={SLEEP_GOAL} stroke="#86efac" strokeDasharray="4 3" strokeWidth={1.5} />
            <Line type="monotone" dataKey="sleep" stroke="#a78bfa" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={label}>Mood</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
            <Line type="monotone" dataKey="mood" stroke="#4ade80" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={label}>Recent logs</div>
        {logs.slice(0, 7).map((r) => (
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
            <span>{r.mood ? MOOD_LABELS[r.mood] : '—'}</span>
            <span>{r.worked_out ? '🏋️' : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
