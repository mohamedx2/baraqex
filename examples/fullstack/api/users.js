/**
 * Users API Route
 * 
 * File: api/users.js → /api/users
 * 
 * Demonstrates:
 * - RESTful API handlers
 * - Request parsing
 * - Response helpers
 * - In-memory data store
 */

// In-memory store (use database in production)
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: '2024-01-15' },
  { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: '2024-01-16' },
];

let nextId = 3;

/**
 * GET /api/users
 * Returns all users
 */
export async function GET(req, res) {
  const { search, limit } = req.query;
  
  let result = users;
  
  // Filter by search query
  if (search) {
    result = result.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Limit results
  if (limit) {
    result = result.slice(0, parseInt(limit));
  }
  
  return res.json({
    success: true,
    data: result,
    count: result.length
  });
}

/**
 * POST /api/users
 * Creates a new user
 */
export async function POST(req, res) {
  const { name, email } = req.body;
  
  // Validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }
  
  // Check for duplicate email
  if (users.some(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      error: 'Email already exists'
    });
  }
  
  const newUser = {
    id: nextId++,
    name,
    email,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  users.push(newUser);
  
  return res.status(201).json({
    success: true,
    data: newUser
  });
}

/**
 * PUT /api/users (bulk update)
 */
export async function PUT(req, res) {
  const { ids, updates } = req.body;
  
  if (!Array.isArray(ids) || !updates) {
    return res.status(400).json({
      success: false,
      error: 'ids array and updates object are required'
    });
  }
  
  const updated = [];
  users = users.map(user => {
    if (ids.includes(user.id)) {
      const updatedUser = { ...user, ...updates, id: user.id };
      updated.push(updatedUser);
      return updatedUser;
    }
    return user;
  });
  
  return res.json({
    success: true,
    updated: updated.length,
    data: updated
  });
}

/**
 * DELETE /api/users (bulk delete)
 */
export async function DELETE(req, res) {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({
      success: false,
      error: 'ids array is required'
    });
  }
  
  const initialCount = users.length;
  users = users.filter(user => !ids.includes(user.id));
  const deleted = initialCount - users.length;
  
  return res.json({
    success: true,
    deleted
  });
}
