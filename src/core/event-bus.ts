/**
 * Event Bus for cross-component communication
 */

export type EventHandler = (...args: any[]) => void;

export interface EventBus {
  on(event: string, handler: EventHandler): () => void;
  once(event: string, handler: EventHandler): () => void;
  off(event: string, handler?: EventHandler): void;
  emit(event: string, ...args: any[]): void;
  clear(event?: string): void;
}

/**
 * Create a new event bus instance
 */
export function createEventBus(): EventBus {
  const events = new Map<string, Set<EventHandler>>();
  const onceHandlers = new WeakMap<EventHandler, EventHandler>();
  
  const on = (event: string, handler: EventHandler): (() => void) => {
    if (!events.has(event)) {
      events.set(event, new Set());
    }
    
    events.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => off(event, handler);
  };
  
  const once = (event: string, handler: EventHandler): (() => void) => {
    const onceWrapper: EventHandler = (...args: any[]) => {
      handler(...args);
      off(event, onceWrapper);
    };
    
    onceHandlers.set(handler, onceWrapper);
    return on(event, onceWrapper);
  };
  
  const off = (event: string, handler?: EventHandler): void => {
    if (!handler) {
      events.delete(event);
      return;
    }
    
    const handlers = events.get(event);
    if (!handlers) return;
    
    handlers.delete(handler);
    
    // Also try to remove the once wrapper
    const onceWrapper = onceHandlers.get(handler);
    if (onceWrapper) {
      handlers.delete(onceWrapper);
      onceHandlers.delete(handler);
    }
    
    if (handlers.size === 0) {
      events.delete(event);
    }
  };
  
  const emit = (event: string, ...args: any[]): void => {
    const handlers = events.get(event);
    if (!handlers) return;
    
    // Create a copy to avoid issues if handlers modify the set
    const handlersCopy = Array.from(handlers);
    for (const handler of handlersCopy) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    }
  };
  
  const clear = (event?: string): void => {
    if (event) {
      events.delete(event);
    } else {
      events.clear();
    }
  };
  
  return { on, once, off, emit, clear };
}

// Global event bus instance
export const eventBus = createEventBus();

/**
 * Hook to subscribe to events in components
 */
export function useEvent(
  event: string,
  handler: EventHandler,
  options: { once?: boolean } = {}
): () => void {
  return options.once
    ? eventBus.once(event, handler)
    : eventBus.on(event, handler);
}

export default {
  createEventBus,
  eventBus,
  useEvent
};
