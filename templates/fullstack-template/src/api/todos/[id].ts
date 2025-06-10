import { sendSuccess, sendError } from 'baraqex';

// Import the todos array from the index file
// In a real app, this would be in a database
let todos = [
  { id: 1, text: 'Learn Baraqex Framework', completed: false, userId: 1, createdAt: new Date().toISOString() },
  { id: 2, text: 'Build awesome fullstack app', completed: false, userId: 1, createdAt: new Date().toISOString() },
  { id: 3, text: 'Deploy to production', completed: false, userId: 1, createdAt: new Date().toISOString() }
];

// Require authentication
export const middleware = [
  (req: any, res: any, next: any) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    next();
  }
];

// Get specific todo
export async function get(req: any, res: any) {
  try {
    const todoId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(todoId)) {
      return sendError(res, 'Invalid todo ID', 400);
    }

    const todo = todos.find(t => t.id === todoId && t.userId === userId);
    if (!todo) {
      return sendError(res, 'Todo not found', 404);
    }

    return sendSuccess(res, { todo }, 'Todo retrieved successfully');

  } catch (error: any) {
    console.error('Get todo error:', error);
    return sendError(res, 'Failed to get todo', 500);
  }
}

// Update todo
export async function put(req: any, res: any) {
  try {
    const todoId = parseInt(req.params.id);
    const userId = req.user.id;
    const { text, completed } = req.body;

    if (isNaN(todoId)) {
      return sendError(res, 'Invalid todo ID', 400);
    }

    const todoIndex = todos.findIndex(t => t.id === todoId && t.userId === userId);
    if (todoIndex === -1) {
      return sendError(res, 'Todo not found', 404);
    }

    // Update todo
    if (text !== undefined) {
      if (text.trim().length === 0) {
        return sendError(res, 'Todo text cannot be empty', 400);
      }
      todos[todoIndex].text = text.trim();
    }

    if (completed !== undefined) {
      todos[todoIndex].completed = Boolean(completed);
    }

    todos[todoIndex].updatedAt = new Date().toISOString();

    return sendSuccess(res, { todo: todos[todoIndex] }, 'Todo updated successfully');

  } catch (error: any) {
    console.error('Update todo error:', error);
    return sendError(res, 'Failed to update todo', 500);
  }
}

// Delete todo
export async function del(req: any, res: any) {
  try {
    const todoId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(todoId)) {
      return sendError(res, 'Invalid todo ID', 400);
    }

    const todoIndex = todos.findIndex(t => t.id === todoId && t.userId === userId);
    if (todoIndex === -1) {
      return sendError(res, 'Todo not found', 404);
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];

    return sendSuccess(res, { todo: deletedTodo }, 'Todo deleted successfully');

  } catch (error: any) {
    console.error('Delete todo error:', error);
    return sendError(res, 'Failed to delete todo', 500);
  }
}

// Export delete function with correct name
export { del as delete };
