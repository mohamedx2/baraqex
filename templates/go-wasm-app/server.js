// Server script with dual module support (ESM/CommonJS)

// Dynamically import dependencies based on module system
const isESM = typeof require === 'undefined';
let express, path, fs;

if (isESM) {
  // ESM imports
  import('express').then(module => express = module.default);
  import('path').then(module => path = module);
  import('fs').then(module => fs = module);
} else {
  // CommonJS requires
  express = require('express');
  path = require('path');
  fs = require('fs');
}

// Wait for all imports to resolve
async function startServer() {
  // Ensure all modules are loaded
  if (!express || !path || !fs) {
    if (isESM) {
      express = (await import('express')).default;
      path = await import('path');
      fs = await import('fs');
    }
  }

  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Special handling for wasm files to ensure correct MIME type
  app.get('*.wasm', (req, res, next) => {
    res.set('Content-Type', 'application/wasm');
    next();
  });
  
  // Always return index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`
┌────────────────────────────────────────────────────┐
│                                                    │
│   Go WASM Demo Server running on port ${PORT}          │
│                                                    │
│   Local:            http://localhost:${PORT}          │
│                                                    │
└────────────────────────────────────────────────────┘
`);
  });
}

startServer();

// Module export for both ESM and CommonJS
const server = { startServer };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = server;
}

export default server;
