const jwt = require('jsonwebtoken');
const db = require('../db');

// Authentication middleware that ensures user ID is always set
// When ENFORCE_AUTH is off, uses a default user ID of 1
const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Extracted token:', token);
    
    if (!token) {
      // If auth is not enforced, create a default user
      if (!process.env.ENFORCE_AUTH) {
        req.user = { id: 1 }; // Default user ID
        return next();
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    // Fetch user from DB and check is_active
    const result = await db.query('SELECT id, is_active FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    // If auth is not enforced, create a default user
    if (!process.env.ENFORCE_AUTH) {
      req.user = { id: 1 }; // Default user ID
      return next();
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware; 