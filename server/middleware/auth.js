const jwt = require('jsonwebtoken');

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