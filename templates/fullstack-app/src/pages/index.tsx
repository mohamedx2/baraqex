import { jsx, useState, useEffect, batchUpdates } from 'frontend-hamroun';
import UserList from '../components/UserList';
import StateDemo from '../components/StateDemo';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UserApi } from '../data/api';

// Home Page Component with Server Side Props
export default function HomePage({ users, posts, initialState }) {
  const [state, setState] = useState(initialState || {});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch data when refresh is triggered
  useEffect(() => {
    if (refreshTrigger === 0) return; // Skip initial render
    
    async function fetchData() {
      try {
        const [users, posts] = await Promise.all([
          UserApi.getAll(),
          UserApi.getPosts()
        ]);
        
        // Use batch updates for efficiency
        batchUpdates(() => {
          setState(prev => ({
            ...prev,
            data: {
              ...prev.data,
              users,
              posts
            },
            lastUpdate: new Date().toISOString()
          }));
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    
    fetchData();
  }, [refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(t => t + 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Welcome to your Next-style Frontend Hamroun application!
      </h1>
      
      <div className="mb-8">
        <button 
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={handleRefresh}
        >
          Refresh Data
        </button>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <p className="text-blue-700">
            Last updated: {state.lastUpdate || 'Never'} 
          </p>
        </div>
      </div>
      
      <ErrorBoundary>
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User List</h2>
          <UserList users={users || state.data?.users || []} />
        </div>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <StateDemo />
      </ErrorBoundary>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Application State</h3>
        <pre className="overflow-auto p-4 bg-gray-100 rounded-md text-sm text-gray-800">
          {JSON.stringify({ users, posts, ...state }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Server-side data fetching (Next.js style)
export async function getServerSideProps() {
  try {
    const users = await UserApi.getAll();
    const posts = await UserApi.getPosts();
    
    return {
      props: {
        users,
        posts
      }
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      props: {
        users: [],
        posts: []
      }
    };
  }
}
