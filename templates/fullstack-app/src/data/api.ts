/**
 * API utilities for making requests to the backend
 */
import { batchUpdates } from 'frontend-hamroun';

// Cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetch data from the API with caching
 */
export async function fetchApi(
  endpoint: string, 
  options: RequestInit & { 
    useCache?: boolean,
    forceFresh?: boolean 
  } = {}
): Promise<any> {
  const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
  const { useCache = true, forceFresh = false, ...fetchOptions } = options;
  
  // Check cache first if enabled
  if (useCache && !forceFresh) {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[API] Using cached data for: ${url}`);
      return cached.data;
    }
  }
  
  try {
    console.log(`[API] Fetching data from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...fetchOptions
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[API] Successfully fetched data from: ${url}`);
    
    // Cache the response if caching is enabled
    if (useCache) {
      apiCache.set(url, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (error) {
    console.error(`[API] Error fetching from ${url}:`, error);
    throw error;
  }
}

/**
 * Clear the API cache
 */
export function clearApiCache(endpoint?: string): void {
  if (endpoint) {
    const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
    apiCache.delete(url);
  } else {
    apiCache.clear();
  }
}

// Sample data for development
const sampleUsers = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
  { id: 3, name: 'User 3', email: 'user3@example.com' }
];

const samplePosts = [
  { id: 1, title: 'Post 1', content: 'Content for post 1', authorId: 1 },
  { id: 2, title: 'Post 2', content: 'Content for post 2', authorId: 2 },
  { id: 3, title: 'Post 3', content: 'Content for post 3', authorId: 1 }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// User API client
export const UserApi = {
  // Get all users
  async getAll() {
    try {
      // In a real app, we'd fetch from API
      // const response = await fetch('/api/users');
      // if (!response.ok) throw new Error('Failed to fetch users');
      // return await response.json();
      
      // Simulate API delay
      await delay(300);
      return [...sampleUsers]; // Return a copy to avoid mutations
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },
  
  // Get user by ID
  async getById(id: number | string) {
    try {
      // In a real app, we'd fetch from API
      // const response = await fetch(`/api/users/${id}`);
      // if (!response.ok) throw new Error('User not found');
      // return await response.json();
      
      // Convert ID to number if it's a string
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Simulate API delay
      await delay(200);
      
      // Find user
      const user = sampleUsers.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      
      return { ...user }; // Return a copy to avoid mutations
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },
  
  // Get posts (all or by author)
  async getPosts(authorId?: number | string) {
    try {
      // In a real app, we'd fetch from API
      // const url = authorId ? `/api/posts?authorId=${authorId}` : '/api/posts';
      // const response = await fetch(url);
      // if (!response.ok) throw new Error('Failed to fetch posts');
      // return await response.json();
      
      // Convert authorId to number if it's a string
      const userId = authorId ? (typeof authorId === 'string' ? parseInt(authorId, 10) : authorId) : undefined;
      
      // Simulate API delay
      await delay(400);
      
      // Filter posts if authorId is provided
      const posts = userId
        ? samplePosts.filter(p => p.authorId === userId)
        : samplePosts;
      
      return [...posts]; // Return a copy to avoid mutations
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }
};

// WASM API service
export const WasmApi = {
  calculate: (operation: 'add' | 'multiply', a: number, b: number) => 
    fetchApi(`/wasm/calculate?op=${operation}&a=${a}&b=${b}`),
    
  processJson: (data: any) => fetchApi('/wasm/process-json', {
    method: 'POST',
    body: JSON.stringify(data),
    useCache: false
  })
};

// Batch multiple API calls for efficiency
export const batchApiCalls = async <T>(
  apiFunctions: Array<() => Promise<T>>
): Promise<T[]> => {
  const results: T[] = [];
  let errors: Error[] = [];
  
  // Execute all API calls in parallel
  const promises = apiFunctions.map(fn => fn());
  
  try {
    const settledResults = await Promise.allSettled(promises);
    
    // Process results
    batchUpdates(() => {
      settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(result.reason);
        }
      });
    });
    
    if (errors.length) {
      console.error('[API] Some batch API calls failed:', errors);
    }
    
    return results;
  } catch (error) {
    console.error('[API] Batch API calls failed:', error);
    throw error;
  }
};
