import { Request, Response } from 'express';

// Mock user database - same as in index.ts for simplicity
const users = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
  { id: 3, name: 'User 3', email: 'user3@example.com' }
];

export const get = (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
};

export const put = (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name, email } = req.body;
  
  if (!name && !email) {
    return res.status(400).json({ error: 'Name or email must be provided' });
  }
  
  // Update the user
  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email })
  };
  
  res.json(users[userIndex]);
};

export const delete_ = (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove the user
  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  
  res.json({ success: true, deletedUser });
};
