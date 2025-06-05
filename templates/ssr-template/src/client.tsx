import { hydrate, jsx, render } from 'baraqex';
import { App } from './App.js';

await hydrate(jsx(App, {}), document.getElementById('root')!);
