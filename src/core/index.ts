/**
 * Baraqex Core — Standalone Frontend Framework
 *
 * A reactive framework with virtual DOM, hooks, SSR, and routing.
 */

// Core Virtual DOM
export {
  VNode,
  Component as ComponentType,
  FC,
  RefObject,
  Props,
  PropsWithChildren
} from './types.js';

// Batch updates
export { batchUpdates, getIsBatching } from './batch.js';

// Context API
export { createContext, useContext, getContextValue, Context } from './context.js';

// Hooks
export {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useReducer,
  useLayoutEffect,
  useErrorBoundary,
  useId,
  prepareRender,
  finishRender,
  cleanupHooks,
  cleanupRoot,
  createRootState,
  setCurrentRoot,
  getCurrentRoot,
  type RootState
} from './hooks.js';

// JSX Runtime
export {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
  createElement,
  createElementSync
} from './jsx-runtime.js';

// Client Renderer
export {
  render,
  hydrate,
  createRoot,
  hasRoot
} from './renderer.js';

// Server Renderer
export {
  renderToString,
  renderToStringWithData,
  renderToStream
} from './server-renderer.js';

// Virtual DOM Diffing
export {
  diff,
  shouldComponentUpdate,
  calculatePatches,
  applyPatches,
  Patch
} from './vdom.js';

// Class Components
export {
  Component,
  PureComponent,
  createClassComponent
} from './component.js';

// Event Bus
export {
  createEventBus,
  eventBus,
  useEvent,
  EventBus
} from './event-bus.js';

// Router
export {
  RouterProvider,
  Router,
  Route,
  Switch,
  Link,
  NavLink,
  Redirect,
  useRouter,
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
  useMatch,
  RouterContext
} from './router.js';

// Forms
export {
  useForm,
  useField,
  patterns,
  FormConfig,
  FormField,
  FormState,
  FormOptions,
  ValidationRule
} from './forms.js';

// State Management (Store)
export {
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
  StoreContext,
  Store,
  Action,
  Reducer,
  Dispatch,
  Selector,
  Middleware
} from './store.js';

// Lifecycle Events
export {
  LifecycleEvents,
  emitAppInit,
  emitAppMounted,
  emitAppUpdated,
  emitAppError,
  emitAppDestroyed,
  emitComponentCreated,
  emitComponentMounted,
  emitComponentUpdated,
  emitComponentError,
  emitComponentUnmounted,
  emitRouterBeforeChange,
  emitRouterAfterChange,
  emitRouterError,
  emitStoreInitialized,
  emitStoreBeforeAction,
  emitStoreAfterAction,
  emitStoreError,
  onAppInit,
  onAppMounted,
  onAppUpdated,
  onAppError,
  onAppDestroyed,
  onComponentCreated,
  onComponentMounted,
  onComponentUpdated,
  onComponentError,
  onComponentUnmounted,
  onRouterBeforeChange,
  onRouterAfterChange,
  onRouterError,
  onStoreInitialized,
  onStoreBeforeAction,
  onStoreAfterAction,
  onStoreError
} from './lifecycle-events.js';

// Utilities
export {
  debounce,
  throttle,
  deepClone,
  deepMerge,
  memoize,
  uuid,
  formatDate,
  shallowEqual,
  deepEqual,
  escapeHtml,
  unescapeHtml,
  capitalize,
  camelCase,
  kebabCase,
  sleep,
  retry,
  deferred,
  pick,
  omit,
  groupBy,
  isEmpty,
  clamp,
  get,
  set
} from './utils.js';

// Errors
export {
  BaraqexError,
  ConfigError,
  DatabaseError,
  AuthError,
  RouterError,
  WasmError,
  ValidationError,
  withErrorHandling
} from './errors.js';

// Re-export types
export * from './types.js';
