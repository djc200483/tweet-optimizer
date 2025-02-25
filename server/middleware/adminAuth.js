const jwt = require('jsonwebtoken');
const db = require('../db');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_admin = true AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = adminAuth; 