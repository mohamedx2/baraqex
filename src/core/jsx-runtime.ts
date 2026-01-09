/**
 * JSX Runtime - transforms JSX syntax into virtual DOM nodes
 */

import { VNode } from './types.js';
import { prepareRender, finishRender, setRenderCallback } from './hooks.js';

/**
 * Create a virtual DOM node from JSX
 */
export function jsx(type: string | Function, props: any, key?: string | number): VNode {
  const processedProps = { ...props };
  
  // Handle key
  if (key !== undefined) {
    processedProps.key = key;
  }
  
  // Handle children from additional arguments
  if (arguments.length > 3) {
    processedProps.children = Array.prototype.slice.call(arguments, 3);
  }
  
  return { type, props: processedProps, key: processedProps.key };
}

/**
 * JSX with static children (optimization for multiple children)
 */
export const jsxs = jsx;

/**
 * JSX development version with additional debugging
 */
export function jsxDEV(
  type: string | Function,
  props: any,
  key?: string | number,
  _isStaticChildren?: boolean,
  _source?: any,
  _self?: any
): VNode {
  return jsx(type, props, key);
}

/**
 * Fragment component - renders children without a wrapper element
 */
export const Fragment = ({ children }: { children: any }) => children;

/**
 * Create a DOM element from a virtual node (async for component support)
 */
export async function createElement(vnode: VNode | any): Promise<Node> {
  // Handle primitives and null
  if (vnode == null) {
    return document.createTextNode('');
  }
  
  if (typeof vnode === 'boolean') {
    return document.createTextNode('');
  }

  if (typeof vnode === 'number' || typeof vnode === 'string') {
    return document.createTextNode(String(vnode));
  }

  // Handle arrays
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    for (const child of vnode) {
      const node = await createElement(child);
      fragment.appendChild(node);
    }
    return fragment;
  }

  // Handle VNode
  if (typeof vnode === 'object' && 'type' in vnode && vnode.props !== undefined) {
    const { type, props } = vnode;
    
    // Handle function components
    if (typeof type === 'function') {
      // Handle Fragment
      if (type === Fragment) {
        const children = props?.children;
        if (children == null) return document.createTextNode('');
        return createElement(children);
      }
      
      // Render function component
      const renderId = prepareRender();
      try {
        const result = type(props || {});
        return await createElement(result);
      } finally {
        finishRender();
      }
    }

    // Create DOM element for intrinsic elements
    const element = document.createElement(type as string);
    
    // Handle props
    for (const [key, value] of Object.entries(props || {})) {
      if (key === 'children') continue;
      
      if (key === 'className') {
        element.setAttribute('class', String(value));
      } else if (key === 'htmlFor') {
        element.setAttribute('for', String(value));
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value as EventListener);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'dangerouslySetInnerHTML' && value && (value as any).__html) {
        element.innerHTML = (value as any).__html;
      } else if (key === 'ref') {
        if (typeof value === 'function') {
          value(element);
        } else if (value && typeof value === 'object' && 'current' in value) {
          (value as { current: any }).current = element;
        }
      } else if (value !== false && value != null) {
        if (value === true) {
          element.setAttribute(key, '');
        } else {
          element.setAttribute(key, String(value));
        }
      }
    }

    // Handle children
    const children = props?.children;
    if (children != null) {
      const childArray = Array.isArray(children) ? children : [children];
      for (const child of childArray) {
        const childNode = await createElement(child);
        element.appendChild(childNode);
      }
    }

    return element;
  }

  // Handle other objects by converting to string
  return document.createTextNode(String(vnode));
}

/**
 * Synchronous createElement for server-side rendering
 */
export function createElementSync(vnode: VNode | any): Node {
  // Handle primitives and null
  if (vnode == null || typeof vnode === 'boolean') {
    return document.createTextNode('');
  }

  if (typeof vnode === 'number' || typeof vnode === 'string') {
    return document.createTextNode(String(vnode));
  }

  // Handle arrays
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    for (const child of vnode) {
      fragment.appendChild(createElementSync(child));
    }
    return fragment;
  }

  // Handle VNode
  if (typeof vnode === 'object' && 'type' in vnode) {
    const { type, props } = vnode;
    
    if (typeof type === 'function') {
      if (type === Fragment) {
        return createElementSync(props?.children);
      }
      const result = type(props || {});
      return createElementSync(result);
    }

    const element = document.createElement(type as string);
    
    for (const [key, value] of Object.entries(props || {})) {
      if (key === 'children') continue;
      if (key === 'className') {
        element.setAttribute('class', String(value));
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value as EventListener);
      } else if (value !== false && value != null && value !== true) {
        element.setAttribute(key, String(value));
      }
    }

    const children = props?.children;
    if (children != null) {
      const childArray = Array.isArray(children) ? children : [children];
      for (const child of childArray) {
        element.appendChild(createElementSync(child));
      }
    }

    return element;
  }

  return document.createTextNode(String(vnode));
}

// Named exports
export default {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
  createElement,
  createElementSync
};
