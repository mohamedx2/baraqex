import { jsx } from 'frontend-hamroun';
import Layout from '../components/Layout';
import { UserApi } from '../data/api';

const UsersPage = ({ initialState }) => {
  const users = initialState.data?.users || [];

  return (
    <Layout title="User Management">
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Data Fetching Demo</h2>
          <p className="text-blue-700">This page demonstrates dynamic data fetching with the Users API.</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">User List</h2>
          </div>
          
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b">ID</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm text-gray-900">{user.id}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-500">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Static method to fetch initial data for this page
UsersPage.getInitialData = async () => {
  return {
    users: await UserApi.getAll()
  };
};

export default UsersPage;
