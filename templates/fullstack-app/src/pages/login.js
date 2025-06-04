export default function LoginPage(props) {
  return `
    <div class="fullstack-app">
      <header class="header">
        <div class="container">
          <h1>⚡ Baraqex Fullstack App</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/api-docs">API Docs</a>
            <a href="/login" class="active">Login</a>
          </nav>
        </div>
      </header>
      
      <main class="main-content">
        <div class="container">
          <div class="login-container">
            <div class="login-card">
              <h2>🔐 Login</h2>
              <p>Demo authentication with JWT tokens</p>
              
              <div id="message-container"></div>
              
              <form id="login-form" class="login-form">
                <div class="form-group">
                  <label for="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value="john@example.com"
                    required
                    placeholder="Enter your email"
                  />
                </div>
                
                <div class="form-group">
                  <label for="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value="password123"
                    required
                    placeholder="Enter your password"
                  />
                </div>
                
                <button type="submit" class="btn btn-primary btn-full">
                  Sign In
                </button>
              </form>
              
              <div class="demo-credentials">
                <h4>Demo Credentials:</h4>
                <p><strong>Email:</strong> john@example.com</p>
                <p><strong>Password:</strong> password123</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer class="footer">
        <div class="container">
          <p>Built with ❤️ using Baraqex Framework</p>
        </div>
      </footer>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('login-form');
        const messageContainer = document.getElementById('message-container');
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing In...';
          
          messageContainer.innerHTML = '';
          
          const formData = {
            email: form.email.value,
            password: form.password.value
          };
          
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
              messageContainer.innerHTML = \`
                <div class="success-message">
                  ✅ Login successful! Welcome \${data.data.user.name}
                </div>
              \`;
              // Store token (in a real app, use secure storage)
              localStorage.setItem('token', data.data.token);
              
              // Redirect to home after 2 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            } else {
              messageContainer.innerHTML = \`
                <div class="error-message">
                  ❌ \${data.message || 'Login failed'}
                </div>
              \`;
            }
          } catch (err) {
            messageContainer.innerHTML = \`
              <div class="error-message">
                ❌ Network error occurred
              </div>
            \`;
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
      });
    </script>
  `;
}

LoginPage.getTitle = () => 'Login - Baraqex Fullstack App';
LoginPage.getDescription = () => 'Login to your Baraqex application';
