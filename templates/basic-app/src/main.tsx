import { jsx, render, useState, useEffect, useMemo, useRef, useErrorBoundary, createContext, useContext } from 'baraqex';
import './main.css';

// JSX type declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Create a theme context
const ThemeContext = createContext<'light' | 'dark'>('light');

// Simple Counter Component with Tailwind styles
function Counter() {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  }, [count]);

  const doubled = useMemo(() => count * 2, [count]);

  return (
    <div className="card max-w-sm mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Counter Example
      </h2>
      <div className="text-center">
        <div className="text-4xl font-bold text-primary-600 mb-6">
          {count}
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Doubled: {doubled}</p>
          <p className="text-sm text-gray-600">Renders: {renderCount.current}</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setCount(count + 1)}
            className="btn btn-primary"
          >
            Increment
          </button>
          <button
            onClick={() => setCount(count - 1)}
            className="btn btn-secondary"
          >
            Decrement
          </button>
          <button
            onClick={() => setCount(0)}
            className="btn btn-danger"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// Todo Item Component
function TodoItem({ todo, onToggle, onDelete }: { 
  todo: { id: number; text: string; completed: boolean }; 
  onToggle: (id: number) => void; 
  onDelete: (id: number) => void; 
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
      todo.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {todo.completed && '✓'}
        </button>
        <span className={`transition-colors ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {todo.text}
        </span>
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  );
}

// Todo List Component
function TodoList() {
  const [todos, setTodos] = useState<{ id: number; text: string; completed: boolean }[]>([
    { id: 1, text: 'Learn Baraqex Framework', completed: false },
    { id: 2, text: 'Build something awesome', completed: false },
    { id: 3, text: 'Deploy to production', completed: false }
  ]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false
      }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((todo: { id: number; completed: any; }) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo: { id: number; }) => todo.id !== id));
  };

  const completedCount = todos.filter((todo: { completed: any; }) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Todo List
      </h2>
      
      <div className="mb-4">
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e: { target: { value: any; }; }) => setNewTodo(e.target.value)}
            onKeyPress={(e: { key: string; }) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo..."
            className="input flex-1"
          />
          <button
            onClick={addTodo}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
        <div className="text-sm text-gray-600 text-center">
          {completedCount} of {totalCount} completed
        </div>
      </div>

      <div className="space-y-2">
        {todos.map((todo: { id: Number; text?: string; completed?: boolean; }) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
      </div>

      {todos.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No todos yet. Add one above!
        </p>
      )}
    </div>
  );
}

// Error boundary test component
function BuggyComponent() {
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error("Test error from BuggyComponent");
  }
  
  return (
    <div className="card max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Error Boundary Test
      </h3>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Click the button below to test error handling
      </p>
      <div className="text-center">
        <button 
          onClick={() => setShouldError(true)}
          className="btn btn-danger"
        >
          Trigger Error
        </button>
      </div>
    </div>
  );
}

// Context test component
function ContextConsumer() {
  const theme = useContext(ThemeContext);
  
  return (
    <div className="card max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Context API Test
      </h3>
      <div className={`p-4 rounded-md border text-center ${
        theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50'
      }`}>
        <p className="text-sm mb-2">Current theme: <strong>{theme}</strong></p>
        <p className="text-xs text-gray-500">
          Theme is provided by Context API
        </p>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('counter');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, resetError] = useErrorBoundary();

  useEffect(() => {
    document.title = `Baraqex Demo - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
  }, [activeTab]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="card max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={resetError}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`min-h-screen transition-colors ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="container mx-auto px-4 py-8">
          
          {/* Header with Logo */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="Baraqex Logo" 
                className="w-16 h-16 mr-4 rounded-lg shadow-lg"
                onError={(e: { target: { style: { display: string; }; nextElementSibling: { style: { display: string; }; }; }; }) => {
                  // Fallback to emoji if logo doesn't exist
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <div className="text-6xl" style={{display: 'none'}}>🚀</div>
              <div>
                <h1 className={`text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Baraqex
                </h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Powered by Frontend Hamroun
                </p>
              </div>
            </div>
            
            {/* About Baraqex */}
            <div className="card max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Welcome to Baraqex Framework! 🎉
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="text-lg font-semibold text-primary-600 mb-3">🚀 What is Baraqex?</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Baraqex is a powerful, modern full-stack framework built on top of the Frontend Hamroun library. 
                    It provides everything you need to build high-performance web applications with ease.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    From simple SPAs to complex server-side rendered applications with WebAssembly integration, 
                    Baraqex has you covered with a developer-friendly API and excellent performance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-600 mb-3">✨ Key Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Reactive state management with hooks
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Server-side rendering (SSR) support
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      WebAssembly (WASM) integration
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Built-in authentication & database support
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      TypeScript support out of the box
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Production-ready with optimized builds
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`btn ${theme === 'dark' ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                  🌙 Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-sm p-1 flex space-x-1 overflow-x-auto">
              {[
                { id: 'counter', label: 'Counter', icon: '🔢' },
                { id: 'todos', label: 'Todo List', icon: '✅' },
                { id: 'error', label: 'Error Test', icon: '🚨' },
                { id: 'context', label: 'Context', icon: '🔄' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex justify-center mb-12">
            {activeTab === 'counter' && <Counter />}
            {activeTab === 'todos' && <TodoList />}
            {activeTab === 'error' && <BuggyComponent />}
            {activeTab === 'context' && <ContextConsumer />}
          </div>

          {/* Footer */}
          <footer className="text-center">
            <div className="card max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                🎯 Framework Capabilities Demo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-semibold text-gray-800 mb-2">State Management</h4>
                  <p className="text-sm text-gray-600">
                    useState, useEffect, useMemo, and useRef hooks working seamlessly
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Tailwind CSS</h4>
                  <p className="text-sm text-gray-600">
                    Utility-first CSS framework integrated for rapid UI development
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Error Boundaries</h4>
                  <p className="text-sm text-gray-600">
                    Graceful error handling with useErrorBoundary hook
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Context API</h4>
                  <p className="text-sm text-gray-600">
                    Share state across components with createContext and useContext
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">🚀 Ready to build something amazing?</h4>
                <p className="text-gray-600 mb-4">
                  Edit <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/main.tsx</code> to customize this app, 
                  or create new components to expand your application.
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="https://www.baraqex.tech/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    📚 Documentation
                  </a>
                  <a 
                    href="https://github.com/mohamedx2/baraqex" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    🐙 GitHub
                  </a>
                  <a 
                    href="https://www.baraqex.tech/examples" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    🎯 Examples
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

// Mount the app
render(<App />, document.getElementById('root'));
