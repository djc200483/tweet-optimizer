const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get user's personal images
router.get('/my-images', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching personal images:', error);
    res.status(500).json({ error: 'Failed to fetch personal images' });
  }
});

// Get all public images (explore)
router.get('/explore', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        gi.*,
        CASE 
          WHEN u.deleted_at IS NOT NULL THEN 'Deleted User'
          ELSE u.x_handle 
        END as creator_handle
      FROM generated_images gi
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE gi.is_private = false
      ORDER BY gi.created_at DESC
      LIMIT 100`,  // Limiting to prevent overwhelming response
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching explore images:', error);
    res.status(500).json({ error: 'Failed to fetch explore images' });
  }
});

// Save a new generated image
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt, imageUrl, s3Key, isPrivate = false } = req.body;
    
    const result = await db.query(
      'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, is_private) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, prompt, imageUrl, s3Key, isPrivate]
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