import { jsx } from 'frontend-hamroun';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  if (!users || users.length === 0) {
    return (
      <div className="empty-state p-4 text-center bg-gray-50 rounded">
        <p className="text-gray-500">No users available</p>
      </div>
    );
  }
  
  return (
    <div className="user-list">
      <ul className="divide-y divide-gray-100">
        {users.map(user => (
          <li key={user.id} className="py-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <a 
                href={`/users/${user.id}`}
                className="text-blue-600 hover:underline text-sm self-center"
              >
                View Profile
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
