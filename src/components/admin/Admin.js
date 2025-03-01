import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import './Admin.css';

export default function Admin() {
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [newHandle, setNewHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchAllowedUsers();
  }, [token]);

  const fetchAllowedUsers = async () => {
    try {
      if (!token) {
        setError('No authentication token found');
        return;
      }

      console.log('Admin fetch with token:', token?.substring(0, 20) + '...');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/allowed-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin fetch response:', response.status);
      if (response.status === 401) {
        setError('Unauthorized - Please log in again');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setAllowedUsers(data);
      } else {
        setError(`Failed to fetch allowed users: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching allowed users:', err);
      setError(`Error loading users: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newHandle) {
      setError('X handle is required');
      return;
    }

    const handle = newHandle.startsWith('@') ? newHandle : `@${newHandle}`;

    console.log('Adding user:', { handle, notes });
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/allow-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle: handle, notes })
      });

      console.log('Add user response:', response.status);
      if (response.ok) {
        setSuccess(`Added ${handle} to allowed users`);
        setNewHandle('');
        setNotes('');
        fetchAllowedUsers();
      } else {
        const data = await response.json();
        console.error('Add user error:', data);
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error('Add user error:', err);
      setError('Error adding user');
    }
  };

  const handleToggleStatus = async (handle, currentStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/toggle-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle: handle, status: !currentStatus })
      });

      if (response.ok) {
        fetchAllowedUsers();
        setSuccess(`User ${handle} has been ${currentStatus ? 'disabled' : 'enabled'}`);
      } else {
        setError('Failed to update user status');
      }
    } catch (err) {
      setError('Error updating user status');
    }
  };

  const handleDeleteUser = async (handle) => {
    if (window.confirm(`Are you sure you want to delete ${handle}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/delete-user`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ x_handle: handle })
        });

        if (response.ok) {
          fetchAllowedUsers();
          setSuccess(`User ${handle} has been deleted`);
        } else {
          setError('Failed to delete user');
        }
      } catch (err) {
        setError('Error deleting user');
      }
    }
  };

  const sortedUsers = useMemo(() => {
    const activeUsers = allowedUsers
      .filter(user => user.is_active)
      .sort((a, b) => a.x_handle.localeCompare(b.x_handle));
    
    const inactiveUsers = allowedUsers
      .filter(user => !user.is_active)
      .sort((a, b) => a.x_handle.localeCompare(b.x_handle));
    
    return { activeUsers, inactiveUsers };
  }, [allowedUsers]);

  if (isLoading) return (
    <div className="admin-loading">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="admin-container">
      <h2>Manage Allowed Users</h2>
      
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}
      {isLoading && <LoadingSpinner />}

      <div className="admin-input-form">
        <label>X Handle</label>
        <input
          type="text"
          value={newHandle}
          onChange={(e) => setNewHandle(e.target.value)}
          placeholder="@username"
        />
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this user"
        />
        <button onClick={handleAddUser}>Add User</button>
      </div>

      <div className="active-users-list">
        <h3>Allowed Users</h3>
        {sortedUsers.activeUsers.length === 0 ? (
          <p>No active users</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>X Handle</th>
                <th>Notes</th>
                <th>Added</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.activeUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.x_handle}</td>
                  <td>{user.notes}</td>
                  <td>{new Date(user.added_at).toLocaleDateString()}</td>
                  <td>Active</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user.x_handle, user.is_active)}
                      className="status-toggle disable"
                    >
                      Disable
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.x_handle)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="inactive-users-list">
        <h3>Disabled Users</h3>
        {sortedUsers.inactiveUsers.length === 0 ? (
          <p>No disabled users</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>X Handle</th>
                <th>Notes</th>
                <th>Added</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.inactiveUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.x_handle}</td>
                  <td>{user.notes}</td>
                  <td>{new Date(user.added_at).toLocaleDateString()}</td>
                  <td>Disabled</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user.x_handle, user.is_active)}
                      className="status-toggle enable"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.x_handle)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 