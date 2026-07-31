import { useState } from 'react';
import LogForm from './components/LogForm.jsx';
import Dashboard from './components/Dashboard.jsx';

const tabs = ['Log', 'Dashboard'];

const styles = {
  app: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px 0',
    fontSize: 20,
    fontWeight: 700,
    color: '#38bdf8',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    padding: '12px 20px',
    borderBottom: '1px solid #1e293b',
  },
  tab: (active) => ({
    padding: '6px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: active ? '#38bdf8' : '#1e293b',
    color: active ? '#0f172a' : '#94a3b8',
  }),
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
};

export default function App() {
  const [tab, setTab] = useState('Log');

  return (
    <div style={styles.app}>
      <div style={styles.header}>Health</div>
      <div style={styles.tabBar}>
        {tabs.map((t) => (
          <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {tab === 'Log' && <LogForm />}
        {tab === 'Dashboard' && <Dashboard />}
      </div>
    </div>
  );
}
