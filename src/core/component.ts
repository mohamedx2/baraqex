/**
 * Class-based Component support (for legacy compatibility)
 */

import { createElement } from './jsx-runtime.js';
import { VNode } from './types.js';

export abstract class Component<P = {}, S = {}> {
  props: P;
  state: S;
  element: HTMLElement | null = null;
  private _mounted: boolean = false;
  private _pendingState: Partial<S> | null = null;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  /**
   * Called after the component is mounted to the DOM
   */
  componentDidMount(): void {}

  /**
   * Called before the component is unmounted from the DOM
   */
  componentWillUnmount(): void {}

  /**
   * Called when the component receives new props
   */
  componentDidUpdate(_prevProps: P, _prevState: S): void {}

  /**
   * Determine if the component should re-render
   */
  shouldComponentUpdate(_nextProps: P, _nextState: S): boolean {
    return true;
  }

  /**
   * Update component state and trigger re-render
   */
  setState(newState: Partial<S> | ((prevState: S, props: P) => Partial<S>)): void {
    const prevState = { ...this.state };
    
    const stateUpdate = typeof newState === 'function'
      ? newState(this.state, this.props)
      : newState;
    
    this.state = { ...this.state, ...stateUpdate };
    
    if (this._mounted) {
      if (this.shouldComponentUpdate(this.props, this.state)) {
        this._update();
        this.componentDidUpdate(this.props, prevState);
      }
    }
  }

  /**
   * Force a re-render without checking shouldComponentUpdate
   */
  forceUpdate(): void {
    this._update();
  }

  /**
   * Internal update method
   */
  private async _update(): Promise<void> {
    const vdom = this.render();
    if (!vdom || !this.element?.parentNode) return;
    
    const newElement = await createElement(vdom);
    if (newElement instanceof HTMLElement) {
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
    }
  }

  /**
   * Mount the component to a container
   */
  async mount(container: HTMLElement): Promise<void> {
    const vdom = this.render();
    if (!vdom) return;
    
    const element = await createElement(vdom);
    if (element instanceof HTMLElement) {
      this.element = element;
      container.appendChild(element);
      this._mounted = true;
      this.componentDidMount();
    }
  }

  /**
   * Unmount the component
   */
  unmount(): void {
    if (this.element?.parentNode) {
      this.componentWillUnmount();
      this.element.parentNode.removeChild(this.element);
      this._mounted = false;
      this.element = null;
    }
  }

  /**
   * Render method - must be implemented by subclasses
   */
  abstract render(): VNode | null;
}

/**
 * Create a class component wrapper for functional use
 */
export function createClassComponent<P>(
  ComponentClass: new (props: P) => Component<P>
): (props: P) => VNode | null {
  return (props: P) => {
    const instance = new ComponentClass(props);
    return instance.render();
  };
}

/**
 * Pure Component - only re-renders when props change (shallow comparison)
 */
export abstract class PureComponent<P = {}, S = {}> extends Component<P, S> {
  shouldComponentUpdate(nextProps: P, nextState: S): boolean {
    // Shallow comparison of props
    const propsKeys = Object.keys(this.props as object) as (keyof P)[];
    const nextPropsKeys = Object.keys(nextProps as object) as (keyof P)[];
    
    if (propsKeys.length !== nextPropsKeys.length) return true;
    
    for (const key of propsKeys) {
      if (!Object.is(this.props[key], nextProps[key])) return true;
    }
    
    // Shallow comparison of state
    const stateKeys = Object.keys(this.state as object) as (keyof S)[];
    const nextStateKeys = Object.keys(nextState as object) as (keyof S)[];
    
    if (stateKeys.length !== nextStateKeys.length) return true;
    
    for (const key of stateKeys) {
      if (!Object.is(this.state[key], nextState[key])) return true;
    }
    
    return false;
  }
}

export default {
  Component,
  PureComponent,
  createClassComponent
};
