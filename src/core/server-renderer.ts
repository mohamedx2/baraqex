/**
 * Server-side rendering - converts virtual DOM to HTML strings
 */

import { VNode } from './types.js';
import { prepareRender, finishRender } from './hooks.js';

type Component = (props: any) => any;

// Self-closing HTML tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/**
 * Renders a virtual DOM tree to an HTML string
 */
export function renderToString(vnode: VNode | any): string {
  // Reset hook state for this render
  prepareRender();
  
  try {
    // Render the tree to HTML
    return renderNodeToString(vnode);
  } finally {
    // Clean up after rendering
    finishRender();
  }
}

/**
 * Renders to string with data for hydration
 */
export function renderToStringWithData(vnode: VNode | any): { html: string; data: any } {
  const html = renderToString(vnode);
  return { html, data: {} };
}

/**
 * Stream rendering for large pages
 */
export async function* renderToStream(vnode: VNode | any): AsyncGenerator<string> {
  yield renderToString(vnode);
}

/**
 * Internal function to convert a virtual node to an HTML string
 */
function renderNodeToString(vnode: VNode | string | number | boolean | null | undefined | any[]): string {
  // Handle primitive values
  if (vnode === null || vnode === undefined) return '';
  if (typeof vnode === 'boolean') return '';
  if (typeof vnode === 'number' || typeof vnode === 'string') return escapeHtml(String(vnode));
  
  // Handle arrays
  if (Array.isArray(vnode)) {
    return vnode.map(child => renderNodeToString(child)).join('');
  }
  
  // Handle objects without type (not VNode)
  if (typeof vnode !== 'object' || vnode.type === undefined) {
    return escapeHtml(String(vnode));
  }
  
  const { type, props } = vnode;
  
  // Handle function components
  if (typeof type === 'function') {
    // Handle Fragment
    if (type.name === 'Fragment' || (type as unknown) === Symbol.for('react.fragment')) {
      const children = props?.children;
      if (children == null) return '';
      return Array.isArray(children)
        ? children.map(child => renderNodeToString(child)).join('')
        : renderNodeToString(children);
    }
    
    const Component = type as Component;
    try {
      const renderedNode = Component(props || {});
      return renderNodeToString(renderedNode);
    } catch (error) {
      console.error('Error rendering component:', error);
      return `<!-- Error rendering component: ${escapeHtml(String(error))} -->`;
    }
  }
  
  // Handle intrinsic elements (regular HTML tags)
  if (typeof type === 'string') {
    const tag = type;
    let attrs = '';
    
    // Convert props to HTML attributes
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (key === 'children') continue;
        if (key === 'dangerouslySetInnerHTML') continue;
        if (key === 'ref') continue;
        if (value === undefined || value === null || value === false) continue;
        
        let attrName = key;
        let attrValue = value;
        
        // Handle special attribute names
        if (key === 'className') attrName = 'class';
        else if (key === 'htmlFor') attrName = 'for';
        else if (key === 'tabIndex') attrName = 'tabindex';
        
        // Skip event handlers
        if (attrName.startsWith('on') && typeof value === 'function') continue;
        
        // Handle style object
        if (attrName === 'style' && typeof value === 'object') {
          attrValue = Object.entries(value)
            .map(([prop, val]) => {
              const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
              return `${cssProperty}: ${val}`;
            })
            .join('; ');
        }
        
        // Handle boolean attributes
        if (value === true) {
          attrs += ` ${attrName}`;
        } else {
          attrs += ` ${attrName}="${escapeHtml(String(attrValue))}"`;
        }
      }
    }
    
    // Self-closing tags
    if (VOID_ELEMENTS.has(tag)) {
      return `<${tag}${attrs} />`;
    }
    
    // Handle dangerouslySetInnerHTML
    if (props?.dangerouslySetInnerHTML?.__html) {
      return `<${tag}${attrs}>${props.dangerouslySetInnerHTML.__html}</${tag}>`;
    }
    
    // Process children
    let children = '';
    const childrenArray = props?.children 
      ? Array.isArray(props.children) ? props.children : [props.children]
      : [];
    
    for (const child of childrenArray) {
      children += renderNodeToString(child);
    }
    
    return `<${tag}${attrs}>${children}</${tag}>`;
  }
  
  // Handle Fragment symbol
  if (type === Symbol.for('react.fragment')) {
    const children = props?.children;
    if (children == null) return '';
    return Array.isArray(children)
      ? children.map(child => renderNodeToString(child)).join('')
      : renderNodeToString(children);
  }
  
  // Fallback for unknown node types
  console.warn('Unknown vnode type:', type);
  return '';
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  renderToString,
  renderToStringWithData,
  renderToStream
};
