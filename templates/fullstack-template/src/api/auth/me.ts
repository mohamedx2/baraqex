import { sendSuccess, sendError } from 'baraqex';

// Middleware to require authentication
export const middleware = [
  (req: any, res: any, next: any) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    next();
  }
];

// Get current user endpoint
export async function get(req: any, res: any) {
  try {
    const user = req.user;
    
    // In a real app, you might fetch fresh user data from database
    // For demo, we'll just return the user from token
    
    return sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@example.com`,
        name: user.name || user.username,
        roles: user.roles || ['user'],
        lastLogin: new Date().toISOString()
      }
    }, 'User profile retrieved');

  } catch (error: any) {
    console.error('Get user error:', error);
    return sendError(res, 'Failed to get user profile', 500);
  }
}

// Update user profile
export async function put(req: any, res: any) {
  try {
    const user = req.user;
    const { name, email } = req.body;

    // Basic validation
    if (email && !email.includes('@')) {
      return sendError(res, 'Invalid email format', 400);
    }

    // In a real app, you'd update the database
    // For demo, we'll just return updated user data
    const updatedUser = {
      ...user,
      name: name || user.name,
      email: email || user.email,
      updatedAt: new Date().toISOString()
    };

    return sendSuccess(res, {
      user: updatedUser
    }, 'Profile updated successfully');

  } catch (error: any) {
    console.error('Update user error:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
}
