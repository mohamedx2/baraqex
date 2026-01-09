/**
 * Batch updates utility for efficient rendering
 */

export let isBatching = false;
const queue: Function[] = [];

export function batchUpdates(fn: Function) {
  if (isBatching) {
    queue.push(fn);
    return;
  }

  isBatching = true;
  try {
    fn();
    while (queue.length > 0) {
      const nextFn = queue.shift();
      nextFn?.();
    }
  } finally {
    isBatching = false;
  }
}

export function getIsBatching() {
  return isBatching;
}
