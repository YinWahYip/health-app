import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';

const SLEEP_MIN  = 6;
const SLEEP_MAX  = 9;
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

  useEffect(() => {
    fetch('/api/logs')
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  if (!logs.length) return <p style={{ color: '#94a3b8' }}>No data yet — start logging!</p>;

  const chartData = [...logs].reverse().map((r) => ({
    date: r.log_date.slice(5), // MM-DD
    weight: r.weight ? parseFloat(r.weight) : null,
    sleep: r.sleep_hours ? parseFloat(r.sleep_hours) : null,
    mood: r.mood,
    water: r.water_cups,
  }));

  const workoutDays = logs.filter((r) => r.worked_out).length;

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

      <div style={card}>
        <div style={label}>Weight (lbs)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
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
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[1, 5]} ticks={[1,2,3,4,5]} />
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
            <span style={{ color: '#94a3b8' }}>{r.log_date}</span>
            <span>{r.weight ? `${r.weight} lbs` : '—'}</span>
            <span>{r.sleep_hours ? `${r.sleep_hours}h` : '—'}</span>
            <span>{r.mood ? MOOD_LABELS[r.mood] : '—'}</span>
            <span>{r.worked_out ? '🏋️' : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
