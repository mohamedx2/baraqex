/**
 * Dynamic User Route
 * 
 * File: api/users/[id].js → /api/users/:id
 * 
 * Demonstrates:
 * - Dynamic route parameters
 * - Single resource CRUD operations
 */

// Shared store reference (in real app, use database)
import { getUsers, updateUser, deleteUser } from '../_store.js';

/**
 * GET /api/users/:id
 * Returns a single user by ID
 */
export async function GET(req, res) {
  const { id } = req.params;
  const users = getUsers();
  const user = users.find(u => u.id === parseInt(id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  return res.json({
    success: true,
    data: user
  });
}

/**
 * PUT /api/users/:id
 * Updates a single user
 */
export async function PUT(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  const result = updateUser(parseInt(id), updates);
  
  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  return res.json({
    success: true,
    data: result
  });
}

/**
 * PATCH /api/users/:id
 * Partially updates a user
 */
export async function PATCH(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  const result = updateUser(parseInt(id), updates);
  
  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  return res.json({
    success: true,
    data: result
  });
}

/**
 * DELETE /api/users/:id
 * Deletes a single user
 */
export async function DELETE(req, res) {
  const { id } = req.params;
  
  const success = deleteUser(parseInt(id));
  
  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  return res.status(204).send();
}
