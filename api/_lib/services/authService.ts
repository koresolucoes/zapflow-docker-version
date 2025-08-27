import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, verifyToken } from '../auth/index.js';
import { User, CreateUserInput, LoginCredentials, AuthResponse } from '../models/User.js';
import pool from '../db.js';
import { logger } from '../utils/logger.js';

const SALT_ROUNDS = 10;

export class AuthService {
  static async register(userData: CreateUserInput): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    // Create user
    const result = await pool.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        created_at, updated_at, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true, false)
      RETURNING id, email, first_name, last_name, created_at, updated_at, is_active, email_verified, team_id, role`,
      [userId, email, hashedPassword, firstName, lastName]
    );

    const user = result.rows[0];
    
    // Generate tokens
    const token = generateToken({
      sub: user.id,
      email: user.email,
      teamId: user.team_id,
      role: user.role || 'user'
    });

    const refreshToken = generateToken({
      sub: user.id,
      email: user.email,
      teamId: user.team_id,
      role: user.role || 'user',
      isRefreshToken: true
    }, '7d');

    return {
      user,
      token,
      refreshToken
    };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = generateToken({
      sub: user.id,
      email: user.email,
      teamId: user.team_id,
      role: user.role || 'user'
    });

    const refreshToken = generateToken({
      sub: user.id,
      email: user.email,
      teamId: user.team_id,
      role: user.role || 'user',
      isRefreshToken: true
    }, '7d');

    // Remove password hash from user object
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = verifyToken(refreshToken);
      
      // Verify user exists
      const result = await pool.query(
        'SELECT id, email, team_id, role FROM users WHERE id = $1',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const user = result.rows[0];
      
      // Generate new access token
      const token = generateToken({
        sub: user.id,
        email: user.email,
        teamId: user.team_id,
        role: user.role || 'user'
      });

      return { token };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Invalid refresh token');
    }
  }
}
