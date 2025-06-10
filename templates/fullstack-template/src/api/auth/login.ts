import { AuthService, sendSuccess, sendError, validateFields } from 'baraqex';

// Login endpoint
export async function post(req: any, res: any) {
  try {
    // Validate required fields
    const validation = validateFields(req, ['username', 'password']);
    if (!validation.valid) {
      return sendError(res, 'Missing required fields', 400, { missing: validation.missing });
    }

    const { username, password } = req.body;

    // Get auth service from server
    const authService = req.app.locals.authService as AuthService;
    if (!authService) {
      return sendError(res, 'Authentication service not available', 500);
    }

    // In a real app, you'd fetch user from database
    // This is a demo implementation
    const demoUsers = [
      {
        id: 1,
        username: 'admin',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        email: 'admin@example.com',
        roles: ['admin', 'user'],
        name: 'Administrator'
      },
      {
        id: 2,
        username: 'user',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        email: 'user@example.com',
        roles: ['user'],
        name: 'Regular User'
      }
    ];

    // Find user
    const user = demoUsers.find(u => u.username === username);
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Verify password
    const isValid = await authService.comparePasswords(password, user.password);
    if (!isValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate token
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      name: user.name
    };

    const token = authService.generateToken(userForToken);

    // Send response
    return sendSuccess(res, {
      token,
      user: userForToken,
      expiresIn: '7d'
    }, 'Login successful');

  } catch (error: any) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed', 500);
  }
}
