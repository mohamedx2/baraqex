import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderToString, jsx } from 'frontend-hamroun';
import { App } from './App.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname)));

app.get('/', async (req, res) => {
  const html = await renderToString(jsx(App, {}));
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
