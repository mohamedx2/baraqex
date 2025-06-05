

export interface AuthConfig {
  secret: string;
  expiresIn?: string | number;
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
    try {
      const bcrypt = await import('bcryptjs');
      return bcrypt.hash(password, 10);
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('bcryptjs not installed. Run: npm install bcryptjs @types/bcryptjs');
      }
      throw error;
    }
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const bcrypt = await import('bcryptjs');
      return bcrypt.compare(password, hashedPassword);
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('bcryptjs not installed. Run: npm install bcryptjs @types/bcryptjs');
      }
      throw error;
    }
  }

  generateToken(user: Omit<User, 'password'>): string {
    try {
      const jwt = require('jsonwebtoken');
      const options: any = {};
      
      if (this.config.expiresIn) {
        options.expiresIn = this.config.expiresIn;
      }
      
      return jwt.sign(
        { id: user.id, username: user.username, roles: user.roles || [] },
        this.config.secret,
        options
      );
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('jsonwebtoken not installed. Run: npm install jsonwebtoken @types/jsonwebtoken');
      }
      throw error;
    }
  }

  verifyToken(token: string): any {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.verify(token, this.config.secret);
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('jsonwebtoken not installed. Run: npm install jsonwebtoken @types/jsonwebtoken');
      }
      return null;
    }
  }

  // Express middleware for authentication
  initialize() {
    return (req: any, res: any, next: any) => {
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
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      return next();
    };
  }

  // Express middleware for requiring specific roles
  requireRoles(roles: string[]) {
    return (req: any, res: any, next: any) => {
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

  private extractToken(req: any): string | null {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    return null;
  }
}
