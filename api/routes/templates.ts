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

// GET /api/templates - List all templates for the team
router.get('/', async (req: any, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM message_templates WHERE team_id = $1 ORDER BY created_at DESC',
            [req.teamId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// POST /api/templates - Create a new template
router.post('/', async (req: any, res) => {
    const { template_name, content, category, components, meta_id, status } = req.body;
    if (!template_name || !content || !category) {
        return res.status(400).json({ error: 'template_name, content, and category are required' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO message_templates (team_id, template_name, content, category, components, meta_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.teamId, template_name, content, category, components || [], meta_id, status || 'PENDING']
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Failed to create template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM message_templates WHERE id = $1 AND team_id = $2', [id, req.teamId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
