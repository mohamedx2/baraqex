// Next.js-like API Route for Users
import { Request, Response } from 'express';

// Sample data store
const users = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
  { id: 3, name: 'User 3', email: 'user3@example.com' }
];

// GET handler for retrieving all users
export async function get(req: Request, res: Response) {
  // Option to simulate delay for testing loading states
  const delay = req.query.delay ? parseInt(req.query.delay as string) : 0;
  
  if (delay) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  res.json(users);
}

// POST handler for creating a new user
export async function post(req: Request, res: Response) {
  try {
    const newUser = req.body;
    
    // Validation
    if (!newUser.name || !newUser.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Generate new ID
    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    const createdUser = { ...newUser, id: newId };
    
    users.push(createdUser);
    
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}
