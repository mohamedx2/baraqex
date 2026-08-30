import { jsx, useState, useEffect } from 'frontend-hamroun';
import { UserApi } from '../../data/api';

export default function UserDetail({ user, posts, initialState }) {
  // State for client-side data fetching when needed
  const [userData, setUserData] = useState(user);
  const [userPosts, setUserPosts] = useState(posts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user ID from route params
  const { id } = initialState?.params || {};
  
  // Fetch user data if not provided from server
  useEffect(() => {
    if (!userData && id) {
      setLoading(true);
      
      Promise.all([
        UserApi.getById(id),
        UserApi.getPosts(id)
      ])
        .then(([userData, postsData]) => {
          setUserData(userData);
          setUserPosts(postsData);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          setError(err.message || 'Failed to load user data');
          setLoading(false);
        });
    }
  }, [userData, id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse rounded-md bg-gray-100 p-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <h2 className="text-lg font-bold text-red-700">Error Loading User</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <h2 className="text-lg font-bold text-yellow-700">User Not Found</h2>
          <p className="text-yellow-600">Could not find user with ID: {id}</p>
          <a href="/users" className="text-blue-600 hover:underline mt-2 block">
            Back to Users List
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{userData.name}</h1>
        <div className="user-info mb-6">
          <p className="text-gray-600">
            <span className="font-bold">ID:</span> {userData.id}
          </p>
          <p className="text-gray-600">
            <span className="font-bold">Email:</span> {userData.email}
          </p>
        </div>
        
        <a href="/users" className="text-blue-600 hover:underline">
          Back to Users List
        </a>
      </div>
      
      {userPosts && userPosts.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Posts by {userData.name}</h2>
          <div className="space-y-4">
            {userPosts.map(post => (
              <div key={post.id} className="border-b pb-4">
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <p className="text-gray-600">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Posts by {userData.name}</h2>
          <p className="text-gray-500 italic">No posts found for this user.</p>
        </div>
      )}
    </div>
  );
}

// Next.js style server-side data fetching
export async function getServerSideProps({ params }) {
  try {
    const userId = params.id;
    
    // Parallel data fetching
    const [user, posts] = await Promise.all([
      UserApi.getById(parseInt(userId)),
      UserApi.getPosts(parseInt(userId))
    ]);
    
    // Handle user not found
    if (!user) {
      return {
        notFound: true
      };
    }
    
    return {
      props: {
        user,
        posts
      }
    };
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    
    // Pass the error for client-side handling
    return {
      props: {
        error: {
          message: error.message,
          status: error.status || 500
        },
        user: null,
        posts: []
      }
    };
  }
}
