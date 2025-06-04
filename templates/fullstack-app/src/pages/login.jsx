import { jsx, useState } from 'baraqex';

export default function LoginPage(props) {
  const [formData, setFormData] = useState({
    email: 'john@example.com',
    password: 'password123'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Login successful! Welcome ${data.data.user.name}`);
        // Store token (in a real app, use secure storage)
        localStorage.setItem('token', data.data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <html lang="en">
      <head>
        <title>Login - Baraqex Fullstack App</title>
        <meta name="description" content="Login to your Baraqex application" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/fullstack-styles.css" />
      </head>
      <body>
        <div className="fullstack-app">
          <header className="header">
            <div className="container">
              <h1>⚡ Baraqex Fullstack App</h1>
              <nav>
                <a href="/">Home</a>
                <a href="/api-docs">API Docs</a>
                <a href="/login" className="active">Login</a>
              </nav>
            </div>
          </header>
          
          <main className="main-content">
            <div className="container">
              <div className="login-container">
                <div className="login-card">
                  <h2>🔐 Login</h2>
                  <p>Demo authentication with JWT tokens</p>
                  
                  {message && (
                    <div className="success-message">
                      ✅ {message}
                    </div>
                  )}
                  
                  {error && (
                    <div className="error-message">
                      ❌ {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                      <label htmlFor="email">Email:</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="password">Password:</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your password"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-full" 
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                  
                  <div className="demo-credentials">
                    <h4>Demo Credentials:</h4>
                    <p><strong>Email:</strong> john@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
          
          <footer className="footer">
            <div className="container">
              <p>Built with ❤️ using Baraqex Framework</p>
            </div>
          </footer>
        </div>
        
        <script src="/client.js" type="module"></script>
      </body>
    </html>
  );
}

LoginPage.getTitle = () => 'Login - Baraqex Fullstack App';
LoginPage.getDescription = () => 'Login to your Baraqex application';
