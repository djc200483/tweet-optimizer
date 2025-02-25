const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

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
router.post('/disable-user', async (req, res) => {
  try {
    const { x_handle } = req.body;
    
    await db.query(
      'UPDATE allowed_users SET is_active = false WHERE x_handle = $1',
      [x_handle]
    );
    
    // Also disable user account if it exists
    await db.query(
      'UPDATE users SET is_active = false WHERE x_handle = $1',
      [x_handle]
    );
    
    res.json({ message: 'User disabled' });
  } catch (error) {
    res.status(500).json({ error: 'Error disabling user' });
  }
});

// Get all allowed users
router.get('/allowed-users', async (req, res) => {
  try {
    console.log('Fetching allowed users...');
    const result = await db.query(
      'SELECT * FROM allowed_users ORDER BY added_at DESC'
    );
    console.log('Found users:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching allowed users:', error);
    res.status(500).json({ error: 'Error fetching allowed users' });
  }
});

module.exports = router; 