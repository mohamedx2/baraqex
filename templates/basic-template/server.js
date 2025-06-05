import express from 'express';
import { renderToString, jsx } from 'frontend-hamroun';

const app = express();
const port = 3000;

// Simple component
function App() {
  return jsx('div', { style: { padding: '2rem', textAlign: 'center' } }, 
    jsx('h1', null, 'Hello Frontend Hamroun!'),
    jsx('p', null, 'Your app is running successfully.'),
    jsx('p', null, 'Edit server.js to get started!')
  );
}

app.get('/', async (req, res) => {
  const html = await renderToString(jsx(App));
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Basic Frontend Hamroun App</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; }
        </style>
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
