/**
 * React-like Hooks Implementation
 */

import { createContext, useContext } from './context.js';

// Current render ID counter
let currentRender = 0;

// State storage
const states = new Map<number, any[]>();
const stateIndices = new Map<number, number>();
const effects = new Map<number, { callback: () => void | (() => void); deps?: any[]; cleanup?: () => void }[]>();
const memos = new Map<number, { value: any; deps?: any[] }[]>();
const refs = new Map<number, { current: any }[]>();

// Server-side rendering detection
const isServer = typeof window === 'undefined';
const serverStates = new Map<number, Map<number, any>>();

// Rendering callbacks
let globalRenderCallback: any = null;
let globalContainer: any = null;
let currentElement: any = null;

export function setRenderCallback(callback: any, element: any, container: any): void {
  globalRenderCallback = callback;
  globalContainer = container;
  currentElement = element;
}

export function prepareRender(): number {
  currentRender++;
  stateIndices.set(currentRender, 0);
  return currentRender;
}

export function finishRender(): void {
  if (isServer) {
    serverStates.delete(currentRender);
  }
  currentRender = 0;
}

export function getCurrentRender(): number {
  return currentRender;
}

/**
 * useState hook - manages component state
 */
export function useState<T>(initial: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  if (!currentRender) {
    console.warn('useState called outside of render context');
    return [initial, () => {}];
  }

  // Handle server-side rendering separately
  if (isServer) {
    if (!serverStates.has(currentRender)) {
      serverStates.set(currentRender, new Map());
    }
    const stateMap = serverStates.get(currentRender)!;
    const index = stateIndices.get(currentRender) || 0;
    stateIndices.set(currentRender, index + 1);

    if (!stateMap.has(index)) {
      stateMap.set(index, initial);
    }

    const state = stateMap.get(index);
    const setState = (newValue: T | ((prev: T) => T)) => {
      const value = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(stateMap.get(index))
        : newValue;
      stateMap.set(index, value);
    };

    return [state, setState];
  }

  // Client-side implementation
  if (!states.has(currentRender)) {
    states.set(currentRender, []);
  }
  
  const componentStates = states.get(currentRender)!;
  const index = stateIndices.get(currentRender) || 0;
  
  if (index >= componentStates.length) {
    componentStates.push(initial);
  }
  
  const state = componentStates[index];
  const rendererId = currentRender;
  
  const setState = (newValue: T | ((prev: T) => T)) => {
    const currentStates = states.get(rendererId);
    if (!currentStates) return;
    
    const currentState = currentStates[index];
    const value = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(currentState)
      : newValue;
    
    if (Object.is(currentState, value)) return;
    
    currentStates[index] = value;
    rerender(rendererId);
  };
  
  stateIndices.set(currentRender, index + 1);
  return [state, setState];
}

/**
 * useEffect hook - handles side effects
 */
export function useEffect(callback: () => void | (() => void), deps?: any[]): void {
  if (!currentRender || isServer) return;
  
  if (!effects.has(currentRender)) {
    effects.set(currentRender, []);
  }
  
  const componentEffects = effects.get(currentRender)!;
  const index = componentEffects.length;
  const prevEffect = componentEffects[index];
  
  // Check if deps changed
  const shouldRun = !prevEffect || !deps || !prevEffect.deps || 
    deps.some((dep, i) => !Object.is(dep, prevEffect.deps?.[i]));
  
  if (shouldRun) {
    // Run cleanup from previous effect
    if (prevEffect?.cleanup) {
      prevEffect.cleanup();
    }
    
    // Schedule effect to run after render
    queueMicrotask(() => {
      const cleanup = callback();
      componentEffects[index] = {
        callback,
        deps,
        cleanup: typeof cleanup === 'function' ? cleanup : undefined
      };
    });
  }
  
  if (!prevEffect) {
    componentEffects.push({ callback, deps });
  }
}

/**
 * useMemo hook - memoizes expensive computations
 */
export function useMemo<T>(factory: () => T, deps?: any[]): T {
  if (!currentRender) {
    return factory();
  }
  
  if (!memos.has(currentRender)) {
    memos.set(currentRender, []);
  }
  
  const componentMemos = memos.get(currentRender)!;
  const index = stateIndices.get(currentRender) || 0;
  stateIndices.set(currentRender, index + 1);
  
  const prevMemo = componentMemos[index];
  
  // Check if deps changed
  const shouldRecalculate = !prevMemo || !deps || !prevMemo.deps ||
    deps.some((dep, i) => !Object.is(dep, prevMemo.deps?.[i]));
  
  if (shouldRecalculate) {
    const value = factory();
    componentMemos[index] = { value, deps };
    return value;
  }
  
  return prevMemo.value;
}

/**
 * useCallback hook - memoizes callbacks
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  return useMemo(() => callback, deps);
}

/**
 * useRef hook - creates a mutable ref object
 */
export function useRef<T>(initial: T): { current: T } {
  if (!currentRender) {
    return { current: initial };
  }
  
  if (!refs.has(currentRender)) {
    refs.set(currentRender, []);
  }
  
  const componentRefs = refs.get(currentRender)!;
  const index = stateIndices.get(currentRender) || 0;
  stateIndices.set(currentRender, index + 1);
  
  if (index >= componentRefs.length) {
    componentRefs.push({ current: initial });
  }
  
  return componentRefs[index];
}

/**
 * useReducer hook - manages complex state with a reducer
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
 * useLayoutEffect hook - runs synchronously after DOM mutations
 */
export function useLayoutEffect(callback: () => void | (() => void), deps?: any[]): void {
  // In SSR, useLayoutEffect should not run
  if (isServer) return;
  
  // On client, behave like useEffect but run synchronously
  useEffect(callback, deps);
}

/**
 * useErrorBoundary hook - catches errors in child components
 */
export function useErrorBoundary(): [Error | null, () => void] {
  const [error, setError] = useState<Error | null>(null);
  const resetError = () => setError(null);
  return [error, resetError];
}

/**
 * useId hook - generates stable unique IDs
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
 * Trigger a re-render for a specific component
 */
async function rerender(rendererId: number): Promise<void> {
  if (!globalRenderCallback || !currentElement || !globalContainer) {
    console.warn('Cannot rerender: missing render context');
    return;
  }
  
  try {
    await globalRenderCallback(currentElement, globalContainer);
  } catch (error) {
    console.error('Error during rerender:', error);
  }
}

/**
 * Cleanup all hooks state for a component
 */
export function cleanupHooks(rendererId: number): void {
  // Run effect cleanups
  const componentEffects = effects.get(rendererId);
  if (componentEffects) {
    componentEffects.forEach(effect => {
      if (effect.cleanup) {
        effect.cleanup();
      }
    });
  }
  
  // Clear all state
  states.delete(rendererId);
  stateIndices.delete(rendererId);
  effects.delete(rendererId);
  memos.delete(rendererId);
  refs.delete(rendererId);
}

// Re-export context hooks
export { createContext, useContext };
