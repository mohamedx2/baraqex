/**
 * Context API for passing data through the component tree
 */

const contexts = new Map<symbol, any>();
let currentRender: Function | null = null;

export interface Context<T> {
  Provider: (props: { value: T; children?: any }) => any;
  Consumer: (props: { children: (value: T) => any }) => any;
  _id: symbol;
  _defaultValue: T;
  useSelector: <S>(selector: (state: T) => S) => S;
}

export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol('context');
  
  const context: Context<T> = {
    Provider: ({ value, children }: { value: T, children?: any }) => {
      contexts.set(id, value);
      return children;
    },
    Consumer: ({ children }: { children: (value: T) => any }) => {
      const value = contexts.has(id) ? contexts.get(id) : defaultValue;
      return children(value);
    },
    _id: id,
    _defaultValue: defaultValue,
    useSelector: <S>(selector: (state: T) => S) => {
      const value = contexts.has(id) ? contexts.get(id) : defaultValue;
      return selector(value);
    }
  };

  return context;
}

export function useContext<T>(context: Context<T>): T {
  if (contexts.has(context._id)) {
    return contexts.get(context._id);
  }
  return context._defaultValue;
}

export function getContextValue<T>(context: Context<T>): T {
  return useContext(context);
}
