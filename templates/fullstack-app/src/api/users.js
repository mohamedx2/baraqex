// GET /api/users - Get all users
export async function get(req, res) {
  try {
    // Mock data - replace with actual database query
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
    ];

    const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
    const total = users.length;
    const paginatedUsers = users.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
}

// POST /api/users - Create a new user
export async function post(req, res) {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Mock user creation - replace with actual database logic
    const newUser = {
      id: Date.now(),
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
}

// Middleware for this route
export const middleware = [
  // Add authentication middleware here if needed
  // auth.requireAuth(),
  // Add pagination middleware
  (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    
    req.pagination = { page, limit, skip };
    next();
  }
];
