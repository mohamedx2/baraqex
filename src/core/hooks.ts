/**
 * Hooks Implementation
 *
 * Each render root maintains its own isolated state via a RootState object.
 * The module-level currentRoot/currentComponentId/hookIndex are set before
 * each render call so hooks can find their data.
 */

import { createContext, useContext } from './context.js';

// ---------------------------------------------------------------------------
// Root-scoped state store
// ---------------------------------------------------------------------------

export interface ComponentState {
  states: any[];
  effects: { callback: () => void | (() => void); deps?: any[]; cleanup?: () => void }[];
  memos: { value: any; deps?: any[] }[];
  refs: { current: any }[];
}

export interface RootState {
  id: number;
  components: Map<number, ComponentState>;
  nextComponentId: number;
  renderCallback: ((element: any, container: HTMLElement) => Promise<void>) | null;
  container: HTMLElement | null;
  currentElement: any;
}

let rootIdCounter = 0;

export function createRootState(): RootState {
  return {
    id: ++rootIdCounter,
    components: new Map(),
    nextComponentId: 0,
    renderCallback: null,
    container: null,
    currentElement: null
  };
}

// ---------------------------------------------------------------------------
// Current render context (set per render call)
// ---------------------------------------------------------------------------

let currentRoot: RootState | null = null;
let currentComponentId: number | null = null;
let hookIndex = 0;

const isServer = typeof window === 'undefined';

// ---------------------------------------------------------------------------
// Render lifecycle helpers
// ---------------------------------------------------------------------------

export function prepareRender(root?: RootState, componentId?: number): number {
  if (root) {
    currentRoot = root;
  }
  if (componentId !== undefined) {
    currentComponentId = componentId;
  } else if (currentRoot) {
    currentComponentId = ++currentRoot.nextComponentId;
  }
  hookIndex = 0;
  return currentComponentId || 0;
}

export function finishRender(): void {
  currentComponentId = null;
}

export function getCurrentRoot(): RootState | null {
  return currentRoot;
}

export function setCurrentRoot(root: RootState | null): void {
  currentRoot = root;
}

export function getComponentState(root: RootState, compId: number): ComponentState {
  let state = root.components.get(compId);
  if (!state) {
    state = { states: [], effects: [], memos: [], refs: [] };
    root.components.set(compId, state);
  }
  return state;
}

// ---------------------------------------------------------------------------
// setRenderCallback — bind a root to a re-render function
// ---------------------------------------------------------------------------

export function setRenderCallback(
  callback: (element: any, container: HTMLElement) => Promise<void>,
  element: any,
  container: HTMLElement
): void {
  if (!currentRoot) return;
  currentRoot.renderCallback = callback;
  currentRoot.currentElement = element;
  currentRoot.container = container;
}

export function getCurrentRender(): number {
  return currentComponentId || 0;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * useState — manages component state
 */
export function useState<T>(initial: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  const root = currentRoot;
  const compId = currentComponentId;

  if (!root || compId === null) {
    if (isServer) {
      // During SSR, return the initial value with a no-op setter
      return [initial, () => {}];
    }
    console.warn('useState called outside of render context');
    return [initial, () => {}];
  }

  const compState = getComponentState(root, compId);
  const currentIndex = hookIndex;
  hookIndex++;

  if (currentIndex >= compState.states.length) {
    compState.states.push(initial);
  }

  const state = compState.states[currentIndex];

  const setState = (newValue: T | ((prev: T) => T)) => {
    const currentState = compState.states[currentIndex];
    const value = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(currentState)
      : newValue;

    if (Object.is(currentState, value)) return;

    compState.states[currentIndex] = value;

    // Trigger re-render via root's callback
    if (root.renderCallback && root.container && root.currentElement) {
      root.renderCallback(root.currentElement, root.container);
    }
  };

  return [state, setState];
}

/**
 * useEffect — handles side effects, runs after render
 */
export function useEffect(callback: () => void | (() => void), deps?: any[]): void {
  const root = currentRoot;
  const compId = currentComponentId;
  if (!root || compId === null || isServer) return;

  const compState = getComponentState(root, compId);
  const currentIndex = hookIndex;
  hookIndex++;

  const prevEffect = compState.effects[currentIndex];

  const shouldRun = !prevEffect || !deps || !prevEffect.deps ||
    deps.some((dep, i) => !Object.is(dep, prevEffect.deps?.[i]));

  if (shouldRun) {
    if (prevEffect?.cleanup) {
      prevEffect.cleanup();
    }

    queueMicrotask(() => {
      const cleanup = callback();
      compState.effects[currentIndex] = {
        callback,
        deps,
        cleanup: typeof cleanup === 'function' ? cleanup : undefined
      };
    });
  }

  if (!prevEffect) {
    compState.effects.push({ callback, deps });
  }
}

/**
 * useLayoutEffect — runs synchronously after DOM mutations (client only)
 */
export function useLayoutEffect(callback: () => void | (() => void), deps?: any[]): void {
  if (isServer) return;

  const root = currentRoot;
  const compId = currentComponentId;
  if (!root || compId === null) return;

  const compState = getComponentState(root, compId);
  const currentIndex = hookIndex;
  hookIndex++;

  const prevEffect = compState.effects[currentIndex];

  const shouldRun = !prevEffect || !deps || !prevEffect.deps ||
    deps.some((dep, i) => !Object.is(dep, prevEffect.deps?.[i]));

  if (shouldRun) {
    if (prevEffect?.cleanup) {
      prevEffect.cleanup();
    }

    // Run synchronously (unlike useEffect which uses queueMicrotask)
    const cleanup = callback();
    compState.effects[currentIndex] = {
      callback,
      deps,
      cleanup: typeof cleanup === 'function' ? cleanup : undefined
    };
  }

  if (!prevEffect) {
    compState.effects.push({ callback, deps });
  }
}

/**
 * useMemo — memoizes expensive computations
 */
export function useMemo<T>(factory: () => T, deps?: any[]): T {
  const root = currentRoot;
  const compId = currentComponentId;

  if (!root || compId === null) {
    return factory();
  }

  const compState = getComponentState(root, compId);
  const currentIndex = hookIndex;
  hookIndex++;

  const prevMemo = compState.memos[currentIndex];

  const shouldRecalculate = !prevMemo || !deps || !prevMemo.deps ||
    deps.some((dep, i) => !Object.is(dep, prevMemo.deps?.[i]));

  if (shouldRecalculate) {
    const value = factory();
    compState.memos[currentIndex] = { value, deps };
    return value;
  }

  return prevMemo.value;
}

/**
 * useCallback — memoizes callbacks
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  return useMemo(() => callback, deps);
}

/**
 * useRef — creates a mutable ref object
 */
export function useRef<T>(initial: T): { current: T } {
  const root = currentRoot;
  const compId = currentComponentId;

  if (!root || compId === null) {
    return { current: initial };
  }

  const compState = getComponentState(root, compId);
  const currentIndex = hookIndex;
  hookIndex++;

  if (compState.refs[currentIndex] === undefined) {
    compState.refs[currentIndex] = { current: initial };
  }

  return compState.refs[currentIndex];
}

/**
 * useReducer — manages complex state with a reducer
 */
export function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
): [S, (action: A) => void] {
  const [state, setState] = useState(initialState);

  const dispatch = (action: A) => {
    setState((prevState) => reducer(prevState, action));
  };

  return [state, dispatch];
}

/**
 * useErrorBoundary — catches errors in child components
 */
export function useErrorBoundary(): [Error | null, () => void] {
  const [error, setError] = useState<Error | null>(null);
  const resetError = () => setError(null);
  return [error, resetError];
}

/**
 * useId — generates stable unique IDs
 */
let idCounter = 0;
export function useId(): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = `baraqex-id-${++idCounter}`;
  }
  return ref.current;
}

/**
 * Cleanup all hook state for a component within a root
 */
export function cleanupHooks(root: RootState, compId: number): void {
  const compState = root.components.get(compId);
  if (compState) {
    compState.effects.forEach(effect => {
      if (effect.cleanup) effect.cleanup();
    });
    root.components.delete(compId);
  }
}

/**
 * Cleanup all state for an entire root
 */
export function cleanupRoot(root: RootState): void {
  root.components.forEach((compState) => {
    compState.effects.forEach(effect => {
      if (effect.cleanup) effect.cleanup();
    });
  });
  root.components.clear();
}

// Re-export context hooks
export { createContext, useContext };
