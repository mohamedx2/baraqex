// POST /api/auth/login - User login
export async function post(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Mock authentication - replace with actual user verification
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    };

    // In a real app, verify password against database
    if (email === 'john@example.com' && password === 'password123') {
      // Generate token (you'll need to implement JWT logic)
      const token = 'mock-jwt-token-' + Date.now();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}
