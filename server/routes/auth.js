const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register endpoint
router.post('/register', async (req, res) => {
  console.log('Register request received:', req.body);
  try {
    const { email, password, x_handle } = req.body;
    
    console.log('Registration attempt:', {
      email,
      x_handle,
      timestamp: new Date().toISOString()
    });
    
    // Normalize the X handle format
    const normalizedHandle = x_handle.startsWith('@') ? x_handle : `@${x_handle}`;
    
    // Check if user is in allowed list
    console.log('Checking allowed users for:', normalizedHandle);
    const allowedUser = await db.query(
      'SELECT * FROM allowed_users WHERE LOWER(x_handle) = LOWER($1) AND is_active = true',
      [normalizedHandle]
    );
    
    console.log('Allowed user query result:', {
      found: allowedUser.rows.length > 0,
      handle: normalizedHandle,
      queryResult: allowedUser.rows
    });
    
    if (allowedUser.rows.length === 0) {
      return res.status(403).json({ error: 'User not in allowed list' });
    }
    
    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await db.query(
      'SELECT email, x_handle FROM users WHERE email = $1',
      [email]
    );
    
    console.log('Existing user check result:', {
      found: existingUser.rows.length > 0,
      existingUsers: existingUser.rows,
      attemptedEmail: email,
      attemptedHandle: normalizedHandle
    });
    
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      return res.status(400).json({ 
        error: 'A user with this email already exists'
      });
    }
    
    // Separately check if X handle is already registered
    const existingHandle = await db.query(
      'SELECT x_handle FROM users WHERE x_handle = $1',
      [normalizedHandle]
    );
    
    if (existingHandle.rows.length > 0) {
      return res.status(400).json({
        error: 'This X handle is already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, x_handle) VALUES ($1, $2, $3) RETURNING id, email, x_handle',
      [email, hashedPassword, normalizedHandle]
    );
    
    console.log('User created:', result.rows[0]);

    // Generate JWT
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        x_handle: result.rows[0].x_handle
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', { 
      email,
      timestamp: new Date().toISOString()
    });
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Special handling for admin login
    if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
      console.log('Admin login attempt');
      
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error('Admin credentials not properly configured:', {
          hasEmail: !!process.env.ADMIN_EMAIL,
          hasPassword: !!process.env.ADMIN_PASSWORD
        });
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      if (password !== process.env.ADMIN_PASSWORD) {
        console.log('Admin password mismatch');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // For admin login, ignore x_handle requirement
      console.log('Admin login successful');
      const token = jwt.sign(
        { id: 'admin', isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        token,
        user: {
          email: process.env.ADMIN_EMAIL,
          x_handle: 'admin',
          is_admin: true
        }
      });
    }
    
    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    console.log('User lookup result:', {
      found: result.rows.length > 0,
      email,
      userActive: result.rows[0]?.is_active
    });
    
    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(
      password,
      result.rows[0].password_hash
    );
    
    console.log('Password verification:', {
      email,
      valid: validPassword
    });
    
    if (!validPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!result.rows[0].is_active) {
      console.log('Inactive user attempted login:', email);
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        x_handle: result.rows[0].x_handle
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Verify token endpoint
router.all('/verify', async (req, res) => {
  try {
    console.log('Verify request headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in verify:', decoded);
    
    console.log('Token verification:', {
      decoded,
      isAdmin: decoded.isAdmin
    });
    
    // Check if this is an admin token
    if (decoded.isAdmin) {
      console.log('Admin token verified');
      return res.json({
        user: {
          email: process.env.ADMIN_EMAIL,
          x_handle: 'admin',
          is_admin: true
        }
      });
    }
    
    const result = await db.query(
      'SELECT id, email, x_handle FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Debug endpoint - DO NOT USE IN PRODUCTION
router.get('/debug-db-state', async (req, res) => {
  try {
    const allowedUsers = await db.query('SELECT * FROM allowed_users');
    const registeredUsers = await db.query('SELECT email, x_handle, is_active FROM users');
    
    console.log('Database State:', {
      allowedUsers: allowedUsers.rows,
      registeredUsers: registeredUsers.rows
    });
    
    res.json({
      allowedUsers: allowedUsers.rows,
      registeredUsers: registeredUsers.rows
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Error checking database state' });
  }
});

module.exports = router; 