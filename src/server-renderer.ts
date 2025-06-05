/**
 * Server-side rendering utilities
 */

export function renderToString(component: any): string {
  try {
    // Basic server-side rendering - this is a simplified implementation
    if (typeof component === 'function') {
      const result = component();
      if (typeof result === 'string') {
        return result;
      }
      if (result && typeof result === 'object') {
        return JSON.stringify(result);
      }
      return String(result || '');
    }
    
    if (typeof component === 'string') {
      return component;
    }
    
    return String(component || '');
  } catch (error) {
    console.error('Error in renderToString:', error);
    return '<div>Error rendering component</div>';
  }
}

