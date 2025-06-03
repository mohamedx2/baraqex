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

export function hydrate(component: any, container: Element): void {
  // Basic hydration - this would be more complex in a real implementation
  if (container && typeof component === 'function') {
    try {
      const html = renderToString(component);
      container.innerHTML = html;
    } catch (error) {
      console.error('Error in hydrate:', error);
    }
  }
}
