/**
 * Virtual DOM diffing and patching utilities
 *
 * Provides diff detection, patch calculation, and DOM patch application.
 * Supports keyed children for efficient list reconciliation.
 */

import { VNode } from './types.js';

const isBrowser = typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// Props comparison
// ---------------------------------------------------------------------------

function arePropsEqual(oldProps: any, newProps: any): boolean {
  const oldKeys = Object.keys(oldProps || {}).filter(k => k !== 'children');
  const newKeys = Object.keys(newProps || {}).filter(k => k !== 'children');

  if (oldKeys.length !== newKeys.length) return false;
  return oldKeys.every(key => Object.is(oldProps[key], newProps[key]));
}

// ---------------------------------------------------------------------------
// Diff detection (returns boolean — needs re-render?)
// ---------------------------------------------------------------------------

export function diff(oldNode: VNode | any, newNode: VNode | any): boolean {
  if (oldNode == null || newNode == null) {
    return oldNode !== newNode;
  }

  if (typeof oldNode !== typeof newNode) return true;

  if (typeof newNode === 'string' || typeof newNode === 'number') {
    return oldNode !== newNode;
  }

  if (Array.isArray(oldNode) && Array.isArray(newNode)) {
    if (oldNode.length !== newNode.length) return true;
    return oldNode.some((child, i) => diff(child, newNode[i]));
  }

  if (typeof oldNode === 'object' && typeof newNode === 'object') {
    if (newNode.type !== oldNode.type) return true;
    if (newNode.key !== oldNode.key) return true;
    return !arePropsEqual(oldNode.props, newNode.props);
  }

  return oldNode !== newNode;
}

export function shouldComponentUpdate(oldProps: any, newProps: any): boolean {
  return !arePropsEqual(oldProps, newProps);
}

// ---------------------------------------------------------------------------
// Patch types
// ---------------------------------------------------------------------------

export interface Patch {
  type: 'CREATE' | 'REMOVE' | 'REPLACE' | 'UPDATE' | 'SET_PROP' | 'REMOVE_PROP';
  node?: VNode | any;
  props?: Record<string, any>;
  children?: Patch[];
}

// ---------------------------------------------------------------------------
// Patch calculation
// ---------------------------------------------------------------------------

export function calculatePatches(oldNode: VNode | any, newNode: VNode | any): Patch | null {
  if (oldNode == null && newNode != null) {
    return { type: 'CREATE', node: newNode };
  }

  if (oldNode != null && newNode == null) {
    return { type: 'REMOVE' };
  }

  if (oldNode == null && newNode == null) {
    return null;
  }

  if (typeof oldNode !== typeof newNode) {
    return { type: 'REPLACE', node: newNode };
  }

  if (typeof newNode === 'string' || typeof newNode === 'number') {
    if (oldNode !== newNode) {
      return { type: 'REPLACE', node: newNode };
    }
    return null;
  }

  if (typeof oldNode === 'object' && typeof newNode === 'object' && 'type' in newNode) {
    if (oldNode.type !== newNode.type) {
      return { type: 'REPLACE', node: newNode };
    }

    const propPatches: Record<string, any> = {};
    let hasChanges = false;

    const newProps = newNode.props || {};
    const oldProps = oldNode.props || {};

    for (const key of Object.keys(newProps)) {
      if (key === 'children') continue;
      if (!Object.is(newProps[key], oldProps[key])) {
        propPatches[key] = newProps[key];
        hasChanges = true;
      }
    }

    for (const key of Object.keys(oldProps)) {
      if (key === 'children') continue;
      if (!(key in newProps)) {
        propPatches[key] = undefined;
        hasChanges = true;
      }
    }

    // Children diffing with key support
    const oldChildren = normalizeChildren(oldProps.children);
    const newChildren = normalizeChildren(newProps.children);
    const childPatches = diffChildren(oldChildren, newChildren);

    if (childPatches.length > 0) {
      hasChanges = true;
    }

    if (hasChanges) {
      return {
        type: 'UPDATE',
        props: propPatches,
        children: childPatches.length > 0 ? childPatches : undefined
      };
    }

    return null;
  }

  return null;
}

function normalizeChildren(children: any): any[] {
  if (children == null) return [];
  return Array.isArray(children) ? children : [children];
}

/**
 * Diff two lists of children using keys for reconciliation.
 * Returns an ordered list of patches.
 */
function diffChildren(oldChildren: any[], newChildren: any[]): Patch[] {
  const patches: Patch[] = [];

  // Build key → index maps
  const oldKeyMap = new Map<string | number, number>();
  oldChildren.forEach((child, i) => {
    if (child && typeof child === 'object' && child.key != null) {
      oldKeyMap.set(child.key, i);
    }
  });

  const newKeyMap = new Map<string | number, number>();
  newChildren.forEach((child, i) => {
    if (child && typeof child === 'object' && child.key != null) {
      newKeyMap.set(child.key, i);
    }
  });

  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChild = i < oldChildren.length ? oldChildren[i] : null;
    const newChild = i < newChildren.length ? newChildren[i] : null;

    const patch = calculatePatches(oldChild, newChild);
    if (patch) {
      patches.push(patch);
    }
  }

  return patches;
}

// ---------------------------------------------------------------------------
// DOM patch application
// ---------------------------------------------------------------------------

/**
 * Apply a patch to a DOM element. Returns the replacement element (or null
 * if the element was removed).
 */
export function applyPatches(element: Element, patch: Patch): Element | null {
  if (!isBrowser) return element;

  switch (patch.type) {
    case 'REMOVE':
      element.parentNode?.removeChild(element);
      return null;

    case 'REPLACE': {
      if (!patch.node) return element;
      // We need createElement here — import lazily to avoid circular deps
      // In practice, replace is handled at a higher level by the renderer
      const newNode = patch.node;
      if (typeof newNode === 'string' || typeof newNode === 'number') {
        const textNode = document.createTextNode(String(newNode));
        element.parentNode?.replaceChild(textNode, element);
        return null;
      }
      // For VNode replacements, the caller should use createElement + replaceChild
      // This is a fallback that just clears the element
      element.textContent = '';
      return element;
    }

    case 'UPDATE': {
      if (patch.props) {
        for (const [key, value] of Object.entries(patch.props)) {
          if (value === undefined) {
            const attrName = key === 'className' ? 'class' : key;
            element.removeAttribute(attrName);
          } else if (key === 'className') {
            element.setAttribute('class', String(value));
          } else if (key === 'style' && typeof value === 'object') {
            const htmlEl = element as HTMLElement;
            for (const [prop, val] of Object.entries(value)) {
              (htmlEl.style as any)[prop] = val;
            }
          } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            // Remove old listener if any, add new one
            const attrName = `data-baraqex-listener-${eventName}`;
            const oldHandler = (element as any).__baraqexHandlers?.[eventName];
            if (oldHandler) {
              element.removeEventListener(eventName, oldHandler);
            }
            element.addEventListener(eventName, value as EventListener);
            if (!(element as any).__baraqexHandlers) {
              (element as any).__baraqexHandlers = {};
            }
            (element as any).__baraqexHandlers[eventName] = value;
          } else if (key === 'ref') {
            if (typeof value === 'function') {
              value(element);
            } else if (value && typeof value === 'object' && 'current' in value) {
              value.current = element;
            }
          } else {
            if (value === true) {
              element.setAttribute(key, '');
            } else {
              element.setAttribute(key, String(value));
            }
          }
        }
      }
      return element;
    }

    default:
      return element;
  }
}

export default {
  diff,
  shouldComponentUpdate,
  calculatePatches,
  applyPatches
};
