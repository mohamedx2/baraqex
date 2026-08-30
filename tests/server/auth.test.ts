import { AuthService } from '../../src/server/auth';
import jwt from 'jsonwebtoken';

// Mock Express objects
const mockRequest = (headers: any = {}) => ({ headers });
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('AuthService', () => {
  let authService: AuthService;
  const testSecret = 'test-secret-key';

  beforeEach(() => {
    authService = new AuthService({ secret: testSecret });
    jest.clearAllMocks();
  });

  describe('Password hashing', () => {
    it('should hash password', async () => {
      const password = 'test-password';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(10);
    });

    it('should compare passwords correctly', async () => {
      const password = 'test-password';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.comparePasswords(password, hash);
      const isInvalid = await authService.comparePasswords('wrong-password', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Token generation and verification', () => {
    const testUser = {
      id: '123',
      username: 'testuser',
      roles: ['user']
    };

    it('should generate valid JWT token', async () => {
      const token = await authService.generateToken(testUser);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, testSecret) as any;
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.username).toBe(testUser.username);
      expect(decoded.roles).toEqual(testUser.roles);
    });

    it('should verify valid token', async () => {
      const token = await authService.generateToken(testUser);
      const decoded = await authService.verifyToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.username).toBe(testUser.username);
    });

    it('should return null for invalid token', async () => {
      const decoded = await authService.verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should use custom expiration time', async () => {
      const customAuth = new AuthService({
        secret: testSecret,
        expiresIn: '1h'
      });

      const token = await customAuth.generateToken(testUser);
      const decoded = jwt.verify(token, testSecret) as any;

      expect(decoded.exp).toBeTruthy();
    });
  });

  describe('Express middleware', () => {
    const testUser = {
      id: '123',
      username: 'testuser',
      roles: ['user']
    };

    describe('initialize middleware', () => {
      it('should add user to request when token is valid', async () => {
        const token = await authService.generateToken(testUser);
        const req: any = mockRequest({
          authorization: `Bearer ${token}`
        });
        const res = mockResponse();

        const middleware = authService.initialize();
        await middleware(req, res, mockNext);

        expect(req.user).toBeTruthy();
        expect(req.user.id).toBe(testUser.id);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should not add user when token is invalid', async () => {
        const req: any = mockRequest({
          authorization: 'Bearer invalid-token'
        });
        const res = mockResponse();

        const middleware = authService.initialize();
        await middleware(req, res, mockNext);

        expect(req.user).toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });

      it('should continue when no token provided', async () => {
        const req: any = mockRequest();
        const res = mockResponse();

        const middleware = authService.initialize();
        await middleware(req, res, mockNext);

        expect(req.user).toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('requireAuth middleware', () => {
      it('should allow authenticated requests', () => {
        const req: any = { user: testUser };
        const res = mockResponse();

        const middleware = authService.requireAuth();
        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject unauthenticated requests', () => {
        const req: any = {};
        const res = mockResponse();

        const middleware = authService.requireAuth();
        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('requireRoles middleware', () => {
      it('should allow users with required roles', () => {
        const req: any = {
          user: { ...testUser, roles: ['user', 'admin'] }
        };
        const res = mockResponse();

        const middleware = authService.requireRoles(['admin']);
        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject users without required roles', () => {
        const req: any = {
          user: { ...testUser, roles: ['user'] }
        };
        const res = mockResponse();

        const middleware = authService.requireRoles(['admin']);
        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject unauthenticated users', () => {
        const req: any = {};
        const res = mockResponse();

        const middleware = authService.requireRoles(['admin']);
        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle users without roles array', () => {
        const req: any = {
          user: { id: '123', username: 'test' }
        };
        const res = mockResponse();

        const middleware = authService.requireRoles(['admin']);
        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });
});
