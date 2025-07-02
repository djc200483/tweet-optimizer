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

// Featured Gallery Management Endpoints

// Get available images from last 20 days for selection
router.get('/available-images', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle
      FROM generated_images gi
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE gi.created_at >= NOW() - INTERVAL '20 days'
        AND gi.is_private = false
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND gi.prompt ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY gi.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available images:', error);
    res.status(500).json({ error: 'Error fetching available images' });
  }
});

// Get current featured gallery
router.get('/featured-gallery', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle, fgi.position
      FROM featured_gallery_images fgi
      JOIN generated_images gi ON fgi.image_id = gi.id
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE fgi.gallery_id = 1
      ORDER BY fgi.position ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching featured gallery:', error);
    res.status(500).json({ error: 'Error fetching featured gallery' });
  }
});

// Update featured gallery
router.post('/featured-gallery', async (req, res) => {
  try {
    const { imageIds } = req.body; // Array of image IDs in order
    
    if (!Array.isArray(imageIds) || imageIds.length > 10) {
      return res.status(400).json({ error: 'Invalid image selection. Maximum 10 images allowed.' });
    }
    
    // Start transaction
    await db.query('BEGIN');
    
    try {
      // Clear existing featured gallery
      await db.query('DELETE FROM featured_gallery_images WHERE gallery_id = 1');
      
      // Insert new selections
      for (let i = 0; i < imageIds.length; i++) {
        await db.query(
          'INSERT INTO featured_gallery_images (gallery_id, image_id, position) VALUES (1, $1, $2)',
          [imageIds[i], i + 1]
        );
      }
      
      // Update the gallery timestamp
      await db.query(
        'UPDATE featured_gallery SET updated_at = NOW() WHERE id = 1'
      );
      
      await db.query('COMMIT');
      res.json({ message: 'Featured gallery updated successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating featured gallery:', error);
    res.status(500).json({ error: 'Error updating featured gallery' });
  }
});

// Featured Videos Management Endpoints

// Get available videos from last 20 days for selection
router.get('/available-videos', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.video_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle
      FROM generated_images gi
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE gi.created_at >= NOW() - INTERVAL '20 days'
        AND gi.is_private = false
        AND gi.video_url IS NOT NULL
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND gi.prompt ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY gi.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available videos:', error);
    res.status(500).json({ error: 'Error fetching available videos' });
  }
});

// Get current featured videos
router.get('/featured-videos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.video_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle, fvi.position
      FROM featured_videos_items fvi
      JOIN generated_images gi ON fvi.image_id = gi.id
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE fvi.gallery_id = 1 AND gi.video_url IS NOT NULL
      ORDER BY fvi.position ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    res.status(500).json({ error: 'Error fetching featured videos' });
  }
});

// Update featured videos
router.post('/featured-videos', async (req, res) => {
  try {
    const { imageIds } = req.body; // Array of image IDs in order
    
    if (!Array.isArray(imageIds) || imageIds.length > 10) {
      return res.status(400).json({ error: 'Invalid video selection. Maximum 10 videos allowed.' });
    }
    
    // Start transaction
    await db.query('BEGIN');
    
    try {
      // Clear existing featured videos
      await db.query('DELETE FROM featured_videos_items WHERE gallery_id = 1');
      
      // Insert new selections
      for (let i = 0; i < imageIds.length; i++) {
        await db.query(
          'INSERT INTO featured_videos_items (gallery_id, image_id, position) VALUES (1, $1, $2)',
          [imageIds[i], i + 1]
        );
      }
      
      // Update the gallery timestamp
      await db.query(
        'UPDATE featured_videos SET updated_at = NOW() WHERE id = 1'
      );
      
      await db.query('COMMIT');
      res.json({ message: 'Featured videos updated successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating featured videos:', error);
    res.status(500).json({ error: 'Error updating featured videos' });
  }
});

module.exports = router; 