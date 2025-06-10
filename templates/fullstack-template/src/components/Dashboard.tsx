import { jsx, useState, useEffect } from 'frontend-hamroun';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

export function Dashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState({
    totalTodos: 0,
    completedTodos: 0,
    pendingTodos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/api/todos');
      const todos = response.data.todos;
      
      setStats({
        totalTodos: todos.length,
        completedTodos: todos.filter((todo: any) => todo.completed).length,
        pendingTodos: todos.filter((todo: any) => !todo.completed).length
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, {user?.name || user?.username}! 👋</h2>
        <p className="dashboard-subtitle">Here's your productivity overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalTodos}</h3>
            <p className="stat-label">Total Todos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.completedTodos}</h3>
            <p className="stat-label">Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.pendingTodos}</h3>
            <p className="stat-label">Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3 className="stat-number">
              {stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}%
            </h3>
            <p className="stat-label">Completion Rate</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>🚀 Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary">
              ➕ Add New Todo
            </button>
            <button className="action-btn secondary">
              📊 View Reports
            </button>
            <button className="action-btn secondary">
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="recent-activity">
          <h3>📅 Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">✅</span>
              <span className="activity-text">Completed todo: "Learn Baraqex"</span>
              <span className="activity-time">2 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">➕</span>
              <span className="activity-text">Added new todo</span>
              <span className="activity-time">1 day ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <span className="activity-text">Updated profile</span>
              <span className="activity-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
