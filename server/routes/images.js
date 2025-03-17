const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all generated images for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // If a specific user's images are requested
    if (req.query.userId) {
      const result = await db.query(
        `SELECT 
          gi.*,
          CASE 
            WHEN u.deleted_at IS NOT NULL THEN 'Deleted User'
            ELSE u.x_handle 
          END as creator_handle
        FROM generated_images gi
        LEFT JOIN users u ON gi.user_id = u.id
        WHERE gi.user_id = $1 
          AND (gi.is_private = false OR gi.user_id = $2)
        ORDER BY gi.created_at DESC`,
        [req.query.userId, req.user.id]
      );
      res.json(result.rows);
    } else {
      // Get current user's images
      const result = await db.query(
        `SELECT 
          gi.*,
          CASE 
            WHEN u.deleted_at IS NOT NULL THEN 'Deleted User'
            ELSE u.x_handle 
          END as creator_handle
        FROM generated_images gi
        LEFT JOIN users u ON gi.user_id = u.id
        WHERE gi.user_id = $1
        ORDER BY gi.created_at DESC`,
        [req.user.id]
      );
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching generated images:', error);
    res.status(500).json({ error: 'Failed to fetch generated images' });
  }
});

// Save a new generated image
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt, imageUrl, s3Key } = req.body;
    
    const result = await db.query(
      'INSERT INTO generated_images (user_id, prompt, image_url, s3_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, prompt, imageUrl, s3Key]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving generated image:', error);
    res.status(500).json({ error: 'Failed to save generated image' });
  }
});

// Delete a generated image
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM generated_images 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found or unauthorized' });
    }
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting generated image:', error);
    res.status(500).json({ error: 'Failed to delete generated image' });
  }
});

module.exports = router; 