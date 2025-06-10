import { sendSuccess, sendError, validateFields, getPagination } from 'baraqex';

// In-memory storage for demo (use database in real app)
let todos = [
  { id: 1, text: 'Learn Baraqex Framework', completed: false, userId: 1, createdAt: new Date().toISOString() },
  { id: 2, text: 'Build awesome fullstack app', completed: false, userId: 1, createdAt: new Date().toISOString() },
  { id: 3, text: 'Deploy to production', completed: false, userId: 1, createdAt: new Date().toISOString() }
];

// Require authentication for all todo endpoints
export const middleware = [
  (req: any, res: any, next: any) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    next();
  }
];

// Get todos for current user
export async function get(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = getPagination(req);
    
    // Filter todos for current user
    const userTodos = todos.filter(todo => todo.userId === userId);
    
    // Apply pagination
    const paginatedTodos = userTodos.slice(skip, skip + limit);
    
    return sendSuccess(res, {
      todos: paginatedTodos,
      pagination: {
        page,
        limit,
        total: userTodos.length,
        pages: Math.ceil(userTodos.length / limit)
      }
    }, 'Todos retrieved successfully');

  } catch (error: any) {
    console.error('Get todos error:', error);
    return sendError(res, 'Failed to get todos', 500);
  }
}

// Create new todo
export async function post(req: any, res: any) {
  try {
    const validation = validateFields(req, ['text']);
    if (!validation.valid) {
      return sendError(res, 'Missing required fields', 400, { missing: validation.missing });
    }

    const { text } = req.body;
    const userId = req.user.id;

    if (text.trim().length === 0) {
      return sendError(res, 'Todo text cannot be empty', 400);
    }

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      userId,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);

    return sendSuccess(res, { todo: newTodo }, 'Todo created successfully');

  } catch (error: any) {
    console.error('Create todo error:', error);
    return sendError(res, 'Failed to create todo', 500);
  }
}
