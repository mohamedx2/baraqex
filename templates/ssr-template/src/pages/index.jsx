import { jsx, useState } from 'baraqex';

export default function HomePage(props) {
  const [hydrated, setHydrated] = useState(false);

  const handleHydration = () => {
    setHydrated(true);
  };

  return (
    <html lang="en">
      <head>
        <title>Baraqex SSR Template</title>
        <meta name="description" content="Server-side rendered Baraqex application" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div className="ssr-app">
          <header className="header">
            <h1>🌐 Baraqex SSR Template</h1>
            <p>Server-side rendered at: {props.api.serverTime}</p>
          </header>
          
          <main className="main-content">
            <section className="hero">
              <h2>Welcome to Server-Side Rendering!</h2>
              <p>This page was rendered on the server for optimal SEO and performance.</p>
            </section>
            
            <section className="features">
              <h3>SSR Benefits:</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <h4>🚀 Fast Initial Load</h4>
                  <p>HTML is generated on the server, reducing time to first paint</p>
                </div>
                <div className="feature-card">
                  <h4>📈 SEO Optimized</h4>
                  <p>Search engines can easily crawl and index your content</p>
                </div>
                <div className="feature-card">
                  <h4>🔄 Client Hydration</h4>
                  <p>Interactive features are restored on the client side</p>
                </div>
                <div className="feature-card">
                  <h4>📱 Social Sharing</h4>
                  <p>Rich previews work perfectly on social media platforms</p>
                </div>
              </div>
            </section>
            
            <section className="interactive">
              <h3>Interactive Features:</h3>
              <button 
                onClick={handleHydration}
                className={`hydration-btn ${hydrated ? 'hydrated' : ''}`}
              >
                {hydrated ? '✅ Hydrated!' : '🔄 Click to Hydrate'}
              </button>
              <p className="hydration-status">
                Status: {hydrated ? 'Client-side JavaScript is active' : 'Server-rendered only'}
              </p>
            </section>
          </main>
          
          <footer className="footer">
            <p>Built with Baraqex SSR • Server Time: {props.api.serverTime}</p>
          </footer>
        </div>
        
        <script src="/client.js" type="module"></script>
      </body>
    </html>
  );
}

// Static methods for SSR
HomePage.getTitle = (props) => 'Baraqex SSR Template';
HomePage.getDescription = (props) => 'A server-side rendered application built with Baraqex framework';
HomePage.getMeta = (props) => ({
  'og:title': 'Baraqex SSR Template',
  'og:description': 'Fast, SEO-friendly web applications with server-side rendering',
  'og:type': 'website'
});
