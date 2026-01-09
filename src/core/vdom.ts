/**
 * Virtual DOM diffing and patching utilities
 */

import { VNode } from './types.js';

/**
 * Check if props are equal (shallow comparison)
 */
function arePropsEqual(oldProps: any, newProps: any): boolean {
  const oldKeys = Object.keys(oldProps || {}).filter(k => k !== 'children');
  const newKeys = Object.keys(newProps || {}).filter(k => k !== 'children');
  
  if (oldKeys.length !== newKeys.length) return false;
  return oldKeys.every(key => Object.is(oldProps[key], newProps[key]));
}

/**
 * Determine if two virtual nodes are different and need re-rendering
 */
export function diff(oldNode: VNode | any, newNode: VNode | any): boolean {
  // Handle null/undefined
  if (oldNode == null || newNode == null) {
    return oldNode !== newNode;
  }
  
  // Different types
  if (typeof oldNode !== typeof newNode) {
    return true;
  }
  
  // Primitives
  if (typeof newNode === 'string' || typeof newNode === 'number') {
    return oldNode !== newNode;
  }
  
  // Arrays
  if (Array.isArray(oldNode) && Array.isArray(newNode)) {
    if (oldNode.length !== newNode.length) return true;
    return oldNode.some((child, i) => diff(child, newNode[i]));
  }
  
  // VNodes
  if (typeof oldNode === 'object' && typeof newNode === 'object') {
    // Different element types
    if (newNode.type !== oldNode.type) {
      return true;
    }
    
    // Different keys
    if (newNode.key !== oldNode.key) {
      return true;
    }
    
    // Check props
    return !arePropsEqual(oldNode.props, newNode.props);
  }
  
  return oldNode !== newNode;
}

/**
 * Determine if a component should update based on props changes
 */
export function shouldComponentUpdate(oldProps: any, newProps: any): boolean {
  return !arePropsEqual(oldProps, newProps);
}

/**
 * Create a patch object describing DOM updates needed
 */
export interface Patch {
  type: 'CREATE' | 'REMOVE' | 'REPLACE' | 'UPDATE' | 'SET_PROP' | 'REMOVE_PROP';
  node?: VNode | any;
  props?: Record<string, any>;
  children?: Patch[];
}

/**
 * Calculate patches needed to transform old tree to new tree
 */
export function calculatePatches(oldNode: VNode | any, newNode: VNode | any): Patch | null {
  // New node created
  if (oldNode == null && newNode != null) {
    return { type: 'CREATE', node: newNode };
  }
  
  // Node removed
  if (oldNode != null && newNode == null) {
    return { type: 'REMOVE' };
  }
  
  // Both null
  if (oldNode == null && newNode == null) {
    return null;
  }
  
  // Different types - replace entirely
  if (typeof oldNode !== typeof newNode) {
    return { type: 'REPLACE', node: newNode };
  }
  
  // Text/number nodes
  if (typeof newNode === 'string' || typeof newNode === 'number') {
    if (oldNode !== newNode) {
      return { type: 'REPLACE', node: newNode };
    }
    return null;
  }
  
  // VNode comparison
  if (typeof oldNode === 'object' && typeof newNode === 'object' && 'type' in newNode) {
    // Different element types
    if (oldNode.type !== newNode.type) {
      return { type: 'REPLACE', node: newNode };
    }
    
    // Same type - check for prop updates
    const propPatches: Record<string, any> = {};
    let hasChanges = false;
    
    // Check for new/changed props
    const newProps = newNode.props || {};
    const oldProps = oldNode.props || {};
    
    for (const key of Object.keys(newProps)) {
      if (key === 'children') continue;
      if (!Object.is(newProps[key], oldProps[key])) {
        propPatches[key] = newProps[key];
        hasChanges = true;
      }
    }
    
    // Check for removed props
    for (const key of Object.keys(oldProps)) {
      if (key === 'children') continue;
      if (!(key in newProps)) {
        propPatches[key] = undefined;
        hasChanges = true;
      }
    }
    
    // Calculate children patches
    const oldChildren = Array.isArray(oldProps.children) 
      ? oldProps.children 
      : oldProps.children != null ? [oldProps.children] : [];
    const newChildren = Array.isArray(newProps.children)
      ? newProps.children
      : newProps.children != null ? [newProps.children] : [];
    
    const childPatches: Patch[] = [];
    const maxLen = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLen; i++) {
      const childPatch = calculatePatches(oldChildren[i], newChildren[i]);
      if (childPatch) {
        childPatches.push(childPatch);
        hasChanges = true;
      }
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

/**
 * Apply patches to a DOM element
 */
export function applyPatches(element: Element, patch: Patch): Element | null {
  switch (patch.type) {
    case 'REMOVE':
      element.parentNode?.removeChild(element);
      return null;
      
    case 'REPLACE':
      // Would need createElement here
      console.warn('REPLACE patch not fully implemented');
      return element;
      
    case 'UPDATE':
      // Apply prop changes
      if (patch.props) {
        for (const [key, value] of Object.entries(patch.props)) {
          if (value === undefined) {
            element.removeAttribute(key === 'className' ? 'class' : key);
          } else if (key.startsWith('on')) {
            // Event handlers would need special handling
          } else if (key === 'className') {
            element.setAttribute('class', String(value));
          } else {
            element.setAttribute(key, String(value));
          }
        }
      }
      return element;
      
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
