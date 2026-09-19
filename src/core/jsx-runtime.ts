/**
 * JSX Runtime — transforms JSX syntax into virtual DOM nodes
 *
 * jsx() and jsxs() produce VNode objects (universal).
 * createElement() produces real DOM nodes (browser-only).
 */

import { VNode } from './types.js';
import { prepareRender, finishRender, setRenderCallback, getCurrentRoot } from './hooks.js';

const isBrowser = typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// VNode creation (universal — works in any environment)
// ---------------------------------------------------------------------------

/**
 * Create a virtual DOM node from JSX
 */
export function jsx(type: string | Function, props: any, ...children: any[]): VNode {
  const { key, ...restProps } = props || {};
  const processedProps = { ...restProps };

  // Children from trailing arguments (classic esbuild/babel/swc transform)
  if (children.length > 0) {
    processedProps.children = children.length === 1 ? children[0] : children;
  }

  const vnodeKey = key ?? processedProps.key;
  return { type, props: processedProps, key: vnodeKey };
}

/**
 * JSX with static children (optimization for multiple children)
 */
export const jsxs = jsx;

/**
 * JSX development version with additional debugging info
 */
export function jsxDEV(
  type: string | Function,
  props: any,
  key?: string | number,
  _isStaticChildren?: boolean,
  _source?: any,
  _self?: any
): VNode {
  if (key !== undefined) {
    return jsx(type, { ...props, key });
  }
  return jsx(type, props);
}

/**
 * Fragment — renders children without a wrapper element
 */
export const Fragment = ({ children }: { children: any }) => children;

// ---------------------------------------------------------------------------
// DOM element creation (browser-only)
// ---------------------------------------------------------------------------

function assertBrowser(method: string): void {
  if (!isBrowser) {
    throw new Error(
      `[baraqex] ${method}() can only be called in a browser environment. ` +
      `Use renderToString() for server-side rendering.`
    );
  }
}

function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Apply props to a real DOM element
 */
function applyProps(element: HTMLElement, props: Record<string, any>): void {
  for (const [key, value] of Object.entries(props)) {
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
}

/**
 * Create a DOM element from a virtual node (async for component support)
 */
export async function createElement(vnode: VNode | any): Promise<Node> {
  assertBrowser('createElement');

  // Handle primitives and null
  if (vnode == null || typeof vnode === 'boolean') {
    return createTextNode('');
  }

  if (typeof vnode === 'number' || typeof vnode === 'string') {
    return createTextNode(String(vnode));
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
      if (type === Fragment) {
        const children = props?.children;
        if (children == null) return createTextNode('');
        return createElement(children);
      }

      const root = getCurrentRoot() ?? undefined;
      const renderId = prepareRender(root);
      try {
        const result = type(props || {});
        return await createElement(result);
      } finally {
        finishRender();
      }
    }

    // Create DOM element for intrinsic elements
    const element = document.createElement(type as string);
    applyProps(element, props || {});

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
  return createTextNode(String(vnode));
}

/**
 * Synchronous createElement (browser-only, no async component support)
 */
export function createElementSync(vnode: VNode | any): Node {
  assertBrowser('createElementSync');

  if (vnode == null || typeof vnode === 'boolean') {
    return createTextNode('');
  }

  if (typeof vnode === 'number' || typeof vnode === 'string') {
    return createTextNode(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    for (const child of vnode) {
      fragment.appendChild(createElementSync(child));
    }
    return fragment;
  }

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
    applyProps(element, props || {});

    const children = props?.children;
    if (children != null) {
      const childArray = Array.isArray(children) ? children : [children];
      for (const child of childArray) {
        element.appendChild(createElementSync(child));
      }
    }

    return element;
  }

  return createTextNode(String(vnode));
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
