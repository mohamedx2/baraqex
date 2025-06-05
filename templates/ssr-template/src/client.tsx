import { hydrate, jsx, render } from 'frontend-hamroun';
import { App } from './App.js';

await hydrate(jsx(App, {}), document.getElementById('root')!);
await render(jsx(App, {}), document.getElementById('root')!);
