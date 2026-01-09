/**
 * Global State Management (Redux-like store)
 */

import { createContext, useContext } from './context.js';
import { useState, useEffect, useRef } from './hooks.js';
import { jsx } from './jsx-runtime.js';
import { VNode } from './types.js';

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export type Reducer<S, A extends Action = Action> = (state: S, action: A) => S;

export type Dispatch<A extends Action = Action> = (action: A) => void;

export type Selector<S, R> = (state: S) => R;

export type Middleware<S> = (store: Store<S>) => (next: Dispatch) => (action: Action) => void;

export interface Store<S> {
  getState: () => S;
  dispatch: Dispatch;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (nextReducer: Reducer<S>) => void;
}

export type AsyncAction<S> = (dispatch: Dispatch, getState: () => S) => Promise<void> | void;

/**
 * Create a Redux-like store
 */
export function createStore<S>(
  reducer: Reducer<S>,
  initialState: S,
  middlewares: Middleware<S>[] = []
): Store<S> {
  let state = initialState;
  let listeners: Set<() => void> = new Set();
  let currentReducer = reducer;
  
  const getState = () => state;
  
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  
  // Base dispatch
  let dispatch: Dispatch = (action: Action) => {
    state = currentReducer(state, action);
    listeners.forEach(listener => listener());
  };
  
  // Apply middlewares
  if (middlewares.length > 0) {
    const store = { getState, dispatch, subscribe, replaceReducer: () => {} };
    const chain = middlewares.map(middleware => middleware(store as Store<S>));
    dispatch = chain.reduceRight(
      (next, middleware) => middleware(next),
      dispatch
    );
  }
  
  const replaceReducer = (nextReducer: Reducer<S>) => {
    currentReducer = nextReducer;
  };
  
  // Dispatch init action
  dispatch({ type: '@@INIT' });
  
  return {
    getState,
    dispatch,
    subscribe,
    replaceReducer
  };
}

/**
 * Combine multiple reducers into one
 */
export function combineReducers<S extends Record<string, any>>(
  reducers: { [K in keyof S]: Reducer<S[K]> }
): Reducer<S> {
  return (state: S, action: Action): S => {
    const nextState: Partial<S> = {};
    let hasChanged = false;
    
    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    
    return hasChanged ? (nextState as S) : state;
  };
}

// Store context
interface StoreContextValue<S = any> {
  store: Store<S>;
  state: S;
}

export const StoreContext = createContext<StoreContextValue>({
  store: {
    getState: () => ({}),
    dispatch: () => {},
    subscribe: () => () => {},
    replaceReducer: () => {}
  },
  state: {}
});

/**
 * Store Provider component
 */
export function StoreProvider<S>({ 
  store, 
  children 
}: { 
  store: Store<S>; 
  children: any 
}): VNode {
  const [state, setState] = useState(store.getState());
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, [store]);
  
  return jsx(StoreContext.Provider, {
    value: { store, state },
    children
  });
}

/**
 * Hook to select state from the store
 */
export function useSelector<S, R>(selector: Selector<S, R>): R {
  const { state } = useContext(StoreContext) as StoreContextValue<S>;
  return selector(state);
}

/**
 * Hook to get the dispatch function
 */
export function useDispatch<A extends Action = Action>(): Dispatch<A> {
  const { store } = useContext(StoreContext);
  return store.dispatch as Dispatch<A>;
}

/**
 * Hook to get the entire store
 */
export function useStore<S>(): Store<S> {
  const { store } = useContext(StoreContext);
  return store as Store<S>;
}

// Common Middlewares

/**
 * Logger middleware - logs actions and state changes
 */
export const logger: Middleware<any> = (store) => (next) => (action) => {
  console.group(`Action: ${action.type}`);
  console.log('Payload:', action.payload);
  console.log('Previous State:', store.getState());
  const result = next(action);
  console.log('Next State:', store.getState());
  console.groupEnd();
  return result;
};

/**
 * Thunk middleware - enables async actions
 */
export const thunk: Middleware<any> = (store) => (next) => (action: any) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

/**
 * DevTools middleware - integrates with Redux DevTools
 */
export const devTools: Middleware<any> = (store) => (next) => (action) => {
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    const devToolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    devToolsExtension.send(action, store.getState());
  }
  return next(action);
};

/**
 * Create an action creator
 */
export function createAction<P = void>(type: string) {
  const actionCreator = (payload: P): Action<P> => ({ type, payload });
  actionCreator.type = type;
  actionCreator.match = (action: Action): action is Action<P> => action.type === type;
  return actionCreator;
}

/**
 * Create a slice (reducer + actions)
 */
export interface SliceConfig<S, R extends Record<string, (state: S, action: Action<any>) => S>> {
  name: string;
  initialState: S;
  reducers: R;
}

export function createSlice<
  S,
  R extends Record<string, (state: S, action: Action<any>) => S>
>(config: SliceConfig<S, R>) {
  const { name, initialState, reducers } = config;
  
  const actions: Record<string, (payload?: any) => Action> = {};
  
  for (const key in reducers) {
    const type = `${name}/${key}`;
    actions[key] = (payload?: any) => ({ type, payload });
  }
  
  const reducer: Reducer<S> = (state = initialState, action) => {
    for (const key in reducers) {
      const type = `${name}/${key}`;
      if (action.type === type) {
        return reducers[key](state, action);
      }
    }
    return state;
  };
  
  return {
    name,
    reducer,
    actions
  };
}

export default {
  createStore,
  combineReducers,
  StoreProvider,
  useSelector,
  useDispatch,
  useStore,
  logger,
  thunk,
  devTools,
  createAction,
  createSlice,
  StoreContext
};
