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
    
    // Check if user is in allowed list
    console.log('Checking allowed users for:', x_handle);
    const allowedUser = await db.query(
      'SELECT * FROM allowed_users WHERE x_handle = $1 AND is_active = true',
      [x_handle]
    );
    
    console.log('Allowed user check result:', {
      found: allowedUser.rows.length > 0,
      allowedUsers: allowedUser.rows
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
      attemptedHandle: x_handle
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
      [x_handle]
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
      [email, hashedPassword, x_handle]
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
    
    console.log('Login request received:', { 
      email,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      adminEmailMatch: email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase(),
      hasAdminPassword: !!process.env.ADMIN_PASSWORD
    });
    
    if (!email || !password) {
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
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(
      password,
      result.rows[0].password_hash
    );
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Store reset token in database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + interval \'1 hour\' WHERE id = $2',
      [resetToken, user.rows[0].id]
    );
    
    // In a real app, send email with reset link
    // For now, just return the token
    res.json({ message: 'Password reset instructions sent' });
  } catch (error) {
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token and check expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW()',
      [decoded.id, token]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, decoded.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
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