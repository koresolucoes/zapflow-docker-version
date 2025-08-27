import { Router } from 'express';
import pool from '../_lib/db.js';
import { authenticate } from '../_lib/middleware/auth.js';

const router = Router();

// Middleware to get team_id from user
const getTeamId = async (req: any, res: any, next: any) => {
    try {
        const result = await pool.query('SELECT id FROM teams WHERE owner_id = $1 LIMIT 1', [req.auth.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found for user' });
        }
        req.teamId = result.rows[0].id;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
};

router.use(authenticate);
router.use(getTeamId);

// GET /api/webhook-logs - List the last 50 webhook logs for the team
router.get('/', async (req: any, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM webhook_logs WHERE team_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.teamId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
});

export default router;
