// Dynamic API Route for individual user operations
import { Request, Response } from 'express';

// Sample data store
const users = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
  { id: 3, name: 'User 3', email: 'user3@example.com' }
];

// Utility to find user by ID
const findUser = (id: number) => users.find(user => user.id === id);

// GET handler for retrieving a specific user
export async function get(req: Request, res: Response) {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const user = findUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
}

// PUT handler for updating a user
export async function put(req: Request, res: Response) {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Update user, but preserve the ID
  const updatedUser = { ...req.body, id: userId };
  users[userIndex] = updatedUser;
  
  res.json(updatedUser);
}

// DELETE handler for removing a user
export async function del(req: Request, res: Response) {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove the user
  users.splice(userIndex, 1);
  
  res.status(204).end();
}

// Use delete handler for DELETE method since 'delete' is a reserved word
export const DELETE = del;
