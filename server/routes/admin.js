const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { deleteImagesByUser } = require('../services/cleanupService');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Admin route token:', token);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded admin token:', decoded);
    
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply admin auth middleware to all routes
router.use(authMiddleware);

// Add user to allowed list
router.post('/allow-user', async (req, res) => {
  try {
    const { x_handle, notes } = req.body;
    
    await db.query(
      'INSERT INTO allowed_users (x_handle, notes) VALUES ($1, $2)',
      [x_handle, notes]
    );
    
    res.json({ message: 'User added to allowed list' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding user to allowed list' });
  }
});

// Disable user
router.post('/toggle-user-status', async (req, res) => {
  try {
    const { x_handle, status } = req.body;
    
    await db.query(
      'UPDATE allowed_users SET is_active = $2 WHERE x_handle = $1',
      [x_handle, status]
    );
    
    // Also update user account if it exists
    await db.query(
      'UPDATE users SET is_active = $2 WHERE x_handle = $1',
      [x_handle, status]
    );
    
    res.json({ message: `User ${status ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// Get all allowed users
router.get('/allowed-users', async (req, res) => {
  try {
    console.log('Fetching allowed users...');
    const result = await db.query(
      `SELECT au.*, u.id as user_id
       FROM allowed_users au
       LEFT JOIN users u ON au.x_handle = u.x_handle
       ORDER BY au.added_at DESC`
    );
    console.log('Found users:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching allowed users:', error);
    res.status(500).json({ error: 'Error fetching allowed users' });
  }
});

// Delete user
router.delete('/delete-user', async (req, res) => {
  try {
    const { x_handle } = req.body;
    console.log('Deleting user:', x_handle);
    
    // First delete from users table if they exist
    await db.query(
      'DELETE FROM users WHERE x_handle = $1',
      [x_handle]
    );
    
    // Then delete from allowed_users
    await db.query(
      'DELETE FROM allowed_users WHERE x_handle = $1',
      [x_handle]
    );
    
    console.log('User deleted successfully:', x_handle);
    res.json({ message: 'User completely removed from system' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Add this new endpoint for admin debugging
router.get('/list-users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT email, x_handle, is_active FROM users'
    );
    console.log('All users:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Error listing users' });
  }
});

router.delete('/delete-user-images/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const result = await deleteImagesByUser(userId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/delete-user-images-by-handle/:x_handle', authMiddleware, async (req, res) => {
    try {
        const { x_handle } = req.params;
        const userResult = await db.query('SELECT id FROM users WHERE x_handle = $1', [x_handle]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userResult.rows[0].id;
        const result = await deleteImagesByUser(userId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 