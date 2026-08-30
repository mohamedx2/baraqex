/**
 * Lifecycle events for components and application
 */
import { eventBus } from './event-bus.js';

export enum LifecycleEvents {
  APP_INIT = 'app:init',
  APP_MOUNTED = 'app:mounted',
  APP_UPDATED = 'app:updated',
  APP_ERROR = 'app:error',
  APP_DESTROYED = 'app:destroyed',

  COMPONENT_CREATED = 'component:created',
  COMPONENT_MOUNTED = 'component:mounted',
  COMPONENT_UPDATED = 'component:updated',
  COMPONENT_ERROR = 'component:error',
  COMPONENT_UNMOUNTED = 'component:unmounted',

  ROUTER_BEFORE_CHANGE = 'router:before-change',
  ROUTER_AFTER_CHANGE = 'router:after-change',
  ROUTER_ERROR = 'router:error',

  STORE_INITIALIZED = 'store:initialized',
  STORE_BEFORE_ACTION = 'store:before-action',
  STORE_AFTER_ACTION = 'store:after-action',
  STORE_ERROR = 'store:error'
}

export interface ComponentInfo {
  id: string;
  name: string;
  props: Record<string, any>;
  path?: string;
}

export interface RouteChangeInfo {
  from: string;
  to: string;
  params: Record<string, string>;
}

export interface StoreActionInfo {
  type: string;
  payload: any;
  prevState: any;
  nextState: any;
}

export function emitAppInit(data: any) {
  eventBus.emit(LifecycleEvents.APP_INIT, data);
}

export function emitAppMounted(rootElement: HTMLElement) {
  eventBus.emit(LifecycleEvents.APP_MOUNTED, rootElement);
}

export function emitAppUpdated() {
  eventBus.emit(LifecycleEvents.APP_UPDATED);
}

export function emitAppError(error: Error) {
  eventBus.emit(LifecycleEvents.APP_ERROR, error);
}

export function emitAppDestroyed() {
  eventBus.emit(LifecycleEvents.APP_DESTROYED);
}

export function emitComponentCreated(info: ComponentInfo) {
  eventBus.emit(LifecycleEvents.COMPONENT_CREATED, info);
}

export function emitComponentMounted(info: ComponentInfo, element: HTMLElement) {
  eventBus.emit(LifecycleEvents.COMPONENT_MOUNTED, info, element);
}

export function emitComponentUpdated(
  info: ComponentInfo,
  prevProps: Record<string, any>,
  newProps: Record<string, any>
) {
  eventBus.emit(LifecycleEvents.COMPONENT_UPDATED, info, prevProps, newProps);
}

export function emitComponentError(info: ComponentInfo, error: Error) {
  eventBus.emit(LifecycleEvents.COMPONENT_ERROR, info, error);
}

export function emitComponentUnmounted(info: ComponentInfo) {
  eventBus.emit(LifecycleEvents.COMPONENT_UNMOUNTED, info);
}

export function emitRouterBeforeChange(info: RouteChangeInfo): Promise<boolean> {
  return new Promise(resolve => {
    let prevented = false;
    const prevent = () => { prevented = true; };
    eventBus.emit(LifecycleEvents.ROUTER_BEFORE_CHANGE, info, prevent);
    resolve(!prevented);
  });
}

export function emitRouterAfterChange(info: RouteChangeInfo) {
  eventBus.emit(LifecycleEvents.ROUTER_AFTER_CHANGE, info);
}

export function emitRouterError(error: Error, info?: Partial<RouteChangeInfo>) {
  eventBus.emit(LifecycleEvents.ROUTER_ERROR, error, info);
}

export function emitStoreInitialized(state: any) {
  eventBus.emit(LifecycleEvents.STORE_INITIALIZED, state);
}

export function emitStoreBeforeAction(actionType: string, payload: any, state: any) {
  eventBus.emit(LifecycleEvents.STORE_BEFORE_ACTION, actionType, payload, state);
}

export function emitStoreAfterAction(info: StoreActionInfo) {
  eventBus.emit(LifecycleEvents.STORE_AFTER_ACTION, info);
}

export function emitStoreError(error: Error, actionType: string, payload: any) {
  eventBus.emit(LifecycleEvents.STORE_ERROR, error, actionType, payload);
}

export function onAppInit(handler: (data: any) => void) {
  return eventBus.on(LifecycleEvents.APP_INIT, handler);
}

export function onAppMounted(handler: (rootElement: HTMLElement) => void) {
  return eventBus.on(LifecycleEvents.APP_MOUNTED, handler);
}

export function onAppUpdated(handler: () => void) {
  return eventBus.on(LifecycleEvents.APP_UPDATED, handler);
}

export function onAppError(handler: (error: Error) => void) {
  return eventBus.on(LifecycleEvents.APP_ERROR, handler);
}

export function onAppDestroyed(handler: () => void) {
  return eventBus.on(LifecycleEvents.APP_DESTROYED, handler);
}

export function onComponentCreated(handler: (info: ComponentInfo) => void) {
  return eventBus.on(LifecycleEvents.COMPONENT_CREATED, handler);
}

export function onComponentMounted(handler: (info: ComponentInfo, element: HTMLElement) => void) {
  return eventBus.on(LifecycleEvents.COMPONENT_MOUNTED, handler);
}

export function onComponentUpdated(
  handler: (info: ComponentInfo, prevProps: Record<string, any>, newProps: Record<string, any>) => void
) {
  return eventBus.on(LifecycleEvents.COMPONENT_UPDATED, handler);
}

export function onComponentError(handler: (info: ComponentInfo, error: Error) => void) {
  return eventBus.on(LifecycleEvents.COMPONENT_ERROR, handler);
}

export function onComponentUnmounted(handler: (info: ComponentInfo) => void) {
  return eventBus.on(LifecycleEvents.COMPONENT_UNMOUNTED, handler);
}

export function onRouterBeforeChange(handler: (info: RouteChangeInfo, prevent: () => void) => void) {
  return eventBus.on(LifecycleEvents.ROUTER_BEFORE_CHANGE, handler);
}

export function onRouterAfterChange(handler: (info: RouteChangeInfo) => void) {
  return eventBus.on(LifecycleEvents.ROUTER_AFTER_CHANGE, handler);
}

export function onRouterError(handler: (error: Error, info?: Partial<RouteChangeInfo>) => void) {
  return eventBus.on(LifecycleEvents.ROUTER_ERROR, handler);
}

export function onStoreInitialized(handler: (state: any) => void) {
  return eventBus.on(LifecycleEvents.STORE_INITIALIZED, handler);
}

export function onStoreBeforeAction(handler: (actionType: string, payload: any, state: any) => void) {
  return eventBus.on(LifecycleEvents.STORE_BEFORE_ACTION, handler);
}

export function onStoreAfterAction(handler: (info: StoreActionInfo) => void) {
  return eventBus.on(LifecycleEvents.STORE_AFTER_ACTION, handler);
}

export function onStoreError(handler: (error: Error, actionType: string, payload: any) => void) {
  return eventBus.on(LifecycleEvents.STORE_ERROR, handler);
}
