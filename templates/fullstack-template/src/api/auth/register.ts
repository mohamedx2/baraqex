import { AuthService, sendSuccess, sendError, validateFields } from 'baraqex';

// Registration endpoint
export async function post(req: any, res: any) {
  try {
    // Validate required fields
    const validation = validateFields(req, ['username', 'password', 'email', 'name']);
    if (!validation.valid) {
      return sendError(res, 'Missing required fields', 400, { missing: validation.missing });
    }

    const { username, password, email, name } = req.body;

    // Basic validation
    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    if (!email.includes('@')) {
      return sendError(res, 'Invalid email format', 400);
    }

    // Get auth service
    const authService = req.app.locals.authService as AuthService;
    if (!authService) {
      return sendError(res, 'Authentication service not available', 500);
    }

    // In a real app, you'd check if user exists in database
    // For demo purposes, we'll just simulate registration
    
    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create user object (in real app, save to database)
    const newUser = {
      id: Date.now(), // In real app, this would be from database
      username,
      email,
      name,
      roles: ['user'],
      createdAt: new Date().toISOString()
    };

    // Generate token
    const token = authService.generateToken(newUser);

    // Send response
    return sendSuccess(res, {
      token,
      user: newUser,
      expiresIn: '7d'
    }, 'Registration successful');

  } catch (error: any) {
    console.error('Registration error:', error);
    return sendError(res, 'Registration failed', 500);
  }
}
