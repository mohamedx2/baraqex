import { Request, Response } from 'express';

// Mock user database
const users = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
  { id: 3, name: 'User 3', email: 'user3@example.com' }
];

export const get = (req: Request, res: Response) => {
  // Return users without sensitive information
  const safeUsers = users.map(({ id, name, email }) => ({ id, name, email }));
  res.json(safeUsers);
};

export const post = (req: Request, res: Response) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // In a real app, validate data and save to database
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
};
