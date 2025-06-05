import { hydrate, jsx } from 'frontend-hamroun';
import { App } from './App.js';

hydrate(jsx(App, {}), document.getElementById('root')!);
