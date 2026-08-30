import { jsx } from 'frontend-hamroun';
// Use dynamic import to ensure it's available
// import UsersPage from './pages/users'; 

// Type definitions for page components
export interface PageProps {
  initialState: any;
}

export interface PageComponent {
  (props: PageProps): any;
  getInitialData?: (path: string) => Promise<any>;
}

// Define router interface for type safety
interface RouteParams {
  [key: string]: string;
}

// Define router class for handling routes
export class Router {
  private routes: Record<string, PageComponent> = {};
  private notFoundComponent: PageComponent | null = null;
  
  // Register a component for a specific route
  register(path: string, component: PageComponent): Router {
    const normalizedPath = path === '/' ? 'index' : path.replace(/^\//, '');
    this.routes[normalizedPath] = component;
    console.log(`[Router] Registered component for path: ${normalizedPath}`);
    return this;
  }
  
  // Set the not found component
  setNotFound(component: PageComponent): Router {
    this.notFoundComponent = component;
    return this;
  }
  
  // Get the not found component
  getNotFound(): PageComponent | null {
    return this.notFoundComponent;
  }
  
  // Get all registered routes
  getAllRoutes(): Record<string, PageComponent> {
    return this.routes;
  }
  
  // Find component for a given path
  async resolve(path: string): Promise<PageComponent | null> {
    const normalizedPath = path === '/' ? 'index' : path.replace(/^\//, '');
    
    console.log(`[Router] Resolving component for path: ${normalizedPath}`);
    
    // Check for exact match first
    if (this.routes[normalizedPath]) {
      return this.routes[normalizedPath];
    }
    
    // Check for nested routes (e.g., "users/123" should match a "users/[id]" route)
    const pathSegments = normalizedPath.split('/');
    const registeredRoutes = Object.keys(this.routes);
    
    // Try to find dynamic route matches
    for (const route of registeredRoutes) {
      const routeSegments = route.split('/');
      
      // Skip routes with different segment count
      if (routeSegments.length !== pathSegments.length) continue;
      
      let isMatch = true;
      const params: RouteParams = {};
      
      // Compare each segment
      for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        const pathSegment = pathSegments[i];
        
        // Handle dynamic segments (e.g., [id])
        if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
          const paramName = routeSegment.slice(1, -1);
          params[paramName] = pathSegment;
        }
        // Regular segment, must match exactly
        else if (routeSegment !== pathSegment) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        console.log(`[Router] Found dynamic route match: ${route}`);
        // Return the component with params
        return this.routes[route];
      }
    }
    
    // If no match found yet, try to dynamically import the component
    try {
      let component = null;
      let resolvedPath = normalizedPath;
      
      // Next.js-style dynamic route resolution
      try {
        // First, try direct file match (e.g., ./pages/users.tsx)
        // Focus on .tsx since that's what this project uses
        try {
          console.log(`[Router] Trying direct import: ./pages/${resolvedPath}.tsx`);
          const directModule = await import(/* @vite-ignore */ `./pages/${resolvedPath}.tsx`)
            .catch(() => null);
            
          if (directModule) {
            component = directModule.default || directModule;
          }
        } catch (e) {
          console.warn(`[Router] Error importing ./pages/${resolvedPath}.tsx:`, e);
        }
        
        // Next, try index file in directory (e.g., ./pages/about/index.tsx)
        if (!component && !resolvedPath.endsWith('index')) {
          try {
            console.log(`[Router] Trying index file: ./pages/${resolvedPath}/index.tsx`);
            const indexModule = await import(/* @vite-ignore */ `./pages/${resolvedPath}/index.tsx`)
              .catch(() => null);
              
            if (indexModule) {
              component = indexModule.default || indexModule;
            }
          } catch (e) {
            console.warn(`[Router] Error importing ./pages/${resolvedPath}/index.tsx:`, e);
          }
        }
      } catch (routeError) {
        console.warn(`[Router] Error resolving Next.js style route:`, routeError);
      }
      
      // Register and return component if found
      if (component) {
        this.routes[normalizedPath] = component;
        return component;
      }
    } catch (error) {
      console.warn(`[Router] Error importing component for ${normalizedPath}:`, error);
    }
    
    // If we reach here, no component was found
    console.warn(`[Router] No component found for path: ${normalizedPath}`);
    return this.notFoundComponent;
  }

  // Auto-discover components in the pages directory
  async discoverRoutes(): Promise<Record<string, PageComponent>> {
    console.log('[Router] Auto-discovering routes from pages directory...');
    
    try {
      // Use a more conventional approach instead of relying on import.meta.glob
      await this.tryLoadCoreRoutes();
      
      console.log('[Router] Route discovery complete. Available routes:', Object.keys(this.routes));
      return this.routes;
    } catch (error) {
      console.error('[Router] Error discovering routes:', error);
      await this.tryLoadCoreRoutes();
      return this.routes;
    }
  }
  
  // Fallback method to load core routes
  async tryLoadCoreRoutes(): Promise<void> {
    // First try the auto-discovery approach with dynamic imports
    const pageModules = [
      { path: './pages/index', route: 'index' },
      { path: './pages/about/index', route: 'about' },
      { path: './pages/users', route: 'users' }
    ];
    
    // Try importing each module dynamically - focus on .tsx files
    for (const { path, route } of pageModules) {
      if (!this.routes[route]) {
        try {
          console.log(`[Router] Attempting to load route: ${route}`);
          
          // Only try .tsx imports since that's what the project uses
          const module = await import(/* @vite-ignore */ `${path}.tsx`)
            .catch(() => null);
          
          if (module && module.default) {
            this.routes[route] = module.default;
            console.log(`[Router] Registered route: ${route}`);
          }
        } catch (error) {
          console.warn(`[Router] Could not load route: ${route}`, error);
        }
      }
    }
  }
}

// Create and export a router instance
export const router = new Router();

// NotFound component as fallback (using jsx function instead of JSX syntax)
export const NotFound: PageComponent = ({ initialState }) => {
  return jsx('div', { className: 'container mx-auto px-4 py-12 max-w-4xl' }, [
    jsx('div', { className: 'bg-white shadow-lg rounded-lg overflow-hidden p-8' }, [
      jsx('h1', { className: 'text-3xl font-bold text-gray-800 mb-4' }, ['Page Not Found']),
      jsx('p', { className: 'text-gray-600 mb-6' }, [`No component found for path: ${initialState?.route || 'unknown'}`]),
      jsx('a', { href: '/', className: 'text-blue-600 hover:text-blue-800 hover:underline transition-colors' }, ['Go to Home']),
      jsx('div', { className: 'mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200' }, [
        jsx('h3', { className: 'text-lg font-medium text-gray-700 mb-3' }, ['Available Routes']),
        jsx('ul', { className: 'space-y-2' }, [
          jsx('li', {}, [jsx('a', { href: '/', className: 'text-blue-600 hover:text-blue-800 hover:underline' }, ['Home'])]),
          jsx('li', {}, [jsx('a', { href: '/about', className: 'text-blue-600 hover:text-blue-800 hover:underline' }, ['About'])]),
          jsx('li', {}, [jsx('a', { href: '/users', className: 'text-blue-600 hover:text-blue-800 hover:underline' }, ['Users'])])
        ])
      ])
    ])
  ]);
};

// Set NotFound as the default fallback
router.setNotFound(NotFound);

// Improved router initialization with auto-discovery
export async function initializeRouter(): Promise<Router> {
  try {
    console.log('[Router] Initializing router with auto-discovery...');
    
    // Auto-discover routes
    await router.discoverRoutes();
    
    // Register fallback pages for key routes if they weren't discovered
    const routes = router.getAllRoutes();
    
    if (!routes['index']) {
      router.register('index', ({ initialState }: PageProps) => jsx('div', {}, [
        jsx('h1', {}, ['Welcome']),
        jsx('p', {}, ['This is the home page.'])
      ]));
    }
    
    if (!routes['about']) {
      router.register('about', ({ initialState }: PageProps) => jsx('div', {}, [
        jsx('h1', {}, ['About']),
        jsx('p', {}, ['This is the about page.'])
      ]));
    }
    
    console.log('[Router] Router initialized with routes:', Object.keys(router.getAllRoutes()));
    return router;
  } catch (error) {
    console.error('[Router] Error initializing router:', error);
    return router;
  }
}
