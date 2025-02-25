import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/allowed-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAllowedUsers(data);
      } else {
        setError('Failed to fetch allowed users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const handle = newHandle.startsWith('@') ? newHandle : `@${newHandle}`;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/allow-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle: handle, notes })
      });

      if (response.ok) {
        setSuccess(`Added ${handle} to allowed users`);
        setNewHandle('');
        setNotes('');
        fetchAllowedUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Error adding user');
    }
  };

  const handleToggleStatus = async (handle, currentStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/disable-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle: handle })
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

  if (isLoading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-container">
      <h2>Manage Allowed Users</h2>
      
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <form onSubmit={handleAddUser} className="add-user-form">
        <div className="form-group">
          <label htmlFor="handle">X Handle</label>
          <input
            type="text"
            id="handle"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder="@username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this user"
          />
        </div>

        <button type="submit" className="admin-button">
          Add User
        </button>
      </form>

      <div className="users-list">
        <h3>Allowed Users</h3>
        {allowedUsers.length === 0 ? (
          <p>No users added yet</p>
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
              {allowedUsers.map(user => (
                <tr key={user.id} className={!user.is_active ? 'disabled-user' : ''}>
                  <td>{user.x_handle}</td>
                  <td>{user.notes}</td>
                  <td>{new Date(user.added_at).toLocaleDateString()}</td>
                  <td>{user.is_active ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user.x_handle, user.is_active)}
                      className={`status-toggle ${user.is_active ? 'disable' : 'enable'}`}
                    >
                      {user.is_active ? 'Disable' : 'Enable'}
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