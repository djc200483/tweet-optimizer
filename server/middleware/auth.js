const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Skip auth check if feature flag is off
    if (!process.env.ENFORCE_AUTH) {
      return next();
    }

    console.log('Auth headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Extracted token:', token);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware; 