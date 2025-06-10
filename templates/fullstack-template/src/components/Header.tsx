import { jsx } from 'frontend-hamroun';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  name: string;
  roles: string[];
}

interface HeaderProps {
  user: User | null;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function Header({ user, onNavigate, currentView }: HeaderProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">
            <span className="logo">⚡</span>
            Fullstack App
          </h1>
        </div>

        {user && (
          <nav className="header-nav">
            <button 
              className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-button ${currentView === 'todos' ? 'active' : ''}`}
              onClick={() => onNavigate('todos')}
            >
              ✅ Todos
            </button>
            <button 
              className={`nav-button ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate('profile')}
            >
              👤 Profile
            </button>
          </nav>
        )}

        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <span className="user-greeting">
                Hello, {user.name || user.username}
              </span>
              <button className="logout-button" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="auth-status">
              Please log in to continue
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
