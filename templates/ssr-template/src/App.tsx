import { useState, useEffect, useRef, useMemo } from 'baraqex';

// Custom hooks for better code organization
function useTimer(initialTime = 0) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime((prev: number) => prev + 1);
      }, 1000);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [time]);

  return { time, formattedTime, isRunning, start, stop, reset };
}

function useCounter(initialValue = 0, step = 1) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount((prev: number) => prev + step);
  const decrement = () => setCount((prev: number) => prev - step);
  const reset = () => setCount(initialValue);
  const setValue = (value: number | ((prev: number) => number)) => setCount(value);

  return { count, increment, decrement, reset, setValue };
}

function useTodos() {
  // Initialize with proper default array to prevent hydration issues
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn Frontend Hamroun', completed: false },
    { id: 2, text: 'Build SSR app', completed: true },
    { id: 3, text: 'Deploy to production', completed: false }
  ]);
  const [filter, setFilter] = useState('all');

  const addTodo = (text: any) => {
    // Ensure text is a string and handle null/undefined
    const textString = String(text || '');
    if (textString.trim()) {
      setTodos((prev: any) => [...prev, {
        id: Date.now(),
        text: textString.trim(),
        completed: false
      }]);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos((prev: any[]) => prev.map((todo: { id: number; completed: any; }) => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos((prev: any[]) => prev.filter((todo: { id: number; }) => todo.id !== id));
  };

  const filteredTodos = useMemo(() => {
    // Ensure todos is always an array to prevent hydration errors
    const todoArray = Array.isArray(todos) ? todos : [];
    
    switch (filter) {
      case 'active':
        return todoArray.filter(todo => !todo.completed);
      case 'completed':
        return todoArray.filter(todo => todo.completed);
      default:
        return todoArray;
    }
  }, [todos, filter]);

  const stats = useMemo(() => {
    // Ensure todos is always an array to prevent hydration errors
    const todoArray = Array.isArray(todos) ? todos : [];
    const total = todoArray.length;
    const completed = todoArray.filter(todo => todo.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [todos]);

  return {
    todos: filteredTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    stats
  };
}

function useTheme() {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    setTheme((prev: string) => prev === 'light' ? 'dark' : 'light');
  };

  const themeColors = useMemo(() => {
    return theme === 'light' ? {
      bg: '#ffffff',
      text: '#333333',
      primary: '#3498db',
      secondary: '#e8f4fd',
      border: '#e1e1e1',
      accent: '#2ecc71'
    } : {
      bg: '#1a1a1a',
      text: '#ffffff',
      primary: '#5dade2',
      secondary: '#2c3e50',
      border: '#404040',
      accent: '#58d68d'
    };
  }, [theme]);

  return { theme, toggleTheme, colors: themeColors };
}

// Todo Item Component
function TodoItem({ todo, onToggle, onDelete, ...props }:any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem',
      border: '1px solid #e1e1e1',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      background: todo.completed ? '#f8f9fa' : 'white',
      textDecoration: todo.completed ? 'line-through' : 'none',
      opacity: todo.completed ? 0.7 : 1,
      transition: 'all 0.2s ease'
    }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        style={{ marginRight: '0.75rem' }}
      />
      <span style={{ flex: 1 }}>{todo.text}</span>
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}
      >
        Delete
      </button>
    </div>
  );
}

// Stats Component
function StatsCard({ title, value, color = '#3498db' }) {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `3px solid ${color}`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        color: color,
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {title}
      </h3>
      <div style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: color,
        fontFamily: 'monospace'
      }}>
        {value}
      </div>
    </div>
  );
}

// Main App Component
export function App() {
  const { count, increment, decrement, reset, setValue } = useCounter(0, 1);
  const { time, formattedTime, isRunning, start, stop, reset: resetTimer } = useTimer();
  const { todos, filter, setFilter, addTodo, toggleTodo, deleteTodo, stats } = useTodos();
  const { theme, toggleTheme, colors } = useTheme();
  
  const [newTodo, setNewTodo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef(null);

  // Handle todo form submission
  const handleTodoSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    // Ensure newTodo is a string before passing to addTodo
    const todoText = String(newTodo || '');
    addTodo(todoText);
    setNewTodo('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Dynamic step value for counter
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    console.log('App mounted - Frontend Hamroun SSR working!');
    return () => console.log('App unmounted');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: colors.text,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: colors.bg,
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: `1px solid ${colors.border}`
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          position: 'relative'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🚀 Frontend Hamroun SSR
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: colors.text,
            opacity: 0.8,
            margin: 0
          }}>
            Advanced SSR Template with Hooks & Modern Design
          </p>
          
          <button
            onClick={toggleTheme}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: colors.secondary,
              border: `2px solid ${colors.border}`,
              borderRadius: '50px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: colors.text,
              transition: 'all 0.2s ease'
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <StatsCard title="Counter" value={count} color={colors.primary} />
          <StatsCard title="Timer" value={formattedTime} color={colors.accent} />
          <StatsCard title="Total Todos" value={stats.total} color="#f39c12" />
          <StatsCard title="Completed" value={stats.completed} color="#27ae60" />
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          
          {/* Counter Section */}
          <div style={{
            background: colors.secondary,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{ 
              color: colors.primary, 
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              🔢 Interactive Counter
            </h2>
            
            <div style={{
              background: colors.bg,
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: colors.primary,
                fontFamily: 'monospace',
                marginBottom: '1rem'
              }}>
                {count}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={decrement}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  -
                </button>
                
                <button
                  onClick={reset}
                  style={{
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Reset
                </button>
                
                <button
                  onClick={increment}
                  style={{
                    background: colors.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Step Size: {step}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={step}
                onChange={(e: { target: { value: string; }; }) => setStep(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'transparent',
                border: `2px solid ${colors.primary}`,
                color: colors.primary,
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                width: '100%',
                fontSize: '0.9rem'
              }}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
            </button>

            {showAdvanced && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: colors.bg,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="number"
                    placeholder="Set value"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.bg,
                      color: colors.text
                    }}
                    onKeyPress={(e: { key: string; target: { value: string; }; }) => {
                      if (e.key === 'Enter') {
                        setValue(parseInt(e.target.value) || 0);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setValue(count * 2)} style={{ 
                    background: colors.primary, color: 'white', border: 'none', 
                    borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.8rem'
                  }}>
                    Double
                  </button>
                  <button onClick={() => setValue(Math.floor(count / 2))} style={{ 
                    background: colors.primary, color: 'white', border: 'none', 
                    borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.8rem'
                  }}>
                    Half
                  </button>
                  <button onClick={() => setValue(count * -1)} style={{ 
                    background: colors.primary, color: 'white', border: 'none', 
                    borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.8rem'
                  }}>
                    Negate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timer Section */}
          <div style={{
            background: colors.secondary,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{ 
              color: colors.accent, 
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              ⏱️ Timer & Stopwatch
            </h2>
            
            <div style={{
              background: colors.bg,
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: colors.accent,
                fontFamily: 'monospace',
                marginBottom: '1rem'
              }}>
                {formattedTime}
              </div>
              
              <div style={{ 
                fontSize: '0.9rem', 
                color: colors.text, 
                opacity: 0.7,
                marginBottom: '1rem'
              }}>
                {isRunning ? '🟢 Running' : '⏸️ Stopped'} • {time} seconds
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {!isRunning ? (
                  <button
                    onClick={start}
                    style={{
                      background: colors.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    ▶️ Start
                  </button>
                ) : (
                  <button
                    onClick={stop}
                    style={{
                      background: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    ⏸️ Stop
                  </button>
                )}
                
                <button
                  onClick={resetTimer}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Todo List Section */}
        <div style={{
          background: colors.secondary,
          padding: '2rem',
          borderRadius: '16px',
          marginTop: '2rem',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{ 
            color: colors.primary, 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            📝 Todo List Manager
          </h2>
          
          {/* Add Todo Form */}
          <form onSubmit={handleTodoSubmit} style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <input
              ref={inputRef}
              type="text"
              value={newTodo}
              onChange={(e: { target: { value: string | ((prev: string) => string); }; }) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              style={{
                flex: 1,
                minWidth: '300px',
                padding: '0.75rem',
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '1rem',
                background: colors.bg,
                color: colors.text
              }}
            />
            <button
              type="submit"
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              ➕ Add Todo
            </button>
          </form>

          {/* Filter Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {['all', 'active', 'completed'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                style={{
                  background: filter === filterType ? colors.primary : 'transparent',
                  color: filter === filterType ? 'white' : colors.primary,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: '20px',
                  padding: '0.5rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
              >
                {filterType} ({
                  filterType === 'all' ? stats.total :
                  filterType === 'active' ? stats.active :
                  stats.completed
                })
              </button>
            ))}
          </div>

          {/* Todo Items */}
          <div style={{ minHeight: '200px' }}>
            {todos.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: colors.text,
                opacity: 0.6,
                fontSize: '1.1rem'
              }}>
                {filter === 'all' ? '📋 No todos yet. Add one above!' :
                 filter === 'active' ? '✅ No active todos!' :
                 '🎉 No completed todos yet!'}
              </div>
            ) : (
              todos.map((todo: { id: any; }) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))
           ) }
          </div>
        </div>

        {/* Framework Features */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: colors.secondary,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{ 
            color: colors.primary, 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            🎯 Frontend Hamroun Features Demo
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: colors.bg,
              padding: '1.5rem',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h3 style={{ color: colors.primary, margin: '0 0 0.5rem 0' }}>🪝 React-like Hooks</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                useState, useEffect, useRef, useMemo all working perfectly!
              </p>
            </div>
            
            <div style={{
              background: colors.bg,
              padding: '1.5rem',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h3 style={{ color: colors.accent, margin: '0 0 0.5rem 0' }}>🖥️ Server-Side Rendering</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                Full SSR support with client-side hydration for best performance.
              </p>
            </div>
            
            <div style={{
              background: colors.bg,
              padding: '1.5rem',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h3 style={{ color: '#f39c12', margin: '0 0 0.5rem 0' }}>⚡ Fast Development</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                Hot reload, TypeScript support, and modern tooling included.
              </p>
            </div>
            
            <div style={{
              background: colors.bg,
              padding: '1.5rem',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h3 style={{ color: '#e74c3c', margin: '0 0 0.5rem 0' }}>🎨 Theming Support</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                Dynamic theming with custom hooks and responsive design.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          borderTop: `2px solid ${colors.border}`,
          color: colors.text,
          opacity: 0.7
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
            Built with ❤️ using Frontend Hamroun Framework
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            Server-side rendered • Client-side hydrated • Hook-powered
          </p>
        </div>
      </div>
    </div>
  );
}
