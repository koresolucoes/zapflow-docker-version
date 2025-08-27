import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../_lib/db.js';
import { logger } from '../_lib/utils/logger.js';
import { authenticate } from '../_lib/middleware/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger.error("JWT_SECRET environment variable is not set");
    throw new Error('JWT_SECRET environment variable is not set');
}

// ============================================================
//   Endpoint de Registro de Usuário
// ============================================================
router.post('/register', async (req, res) => {
    const { email, password, company_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
        // Verificar se o usuário já existe
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Um usuário com este email já existe.' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Iniciar transação
        await client.query('BEGIN');

        // 1. Criar o usuário
        const newUserRes = await client.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, password_hash]
        );
        const userId = newUserRes.rows[0].id;

        // 2. Criar o perfil do usuário
        const finalCompanyName = company_name || email.split('@')[0];
        await client.query(
            'INSERT INTO profiles (id, company_name) VALUES ($1, $2)',
            [userId, finalCompanyName]
        );

        // 3. Criar a equipe padrão
        const teamRes = await client.query(
            'INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING id',
            [finalCompanyName, userId]
        );
        const teamId = teamRes.rows[0].id;

        // 4. Adicionar o usuário como administrador da equipe
        await client.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
            [teamId, userId, 'admin']
        );

        // 5. Criar o pipeline padrão
        const pipelineRes = await client.query(
          'INSERT INTO pipelines (team_id, name) VALUES ($1, $2) RETURNING id',
          [teamId, 'Pipeline Padrão']
        );
        const pipelineId = pipelineRes.rows[0].id;

        // 6. Criar os estágios padrão do pipeline
        const stages = [
          { name: 'Novo', order: 1, type: 'Intermediária' },
          { name: 'Em Progresso', order: 2, type: 'Intermediária' },
          { name: 'Ganho', order: 3, type: 'Ganho' },
          { name: 'Perdido', order: 4, type: 'Perdido' },
        ];
        for (const stage of stages) {
          await client.query(
            'INSERT INTO pipeline_stages (pipeline_id, name, sort_order, type) VALUES ($1, $2, $3, $4)',
            [pipelineId, stage.name, stage.order, stage.type]
          );
        }

        // Commit da transação
        await client.query('COMMIT');

        logger.info(`Novo usuário registrado com sucesso: ${email}`);
        res.status(201).json({ message: 'Usuário registrado com sucesso.' });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Erro durante o registro do usuário:', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
});

// ============================================================
//   Endpoint de Login de Usuário
// ============================================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

        const profileRes = await pool.query('SELECT company_name, dashboard_layout FROM profiles WHERE id = $1', [user.id]);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                profile: profileRes.rows[0] || null
            }
        });

    } catch (error) {
        logger.error('Erro durante o login do usuário:', {
             error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================================================
//   Endpoint para Obter Dados do Usuário Autenticado
// ============================================================
router.get('/me', authenticate, async (req, res) => {
    if (!req.auth) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    try {
        const userId = req.auth.userId;

        // Obter dados do usuário e do perfil
        const userQuery = `
            SELECT u.id, u.email, u.created_at, p.company_name, p.dashboard_layout
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.id = $1
        `;
        const userRes = await pool.query(userQuery, [userId]);
        const user = userRes.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Obter equipes do usuário
        const teamsQuery = `
            SELECT t.id, t.name, tm.role
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = $1
        `;
        const teamsRes = await pool.query(teamsQuery, [userId]);

        res.json({ user, teams: teamsRes.rows });

    } catch (error) {
        logger.error('Erro ao buscar dados do usuário:', {
            userId: req.auth.userId,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


export default router;
