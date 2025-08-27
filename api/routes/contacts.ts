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

// GET /api/contacts - List all contacts for the team
router.get('/', async (req: any, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM contacts WHERE team_id = $1 ORDER BY created_at DESC', [req.teamId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// POST /api/contacts - Create a new contact
router.post('/', async (req: any, res) => {
    const { name, phone, email, tags, custom_fields } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO contacts (team_id, name, phone, email, tags, custom_fields) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.teamId, name, phone, email, tags, custom_fields]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// GET /api/contacts/:id - Get a single contact
router.get('/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM contacts WHERE id = $1 AND team_id = $2', [id, req.teamId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});


// PUT /api/contacts/:id - Update a contact
router.put('/:id', async (req: any, res) => {
    const { id } = req.params;
    const { name, phone, email, tags, custom_fields } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE contacts SET name = $1, phone = $2, email = $3, tags = $4, custom_fields = $5, updated_at = NOW() WHERE id = $6 AND team_id = $7 RETURNING *',
            [name, phone, email, tags, custom_fields, id, req.teamId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// DELETE /api/contacts/:id - Delete a contact
router.delete('/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM contacts WHERE id = $1 AND team_id = $2', [id, req.teamId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

export default router;
