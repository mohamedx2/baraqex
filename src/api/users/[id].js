// Mock user data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
];

export function get(req, res) {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      id: userId
    });
  }
  
  res.json({
    user,
    timestamp: new Date().toISOString()
  });
}

export function put(req, res) {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      id: userId
    });
  }
  
  // Update user
  users[userIndex] = { ...users[userIndex], ...req.body, id: userId };
  
  res.json({
    message: 'User updated successfully',
    user: users[userIndex],
    timestamp: new Date().toISOString()
  });
}

export function delete_(req, res) {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      id: userId
    });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({
    message: 'User deleted successfully',
    user: deletedUser,
    timestamp: new Date().toISOString()
  });
}

// Note: delete is a reserved keyword, so we use delete_ and export it as delete
export { delete_ as delete };
