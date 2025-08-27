import { Router } from 'express';
import { AuthService } from '../_lib/services/authService.js';
import { authenticate } from '../_lib/middleware/auth.js';
import { logger } from '../_lib/utils/logger.js';
import { CreateUserInput, LoginCredentials } from '../_lib/models/User.js';
import pool from '../_lib/db.js';

const router = Router();

// ============================================================
//   User Registration Endpoint
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Email, password, first name and last name are required' 
            });
        }

        const result = await AuthService.register({
            email,
            password,
            firstName,
            lastName
        });

        return res.status(201).json({
            message: 'User registered successfully',
            ...result
        });
    } catch (error: any) {
        logger.error('Registration error:', error);
        const status = error.message === 'Email already in use' ? 409 : 500;
        return res.status(status).json({
            error: error.message || 'Error during registration'
        });
    }
});

// ============================================================
//   Login Endpoint
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const result = await AuthService.login({ email, password });
        return res.json({
            message: 'Login successful',
            ...result
        });
    } catch (error: any) {
        logger.error('Login error:', error);
        return res.status(401).json({
            error: error.message || 'Invalid credentials'
        });
    }
});

// ============================================================
//   Refresh Token Endpoint
// ============================================================
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                error: 'Refresh token is required' 
            });
        }

        const result = await AuthService.refreshToken(refreshToken);
        return res.json(result);
    } catch (error: any) {
        logger.error('Token refresh error:', error);
        return res.status(401).json({
            error: 'Invalid or expired refresh token'
        });
    }
});

// ============================================================
//   Get Current User Endpoint
// ============================================================
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Get user data from database
        const userRes = await pool.query(
            'SELECT id, email, first_name, last_name, created_at, updated_at, last_login, is_active, email_verified FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's teams
        const teamsRes = await pool.query(
            `SELECT t.id, t.name, tm.role 
             FROM teams t
             JOIN team_members tm ON t.id = tm.team_id
             WHERE tm.user_id = $1`,
            [req.user.id]
        );

        const user = userRes.rows[0];
        const { password_hash, ...userWithoutPassword } = user;

        return res.json({
            user: {
                ...userWithoutPassword,
                teams: teamsRes.rows
            }
        });
    } catch (error) {
        logger.error('Error fetching user data:', error);
        return res.status(500).json({ 
            error: 'Error fetching user data' 
        });
    }
});

export default router;
