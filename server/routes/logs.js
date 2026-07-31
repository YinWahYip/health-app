import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/logs — last 30 days
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM daily_logs
       ORDER BY log_date DESC
       LIMIT 30`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/:date — single day (YYYY-MM-DD)
router.get('/:date', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM daily_logs WHERE log_date = $1',
      [req.params.date]
    );
    if (!rows.length) return res.status(404).json({ error: 'No log for that date' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logs — create or update (upsert by date)
router.post('/', async (req, res) => {
  const { log_date, weight, sleep_hours, mood, water_cups, worked_out, steps, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_logs (log_date, weight, sleep_hours, mood, water_cups, worked_out, steps, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (log_date) DO UPDATE SET
         weight      = EXCLUDED.weight,
         sleep_hours = EXCLUDED.sleep_hours,
         mood        = EXCLUDED.mood,
         water_cups  = EXCLUDED.water_cups,
         worked_out  = EXCLUDED.worked_out,
         steps       = EXCLUDED.steps,
         notes       = EXCLUDED.notes,
         updated_at  = NOW()
       RETURNING *`,
      [log_date, weight, sleep_hours, mood, water_cups, worked_out, steps, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
