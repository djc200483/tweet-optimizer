const handleDeleteUser = async (x_handle) => {
  try {
    setError('');
    console.log('Attempting to delete user:', x_handle);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/admin/delete-user`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle })
      }
    );

    console.log('Delete response:', response.status);
    if (!response.ok) {
      const data = await response.json();
      console.error('Delete failed:', data);
      throw new Error('Failed to delete user');
    }

    // Refresh the user list
    fetchAllowedUsers();
  } catch (err) {
    setError('Error deleting user');
    console.error('Delete error:', err);
  }
}; 