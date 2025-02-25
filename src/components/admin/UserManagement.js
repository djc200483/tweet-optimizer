const handleDeleteUser = async (x_handle) => {
  try {
    setError('');
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/admin/delete-user-complete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x_handle })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    // Refresh the user list
    fetchAllowedUsers();
  } catch (err) {
    setError('Error deleting user');
    console.error('Delete error:', err);
  }
}; 