/**
 * Client-side renderer
 *
 * Each render call creates a RootState that holds all hook state for that
 * render tree. The renderer tracks the previous VNode so we can diff on
 * re-renders instead of tearing down the entire DOM.
 */

import { createElement, applyProps, Fragment } from './jsx-runtime.js';
import {
  prepareRender,
  finishRender,
  setRenderCallback,
  createRootState,
  cleanupRoot,
  getCurrentRoot,
  type RootState
} from './hooks.js';
import { batchUpdates } from './batch.js';
import { calculatePatches, applyPatches, type Patch } from './vdom.js';
import { VNode } from './types.js';

const isBrowser = typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// Root tracking — maps containers to their roots
// ---------------------------------------------------------------------------

const rootMap = new WeakMap<HTMLElement, RootState>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a virtual DOM tree into a container element.
 */
export async function render(element: VNode, container: HTMLElement): Promise<void> {
  if (!isBrowser) {
    throw new Error(
      '[baraqex] render() can only be called in a browser. ' +
      'Use renderToString() for server-side rendering.'
    );
  }
  if (!container) {
    throw new Error('[baraqex] render() requires a container element');
  }

  let root = rootMap.get(container);
  if (!root) {
    root = createRootState();
    rootMap.set(container, root);
  }

  await batchUpdates(async () => {
    prepareRender(root);
    try {
      setRenderCallback(render as any, element, container);

      const domNode = await createElement(element);

      // Replace container contents
      container.textContent = '';
      container.appendChild(domNode);
    } finally {
      finishRender();
    }
  });
}

/**
 * Yield every element under `root` in document order (parents before children).
 * Used by hydration to align server-rendered DOM with the VNode tree.
 */
function* walkElements(node: Node): Generator<HTMLElement> {
  for (const child of node.childNodes) {
    if (child.nodeType === 1) {
      yield child as HTMLElement;
      yield* walkElements(child);
    }
  }
}

/**
 * Hydrate a VNode tree onto existing server-rendered DOM.
 *
 * Walks the VNode tree and the existing DOM in lockstep. For each intrinsic
 * element it re-applies props to the matching existing node — which attaches
 * event listeners and normalizes attributes without destroying the DOM — so
 * the flash caused by clearing + re-rendering never happens.
 *
 * Returns false (and leaves the DOM untouched) if the existing DOM can't be
 * matched, so callers can fall back to a full render.
 */
async function hydrateElement(vnode: any, nextElement: () => HTMLElement | null): Promise<boolean> {
  if (vnode == null || typeof vnode === 'boolean') {
    return true;
  }

  if (typeof vnode === 'number' || typeof vnode === 'string') {
    return true;
  }

  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      if (!(await hydrateElement(child, nextElement))) return false;
    }
    return true;
  }

  if (typeof vnode === 'object' && 'type' in vnode && vnode.props !== undefined) {
    const { type, props } = vnode;

    if (typeof type === 'function') {
      if (type === Fragment) {
        const children = props?.children;
        if (children == null) return true;
        return hydrateElement(children, nextElement);
      }

      const root = getCurrentRoot() ?? undefined;
      prepareRender(root);
      try {
        const result = type(props || {});
        return await hydrateElement(result, nextElement);
      } finally {
        finishRender();
      }
    }

    if (typeof type === 'string') {
      const el = nextElement();
      if (!el) return false;
      if (el.tagName.toLowerCase() !== type.toLowerCase()) return false;

      applyProps(el, props || {});

      const children = props?.children;
      if (children != null) {
        const childArray = Array.isArray(children) ? children : [children];
        for (const child of childArray) {
          if (!(await hydrateElement(child, nextElement))) return false;
        }
      }
      return true;
    }

    return false;
  }

  return true;
}

/**
 * Hydrate server-rendered HTML in place.
 *
 * Attaches event listeners and applies props to the DOM produced by
 * server-side rendering without replacing it, so there is no visual flash
 * between the SSR HTML and an interactive page. Fallback: if the existing DOM
 * can't be matched, performs a fresh render into an empty container.
 */
export async function hydrate(element: VNode, container: HTMLElement): Promise<void> {
  if (!isBrowser) {
    throw new Error('[baraqex] hydrate() can only be called in a browser.');
  }
  if (!container) {
    throw new Error('[baraqex] hydrate() requires a container element');
  }

  // No server-rendered content to hydrate — just render normally.
  if (!container.hasChildNodes()) {
    return render(element, container);
  }

  let root = rootMap.get(container);
  if (!root) {
    root = createRootState();
    rootMap.set(container, root);
  }

  await batchUpdates(async () => {
    prepareRender(root);
    try {
      setRenderCallback(render as any, element, container);

      const generator = walkElements(container);
      const nextElement = () => {
        const { value, done } = generator.next();
        return done ? null : value;
      };

      const matched = await hydrateElement(element, nextElement);
      if (!matched) {
        // Structural mismatch — fall back to a fresh render on a clean root.
        const freshRoot = createRootState();
        rootMap.set(container, freshRoot);
        prepareRender(freshRoot);
        setRenderCallback(render as any, element, container);
        const domNode = await createElement(element);
        container.textContent = '';
        container.appendChild(domNode);
        finishRender();
        return;
      }
    } finally {
      finishRender();
    }
  });
}

/**
 * Create a root for React 18+ compatible API.
 */
export function createRoot(container: HTMLElement) {
  const root = createRootState();
  rootMap.set(container, root);

  return {
    render: (element: VNode) => render(element, container),
    unmount: () => {
      cleanupRoot(root);
      rootMap.delete(container);
      container.textContent = '';
    }
  };
}

/**
 * Check if a container has an active root.
 */
export function hasRoot(container: HTMLElement): boolean {
  return rootMap.has(container);
}

export default {
  render,
  hydrate,
  createRoot,
  hasRoot
};
