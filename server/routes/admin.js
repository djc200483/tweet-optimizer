const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// Apply admin auth middleware to all routes
router.use(adminAuth);

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
    const result = await db.query(
      'SELECT * FROM allowed_users ORDER BY added_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching allowed users' });
  }
});

module.exports = router; 