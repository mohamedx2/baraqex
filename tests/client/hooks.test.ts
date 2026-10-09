/**
 * Regression tests for hook-state persistence across render passes.
 *
 * A render pass must assign deterministic component ids so that useState /
 * useEffect keep their state between re-renders. Prior to the fix in
 * renderer.ts, nextComponentId was never reset between passes, so every
 * re-render got a fresh component id and all hook state was lost — which
 * caused an infinite re-render loop for any component whose effect called
 * setState (e.g. the fullstack template's HomePage on first load).
 */

import {
  type RootState,
  createRootState,
  beginRenderPass,
  prepareRender,
  finishRender,
  useState,
  getComponentState
} from '../../src/core/hooks.js';

/** Replicates createElement/hydrateElement entering a function component. */
function renderComponent(root: RootState): void {
  prepareRender(root);
}

describe('hook state persistence across render passes', () => {
  test('useState keeps its value across re-renders (same tree position)', () => {
    const root = createRootState();

    function component(): number {
      const [count] = useState(0);
      return count;
    }

    beginRenderPass(root);
    renderComponent(root);
    const first = component();
    finishRender();

    // Simulate a state update between passes.
    getComponentState(root, 2).states[0] = 42;

    beginRenderPass(root);
    renderComponent(root);
    const second = component();
    finishRender();

    expect(first).toBe(0);
    expect(second).toBe(42);
  });

  test('useState state does not reset to initial on re-render', () => {
    const root = createRootState();

    let setCountFn: ((v: number) => void) | null = null;
    function component(): number {
      const [count, setCount] = useState(0);
      setCountFn = setCount;
      return count;
    }

    beginRenderPass(root);
    renderComponent(root);
    const first = component();
    finishRender();

    setCountFn!(7);

    beginRenderPass(root);
    renderComponent(root);
    const second = component();
    finishRender();

    expect(first).toBe(0);
    expect(second).toBe(7);
  });

  test('component ids are stable and reuse state across passes', () => {
    const root = createRootState();

    function component(): number {
      const [count] = useState(10);
      return count;
    }

    beginRenderPass(root);
    renderComponent(root);
    component();
    finishRender();

    beginRenderPass(root);
    renderComponent(root);
    component();
    finishRender();

    beginRenderPass(root);
    renderComponent(root);
    component();
    finishRender();

    // Same id (2) reused on every pass → exactly one component state alive.
    expect(getComponentState(root, 2).states.length).toBe(1);
    expect(root.components.size).toBe(1);
  });
});