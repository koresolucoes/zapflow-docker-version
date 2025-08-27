import { Router } from 'express';
import pool from '../_lib/db.js';
import { authenticate } from '../_lib/middleware/auth.js';

const router = Router();

// Middleware to get team_id from user
const getTeamId = async (req: any, res: any, next: any) => {
    try {
        // This assumes a user is the owner of a single team for simplicity.
        // A more complex setup might involve checking team membership from a different table.
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

// GET /api/campaigns - List all campaigns for the team
router.get('/', async (req: any, res) => {
    try {
        // This query will also need to fetch metrics later. For now, just the campaigns.
        const { rows } = await pool.query('SELECT * FROM campaigns WHERE team_id = $1 ORDER BY created_at DESC', [req.teamId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// POST /api/campaigns - Create a new campaign
router.post('/', async (req: any, res) => {
    const { name, message_template_id, status, sent_at, messages } = req.body;

    if (!name || !message_template_id || !messages) {
        return res.status(400).json({ error: 'Name, message_template_id, and messages are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const campaignPayload = {
            name,
            team_id: req.teamId,
            message_template_id,
            status: status || 'Draft',
            sent_at: sent_at || (status === 'Sent' ? new Date().toISOString() : null),
            recipient_count: messages.length,
        };

        const campaignResult = await client.query(
            'INSERT INTO campaigns (name, team_id, message_template_id, status, sent_at, recipient_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [campaignPayload.name, campaignPayload.team_id, campaignPayload.message_template_id, campaignPayload.status, campaignPayload.sent_at, campaignPayload.recipient_count]
        );
        const newCampaign = campaignResult.rows[0];

        if (messages.length > 0) {
            const messageValues = messages.map((msg: any) =>
                `('${newCampaign.id}', '${req.teamId}', '${msg.contact_id}', '${msg.content}', '${msg.status || 'pending'}', '${msg.source || 'campaign'}', '${msg.type || 'outbound'}')`
            ).join(',');

            const messageQuery = `INSERT INTO messages (campaign_id, team_id, contact_id, content, status, source, type) VALUES ${messageValues}`;
            await client.query(messageQuery);
        }

        await client.query('COMMIT');
        res.status(201).json(newCampaign);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to create campaign:', error)
        res.status(500).json({ error: 'Failed to create campaign' });
    } finally {
        client.release();
    }
});

// GET /api/campaigns/:id - Get a single campaign with details
router.get('/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const campaignRes = await pool.query('SELECT * FROM campaigns WHERE id = $1 AND team_id = $2', [id, req.teamId]);
        if (campaignRes.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const campaign = campaignRes.rows[0];

        const messagesRes = await pool.query('SELECT * FROM messages WHERE campaign_id = $1 AND team_id = $2', [id, req.teamId]);
        const templateRes = await pool.query('SELECT * FROM message_templates WHERE id = $1', [campaign.message_template_id]);

        // Basic metrics calculation
        const metrics = {
            sent: messagesRes.rows.filter(d => d.status !== 'failed' && d.status !== 'pending').length,
            delivered: messagesRes.rows.filter(d => d.status === 'delivered' || d.status === 'read').length,
            read: messagesRes.rows.filter(d => d.status === 'read').length,
            failed: messagesRes.rows.filter(d => d.status === 'failed').length
        };

        const response = {
            ...campaign,
            messages: messagesRes.rows,
            message_templates: templateRes.rows[0] || null,
            metrics
        };

        res.json(response);
    } catch (error) {
        console.error('Failed to fetch campaign details:', error)
        res.status(500).json({ error: 'Failed to fetch campaign details' });
    }
});

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', async (req: any, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Messages are deleted automatically by ON DELETE CASCADE constraint
        const result = await client.query('DELETE FROM campaigns WHERE id = $1 AND team_id = $2', [id, req.teamId]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Campaign not found' });
        }
        await client.query('COMMIT');
        res.status(204).send();
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to delete campaign' });
    } finally {
        client.release();
    }
});

export default router;
