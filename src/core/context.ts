/**
 * Context API for passing data through the component tree
 *
 * Uses a context stack to support nested providers of the same context.
 * Each Provider pushes its value onto the stack; useContext reads from the top.
 */

export interface Context<T> {
  Provider: (props: { value: T; children?: any }) => any;
  Consumer: (props: { children: (value: T) => any }) => any;
  _id: symbol;
  _defaultValue: T;
  useSelector: <S>(selector: (state: T) => S) => S;
}

// Per-context value stack: the last pushed value wins (most-recent Provider)
const contextStacks = new Map<symbol, any[]>();

export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol('context');
  contextStacks.set(id, []);

  const context: Context<T> = {
    Provider: ({ value, children }: { value: T; children?: any }) => {
      const stack = contextStacks.get(id)!;
      stack.push(value);
      // We rely on the fact that the render tree processes children synchronously
      // before unwinding. If it doesn't we need a different approach.
      const result = children;
      stack.pop();
      return result;
    },
    Consumer: ({ children }: { children: (value: T) => any }) => {
      const stack = contextStacks.get(id);
      const value = stack && stack.length > 0 ? stack[stack.length - 1] : defaultValue;
      return children(value);
    },
    _id: id,
    _defaultValue: defaultValue,
    useSelector: <S>(selector: (state: T) => S) => {
      const stack = contextStacks.get(id);
      const value = stack && stack.length > 0 ? stack[stack.length - 1] : defaultValue;
      return selector(value);
    }
  };

  return context;
}

export function useContext<T>(context: Context<T>): T {
  const stack = contextStacks.get(context._id);
  if (stack && stack.length > 0) {
    return stack[stack.length - 1];
  }
  return context._defaultValue;
}

export function getContextValue<T>(context: Context<T>): T {
  return useContext(context);
}
