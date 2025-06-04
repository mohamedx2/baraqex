// Simple implementation for now - avoid complex imports during rendering
export default function HomePage(props) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baraqex Fullstack App</title>
  <meta name="description" content="A complete fullstack application built with Baraqex framework">
  <link rel="stylesheet" href="/fullstack-styles.css">
</head>
<body>
  <div class="fullstack-app">
    <header class="header">
      <div class="container">
        <h1>⚡ Baraqex Fullstack App</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/api-docs">API Docs</a>
          <a href="/login">Login</a>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <div class="container">
        <section class="hero">
          <h2>Welcome to Your Fullstack Application!</h2>
          <p>This template includes everything you need for a complete web application:</p>
          <div class="features">
            <div class="feature">
              <h3>🔌 RESTful API</h3>
              <p>Pre-built API routes with authentication and CRUD operations</p>
            </div>
            <div class="feature">
              <h3>🗄️ Database Ready</h3>
              <p>Supports MongoDB, MySQL, and PostgreSQL out of the box</p>
            </div>
            <div class="feature">
              <h3>🔐 Authentication</h3>
              <p>JWT-based authentication with role-based access control</p>
            </div>
            <div class="feature">
              <h3>🌐 SSR + SPA</h3>
              <p>Server-side rendering with client-side hydration</p>
            </div>
          </div>
        </section>

        <section class="api-demo">
          <h3>🚀 Live API Demo</h3>
          <p>Server time: <strong>${props.api.serverTime}</strong></p>
          
          <div class="users-section">
            <div class="section-header">
              <h4>👥 Users API Demo</h4>
              <button onclick="fetchUsers()" class="btn btn-primary">
                Refresh Users
              </button>
            </div>
            
            <div id="users-container">
              <div class="users-grid" id="users-grid">
                <!-- Users will be loaded here -->
              </div>
            </div>
          </div>

          <div class="api-endpoints">
            <h4>🔌 Available API Endpoints</h4>
            <div class="endpoints-list">
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/users</span>
                <span class="desc">Get all users</span>
              </div>
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/users</span>
                <span class="desc">Create a new user</span>
              </div>
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/auth</span>
                <span class="desc">User authentication</span>
              </div>
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api-docs</span>
                <span class="desc">API documentation</span>
              </div>
            </div>
          </div>
        </section>

        <section class="getting-started">
          <h3>🎯 Getting Started</h3>
          <div class="steps">
            <div class="step">
              <h4>1. Configure Database</h4>
              <p>Uncomment the database configuration in <code>server.js</code></p>
              <pre><code>// Uncomment in server.js
db: {
  type: 'mongodb',
  url: process.env.DATABASE_URL || 'mongodb://localhost:27017/baraqex'
}</code></pre>
            </div>
            <div class="step">
              <h4>2. Enable Authentication</h4>
              <p>Uncomment the auth configuration for JWT-based authentication</p>
              <pre><code>// Uncomment in server.js
auth: {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '7d'
}</code></pre>
            </div>
            <div class="step">
              <h4>3. Add Your API Routes</h4>
              <p>Create new files in <code>src/api/</code> directory</p>
              <pre><code>// src/api/posts.js
export async function get(req, res) {
  res.json({ posts: [] });
}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>Built with ❤️ using Baraqex Framework • Server Time: ${props.api.serverTime}</p>
      </div>
    </footer>
  </div>
  
  <script src="/client.js"></script>
</body>
</html>`;
}

// Static methods for SSR
HomePage.getTitle = (props) => 'Baraqex Fullstack App';
HomePage.getDescription = (props) => 'A complete fullstack application built with Baraqex framework';
HomePage.getMeta = (props) => ({
  'og:title': 'Baraqex Fullstack App',
  'og:description': 'Complete solution with API routes, authentication, and database integration',
  'og:type': 'website'
});
