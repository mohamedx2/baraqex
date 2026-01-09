/**
 * Shared Data Store
 * 
 * This is a simple in-memory store for demo purposes.
 * In production, use a real database with baraqex/server database helpers.
 */

let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', createdAt: '2024-01-16' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', createdAt: '2024-01-17' },
];

let nextId = 4;

export function getUsers() {
  return [...users];
}

export function getUser(id) {
  return users.find(u => u.id === id);
}

export function createUser(data) {
  const newUser = {
    id: nextId++,
    ...data,
    createdAt: new Date().toISOString().split('T')[0]
  };
  users.push(newUser);
  return newUser;
}

export function updateUser(id, updates) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates, id };
  return users[index];
}

export function deleteUser(id) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  
  users.splice(index, 1);
  return true;
}

// Posts store for nested resources demo
let posts = [
  { id: 1, userId: 1, title: 'Getting Started with Baraqex', content: 'Learn the basics...', createdAt: '2024-01-20' },
  { id: 2, userId: 1, title: 'Advanced Patterns', content: 'Deep dive into...', createdAt: '2024-01-21' },
  { id: 3, userId: 2, title: 'API Design Tips', content: 'Best practices for...', createdAt: '2024-01-22' },
];

let nextPostId = 4;

export function getPosts(userId = null) {
  if (userId) {
    return posts.filter(p => p.userId === userId);
  }
  return [...posts];
}

export function getPost(id) {
  return posts.find(p => p.id === id);
}

export function createPost(data) {
  const newPost = {
    id: nextPostId++,
    ...data,
    createdAt: new Date().toISOString().split('T')[0]
  };
  posts.push(newPost);
  return newPost;
}
