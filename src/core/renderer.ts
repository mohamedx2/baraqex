/**
 * Client-side renderer
 */

import { createElement } from './jsx-runtime.js';
import { prepareRender, finishRender, setRenderCallback } from './hooks.js';
import { batchUpdates } from './batch.js';

let isHydrating = false;

/**
 * Hydrate server-rendered HTML with client-side interactivity
 */
export async function hydrate(element: any, container: HTMLElement): Promise<void> {
  isHydrating = true;
  try {
    await render(element, container);
  } finally {
    isHydrating = false;
  }
}

/**
 * Render a virtual DOM tree to the DOM
 */
export async function render(element: any, container: HTMLElement): Promise<void> {
  if (!container) {
    throw new Error('Render target container is required');
  }
  
  batchUpdates(async () => {
    const rendererId = prepareRender();
    try {
      setRenderCallback(render, element, container);
      const domNode = await createElement(element);
      
      if (!isHydrating) {
        container.innerHTML = '';
      }
      container.appendChild(domNode);
      
    } finally {
      finishRender();
    }
  });
}

/**
 * Create a root for concurrent rendering (React 18+ compatible API)
 */
export function createRoot(container: HTMLElement) {
  return {
    render: (element: any) => render(element, container),
    unmount: () => {
      container.innerHTML = '';
    }
  };
}

/**
 * Check if currently hydrating
 */
export function getIsHydrating(): boolean {
  return isHydrating;
}

export default {
  render,
  hydrate,
  createRoot,
  getIsHydrating
};
