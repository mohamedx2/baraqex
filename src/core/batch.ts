/**
 * Batch updates utility for efficient rendering
 *
 * Supports both sync and async batched functions. When an async function is
 * passed, it is awaited and any queued micro-tasks are drained afterwards.
 */

export let isBatching = false;
const syncQueue: Function[] = [];
const asyncQueue: (() => Promise<void>)[] = [];

export async function batchUpdates(fn: (() => void) | (() => Promise<void>)): Promise<void> {
  if (isBatching) {
    // Nested batching — queue and return
    if (fn.constructor.name === 'AsyncFunction') {
      asyncQueue.push(fn as () => Promise<void>);
    } else {
      syncQueue.push(fn);
    }
    return;
  }

  isBatching = true;
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }

    // Drain sync queue
    while (syncQueue.length > 0) {
      const nextFn = syncQueue.shift()!;
      nextFn();
    }

    // Drain async queue
    while (asyncQueue.length > 0) {
      const nextFn = asyncQueue.shift()!;
      await nextFn();
    }
  } finally {
    isBatching = false;
  }
}

export function getIsBatching(): boolean {
  return isBatching;
}
