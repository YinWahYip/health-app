import { useState, useEffect, useCallback, useRef } from 'react';

const BARREL_ROLL_CSS = `
@keyframes barrelRoll {
  0%   { transform: rotate(0deg) scale(1); }
  30%  { transform: rotate(180deg) scale(1.08); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes popOut {
  0%   { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(0.5); }
  60%  { opacity: 1; transform: translate(calc(var(--dx) * 2.5), calc(var(--dy) * 2.5)) scale(1.2); }
  100% { opacity: 0; transform: translate(calc(var(--dx) * 3.5), calc(var(--dy) * 3.5)) scale(0.8); }
}
.barrel-roll { animation: barrelRoll 0.55s cubic-bezier(.36,.07,.19,.97) both; }
.confetti-piece {
  position: absolute;
  pointer-events: none;
  font-size: 18px;
  animation: popOut 0.65s ease-out forwards;
}
`;

const today = () => new Date().toISOString().split('T')[0];

const KG_TO_LBS = 2.20462;

const field = {
  label: { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: '#1e293b',
    color: '#f1f5f9',
    fontSize: 16,
    marginBottom: 16,
  },
  
  row: { display: 'flex', gap: 12 },
  half: { flex: 1 },
  unitToggle: (active) => ({
    padding: '3px 8px',
    borderRadius: 6,
    border: 'none',
    background: active ? '#38bdf8' : 'transparent',
    color: active ? '#0f172a' : '#64748b',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  }),
  moodBtn: (active) => ({
    flex: 1,
    padding: '10px 4px',
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: active ? '#38bdf8' : '#1e293b',
    color: active ? '#0f172a' : '#94a3b8',
    fontWeight: 700,
    fontSize: 11,
    cursor: 'pointer',
    lineHeight: 1.3,
    textAlign: 'center',
  }),
  workoutBtn: (active) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: active ? '#4ade80' : '#df0529',
    color: active ? '#0f172a' : '#000000',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginBottom: 16,
  }),
  submit: {
    width: '100%',
    padding: '14px',
    borderRadius: 8,
    border: 'none',
    background: '#38bdf8',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    marginTop: 4,
  },
  status: (ok) => ({
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: ok ? '#166534' : '#7f1d1d',
    color: ok ? '#bbf7d0' : '#fecaca',
    fontSize: 14,
    textAlign: 'center',
  }),
};

export default function LogForm() {
  const [form, setForm] = useState({
    log_date: today(),
    weight: '',
    sleep_hours: '',
    mood: '',
    water_cups: '',
    worked_out: false,
    steps: '',
    notes: '',
  });
  const [weightUnit, setWeightUnit] = useState('lbs'); // 'lbs' | 'kg'
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const EMPTY_FORM = (date) => ({
    log_date: date,
    weight: '',
    sleep_hours: '',
    mood: '',
    water_cups: '',
    worked_out: false,
    steps: '',
    notes: '',
  });

  const loadDate = useCallback(async (date) => {
    try {
      const res = await fetch(`/api/logs/${date}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          log_date: date,
          weight: data.weight ?? '',
          sleep_hours: data.sleep_hours ?? '',
          mood: data.mood ?? '',
          water_cups: data.water_cups ?? '',
          worked_out: data.worked_out ?? false,
          steps: data.steps ?? '',
          notes: data.notes ?? '',
        });
        setIsEditing(true);
      } else {
        setForm(EMPTY_FORM(date));
        setIsEditing(false);
      }
    } catch {
      setForm(EMPTY_FORM(date));
      setIsEditing(false);
    }
  }, []);

  // Load today's log on mount
  useEffect(() => { loadDate(today()); }, [loadDate]);
  const [rolling, setRolling] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const workoutBtnRef = useRef(null);

  const EMOJIS = ['🏋️', '💪', '🔥', '⚡', '🎉', '✨', '💥'];

  const triggerCelebration = () => {
    setRolling(true);
    setTimeout(() => setRolling(false), 600);
    const pieces = Array.from({ length: 7 }, (_, i) => ({
      id: Date.now() + i,
      emoji: EMOJIS[i % EMOJIS.length],
      dx: Math.round((Math.random() - 0.5) * 80),
      dy: Math.round(-30 - Math.random() * 60),
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 700);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Always store weight in lbs
    const weightInLbs = form.weight
      ? weightUnit === 'kg'
        ? (parseFloat(form.weight) * KG_TO_LBS).toFixed(1)
        : form.weight
      : null;

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weight: weightInLbs,
          sleep_hours: form.sleep_hours || null,
          mood: form.mood || null,
          water_cups: form.water_cups || null,
          steps: form.steps || null,
        }),
      });
      if (!res.ok) throw new Error();
      setIsEditing(true);
      setStatus('ok');
    } catch {
      setStatus('err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <style>{BARREL_ROLL_CSS}</style>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={field.label}>Date</label>
          {isEditing && (
            <span style={{ fontSize: 11, background: '#854d0e', color: '#fef08a', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
              Editing existing
            </span>
          )}
        </div>
        <input
          type="date"
          style={field.input}
          value={form.log_date}
          onChange={(e) => loadDate(e.target.value)}
          required
        />
      </div>

      <div style={field.row}>
        <div style={field.half}>
          {/* Weight label with inline unit toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 22,
            marginBottom: 4
          }}>
            <span style={field.label}>Weight</span>
            <div style={{
              display: 'flex',
              background: '#1e293b',
              borderRadius: 6,
              padding: 2
            }}>
              <button type="button" style={field.unitToggle(weightUnit === 'lbs')}
                onClick={() => setWeightUnit('lbs')}>lbs</button>
              <button type="button" style={field.unitToggle(weightUnit === 'kg')}
                onClick={() => setWeightUnit('kg')}>kg</button>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            placeholder="—"
            style={field.input}
            value={form.weight}
            onChange={(e) => set('weight', e.target.value)}
          />
        </div>
        <div style={field.half}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: 22,
            marginBottom: 4
          }}>
            <span style={field.label}>Sleep (hrs)</span>
          </div>
          <input
            type="number"
            step="0.5"
            placeholder="—"
            style={field.input}
            value={form.sleep_hours}
            onChange={(e) => set('sleep_hours', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label style={field.label}>Steps</label>
        <input
          type="number"
          placeholder="-"
          style={field.input}
          value={form.steps}
          onChange={(e) => set('steps', e.target.value)}
        />
      </div>

      <div>
        <label style={field.label}>Mood</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { value: 1, emoji: '😞', label: 'Rough' },
            { value: 2, emoji: '😕', label: 'Meh' },
            { value: 3, emoji: '😐', label: 'Okay' },
            { value: 4, emoji: '🙂', label: 'Good' },
            { value: 5, emoji: '😄', label: 'Great' },
          ].map(({ value, emoji, label }) => (
            <button
              type="button"
              key={value}
              style={field.moodBtn(form.mood === value)}
              onClick={() => set('mood', value)}
            >
              <div style={{ fontSize: 20 }}>{emoji}</div>
              <div>{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginBottom: 4
        }}>
          <span style={field.label}>Water</span>
          <span style={{ fontSize: 11, color: '#475569' }}>bottles · 24 oz / 710 ml each</span>
        </div>
        <input
          type="number"
          step="0.5"
          placeholder="Based on Owala Bottle"
          style={field.input}
          value={form.water_cups}
          onChange={(e) => set('water_cups', e.target.value)}
        />
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          ref={workoutBtnRef}
          type="button"
          className={rolling ? 'barrel-roll' : ''}
          style={{ ...field.workoutBtn(form.worked_out), marginBottom: 0 }}
          onClick={() => {
            const next = !form.worked_out;
            set('worked_out', next);
            if (next) triggerCelebration();
          }}
        >
          {form.worked_out ? '💪 Worked out!' : 'Did not work out'}
        </button>
        {confetti.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, left: '50%', top: '50%' }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div>
        <label style={field.label}>Notes</label>
        <textarea
          placeholder="Anything else..."
          rows={3}
          style={{ ...field.input, resize: 'vertical' }}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <button type="submit" style={field.submit} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>

      {status && (
        <div style={field.status(status === 'ok')}>
          {status === 'ok' ? 'Saved!' : 'Something went wrong. Check the server.'}
        </div>
      )}
    </form>
  );
}
