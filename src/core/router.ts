/**
 * Client-side Router for Single Page Applications
 */

import { createContext, useContext } from './context.js';
import { useState, useEffect, useRef } from './hooks.js';
import { jsx } from './jsx-runtime.js';
import { VNode } from './types.js';

export interface Route {
  path: string;
  component: (props: any) => VNode | null;
  exact?: boolean;
  children?: Route[];
}

export interface RouterState {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

export interface RouterContextValue extends RouterState {
  navigate: (to: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  match: (pattern: string) => boolean;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

// Router context
export const RouterContext = createContext<RouterContextValue>({
  pathname: '/',
  search: '',
  hash: '',
  params: {},
  query: {},
  navigate: () => {},
  back: () => {},
  forward: () => {},
  match: () => false
});

/**
 * Parse URL search params into an object
 */
function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

/**
 * Match a pathname against a route pattern
 */
function matchPath(pathname: string, pattern: string, exact: boolean = false): { 
  match: boolean; 
  params: Record<string, string> 
} {
  const params: Record<string, string> = {};
  
  // Convert pattern to regex
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  
  if (exact && patternParts.length !== pathParts.length) {
    return { match: false, params };
  }
  
  if (patternParts.length > pathParts.length) {
    return { match: false, params };
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart.startsWith(':')) {
      // Dynamic segment
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart === '*') {
      // Wildcard - matches rest of path
      params['*'] = pathParts.slice(i).join('/');
      return { match: true, params };
    } else if (patternPart !== pathPart) {
      return { match: false, params };
    }
  }
  
  return { match: true, params };
}

/**
 * Router Provider component
 */
export function RouterProvider({ 
  children 
}: { 
  children: any 
}): VNode {
  const [location, setLocation] = useState<RouterState>((() => {
    if (typeof window === 'undefined') {
      return { pathname: '/', search: '', hash: '', params: {}, query: {} };
    }
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      params: {},
      query: parseQuery(window.location.search)
    };
  })());
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handlePopState = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        params: {},
        query: parseQuery(window.location.search)
      });
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const navigate = (to: string, options: NavigateOptions = {}) => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(to, window.location.origin);
    
    if (options.replace) {
      window.history.replaceState(options.state || null, '', url.href);
    } else {
      window.history.pushState(options.state || null, '', url.href);
    }
    
    setLocation({
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      params: {},
      query: parseQuery(url.search)
    });
  };
  
  const back = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };
  
  const forward = () => {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
  };
  
  const match = (pattern: string) => {
    return matchPath(location.pathname, pattern).match;
  };
  
  const contextValue: RouterContextValue = {
    ...location,
    navigate,
    back,
    forward,
    match
  };
  
  return jsx(RouterContext.Provider, { value: contextValue, children });
}

/**
 * Router component - renders matching routes
 */
export function Router({ routes }: { routes: Route[] }): VNode | null {
  const { pathname, params: existingParams } = useContext(RouterContext);
  
  for (const route of routes) {
    const { match, params } = matchPath(pathname, route.path, route.exact);
    if (match) {
      const Component = route.component;
      return jsx(Component, { ...params, ...existingParams });
    }
  }
  
  return null;
}

/**
 * Route component - conditionally renders based on path match
 */
export function Route({ 
  path, 
  component: Component, 
  exact = false 
}: { 
  path: string; 
  component: (props: any) => VNode | null; 
  exact?: boolean 
}): VNode | null {
  const { pathname } = useContext(RouterContext);
  const { match, params } = matchPath(pathname, path, exact);
  
  if (match) {
    return jsx(Component, params);
  }
  
  return null;
}

/**
 * Switch component - renders first matching child route
 */
export function Switch({ children }: { children: any }): VNode | null {
  const { pathname } = useContext(RouterContext);
  const routes = Array.isArray(children) ? children : [children];
  
  for (const child of routes) {
    if (child?.props?.path) {
      const exact = child.props.exact ?? false;
      const { match } = matchPath(pathname, child.props.path, exact);
      if (match) {
        return child;
      }
    }
  }
  
  return null;
}

/**
 * Link component - navigation without page reload
 */
export function Link({ 
  to, 
  children, 
  replace = false,
  className = '',
  activeClassName = '',
  ...rest 
}: { 
  to: string; 
  children: any;
  replace?: boolean;
  className?: string;
  activeClassName?: string;
  [key: string]: any;
}): VNode {
  const { pathname, navigate } = useContext(RouterContext);
  const isActive = pathname === to || pathname.startsWith(to + '/');
  
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    navigate(to, { replace });
  };
  
  const combinedClassName = isActive && activeClassName 
    ? `${className} ${activeClassName}`.trim()
    : className;
  
  return jsx('a', {
    href: to,
    onClick: handleClick,
    className: combinedClassName || undefined,
    ...rest,
    children
  });
}

/**
 * Redirect component
 */
export function Redirect({ 
  to, 
  replace = true 
}: { 
  to: string; 
  replace?: boolean 
}): null {
  const { navigate } = useContext(RouterContext);
  
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace]);
  
  return null;
}

/**
 * NavLink component - Link with active state styling
 */
export const NavLink = Link;

// Hooks
export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}

export function useLocation(): RouterState {
  const { pathname, search, hash, params, query } = useContext(RouterContext);
  return { pathname, search, hash, params, query };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const { params } = useContext(RouterContext);
  return params as T;
}

export function useNavigate(): (to: string, options?: NavigateOptions) => void {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const { search, navigate, pathname } = useContext(RouterContext);
  const searchParams = new URLSearchParams(search);
  
  const setSearchParams = (newParams: URLSearchParams) => {
    navigate(`${pathname}?${newParams.toString()}`);
  };
  
  return [searchParams, setSearchParams];
}

export function useMatch(pattern: string): Record<string, string> | null {
  const { pathname } = useContext(RouterContext);
  const { match, params } = matchPath(pathname, pattern);
  return match ? params : null;
}

export default {
  RouterProvider,
  Router,
  Route,
  Switch,
  Link,
  NavLink,
  Redirect,
  useRouter,
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
  useMatch,
  RouterContext
};
