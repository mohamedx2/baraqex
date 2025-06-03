import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export interface AuthConfig {
  secret: string;
  expiresIn?: SignOptions['expiresIn'];
}

export interface User {
  id: string | number;
  username: string;
  password?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

export class AuthService {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = {
      expiresIn: '24h',
      ...config
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(user: Omit<User, 'password'>): string {
    const options: SignOptions = {};
    
    if (this.config.expiresIn) {
      options.expiresIn = this.config.expiresIn;
    }
    
    return jwt.sign(
      { id: user.id, username: user.username, roles: user.roles || [] },
      this.config.secret,
      options
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.secret);
    } catch (error) {
      return null;
    }
  }

  // Express middleware for authentication
  initialize() {
    return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      if (token) {
        const decoded = this.verifyToken(token);
        if (decoded) {
          req.user = decoded;
        }
      }
      next();
    };
  }

  // Express middleware for requiring authentication
  requireAuth() {
    return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      return next();
    };
  }

  // Express middleware for requiring specific roles
  requireRoles(roles: string[]) {
    return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userRoles = req.user.roles || [];
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      return next();
    };
  }

  private extractToken(req: Request): string | null {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    return null;
  }
}
