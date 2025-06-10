import { jsx, useState, useEffect } from 'frontend-hamroun';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { TodoList } from './components/TodoList';
import { UserProfile } from './components/UserProfile';
import { LoadingSpinner } from './components/LoadingSpinner';
import './styles/App.css';

type View = 'dashboard' | 'todos' | 'profile' | 'login';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || authLoading) {
    return <LoadingSpinner message="Loading application..." />;
  }

  if (!user) {
    return (
      <div className="app">
        <Header 
          user={null} 
          onNavigate={setCurrentView} 
          currentView={currentView}
        />
        <main className="main-content">
          <LoginForm />
        </main>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'todos':
        return <TodoList />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Header 
        user={user} 
        onNavigate={setCurrentView} 
        currentView={currentView}
      />
      <main className="main-content">
        {renderView()}
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 Fullstack Baraqex App. Built with ❤️ using Baraqex Framework.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <AppContent />
      </ApiProvider>
    </AuthProvider>
  );
}

// SSR support
App.getTitle = () => "Fullstack Baraqex App";
App.getDescription = () => "A complete fullstack application with authentication, API integration, and modern UI";
App.getMeta = () => ({
  'og:title': 'Fullstack Baraqex App',
  'og:description': 'Complete fullstack solution with Baraqex',
  'og:type': 'website'
});
