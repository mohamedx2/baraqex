/**
 * Component rendering utilities
 */

export async function renderComponent(
  Component: any, 
  props: any = {}
): Promise<{ html: string; success: boolean; error?: Error }> {
  try {
    // Simple component rendering
    let html = '';
    
    if (typeof Component === 'function') {
      const result = Component(props);
      
      if (typeof result === 'string') {
        html = result;
      } else if (result && typeof result.then === 'function') {
        // Handle async components
        const asyncResult = await result;
        html = typeof asyncResult === 'string' ? asyncResult : String(asyncResult || '');
      } else {
        html = String(result || '');
      }
    } else {
      html = String(Component || '');
    }
    
    return {
      html,
      success: true
    };
  } catch (error) {
    console.error('Error rendering component:', error);
    return {
      html: '<div>Error rendering component</div>',
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
