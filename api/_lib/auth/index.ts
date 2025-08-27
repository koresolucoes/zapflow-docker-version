import jwt, { SignOptions as JwtSignOptions } from 'jsonwebtoken';

// Extend SignOptions to handle our custom expiresIn type
interface CustomSignOptions extends Omit<JwtSignOptions, 'expiresIn'> {
  expiresIn?: string | number;
}
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import pool from '../db.js';

// Extend the base JwtPayload to include our custom claims
export interface JwtPayload extends jwt.JwtPayload {
  sub: string;      // Subject (user ID)
  email: string;    // User's email
  teamId?: string;  // Optional team ID
  role?: string;    // Optional user role
}

// Helper type for authenticated requests
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        teamId?: string;
        role?: string;
      };
    }
  }
}

/**
 * Generates a JWT token with the provided payload
 * @param payload The payload to include in the token
 * @param expiresIn Time until token expires (default: 1h)
 * @returns JWT token string
 */
// Define a type for the token payload that excludes JWT standard claims
type TokenPayload = Omit<JwtPayload, keyof jwt.JwtPayload> & {
  sub: string;           // Subject (user ID)
  email: string;         // User's email
  teamId?: string;       // Optional team ID
  role?: string;         // User role
  isRefreshToken?: boolean; // Flag to identify refresh tokens
};

export const generateToken = (payload: TokenPayload, expiresIn: string | number = '1h'): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  // Ensure the subject (sub) is set to the user ID
  const tokenPayload: JwtPayload = {
    ...payload,
    sub: payload.sub || payload.email, // Use email as fallback for sub if not provided
    iat: Math.floor(Date.now() / 1000), // Issued at
  };
  
  // Create options with type assertion to handle the string format
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
  };
  
  // Add expiresIn if provided
  if (expiresIn) {
    if (typeof expiresIn === 'string') {
      options.expiresIn = expiresIn as any; // Type assertion to bypass type checking
    } else {
      options.expiresIn = expiresIn;
    }
  }
  
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, options);
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token JWT token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JwtPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  try {
    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }
    
    return decoded as JwtPayload;
  } catch (error) {
    logger.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // Verify user exists in database
    const { rows } = await pool.query(
      'SELECT id, email, team_id, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.sub] // Using sub claim as user ID
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = rows[0];
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      teamId: user.team_id || decoded.teamId,
      role: user.role || decoded.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param roles Array of allowed roles
 */
/**
 * Middleware to check if user has required role(s)
 * @param roles Array of allowed roles (empty array allows any authenticated user)
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // If roles array is empty, any authenticated user can access
    if (roles.length > 0) {
      // Check if user has at least one of the required roles
      if (!req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: req.user.role || 'none'
        });
      }
    }

    next();
  };
};
