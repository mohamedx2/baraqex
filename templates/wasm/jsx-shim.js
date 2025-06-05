// JSX Runtime shim for Frontend Hamroun
import { jsx, jsxs, Fragment } from 'frontend-hamroun';

// Make JSX runtime available globally
globalThis.jsx = jsx;
globalThis.jsxs = jsxs;
globalThis.Fragment = Fragment;

export { jsx, jsxs, Fragment };
