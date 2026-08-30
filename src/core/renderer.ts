/**
 * Client-side renderer
 *
 * Each render call creates a RootState that holds all hook state for that
 * render tree. The renderer tracks the previous VNode so we can diff on
 * re-renders instead of tearing down the entire DOM.
 */

import { createElement } from './jsx-runtime.js';
import {
  prepareRender,
  finishRender,
  setRenderCallback,
  createRootState,
  cleanupRoot,
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
 * Hydrate server-rendered HTML.
 *
 * In this initial implementation, hydration re-renders the component tree
 * and replaces the server HTML. A production implementation would walk the
 * existing DOM, attach event listeners, and reconcile without full replace.
 */
export async function hydrate(element: VNode, container: HTMLElement): Promise<void> {
  // For now, hydration = render. A real implementation would:
  // 1. Walk existing child nodes
  // 2. Match them against the VNode tree
  // 3. Attach event listeners without replacing DOM
  await render(element, container);
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
