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

// Get all public images (explore) with like info
router.get('/explore', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `WITH ranked_images AS (
        SELECT 
          gi.*,
          CASE 
            WHEN u.deleted_at IS NOT NULL THEN 'Deleted User'
            ELSE u.x_handle 
          END as creator_handle
        FROM generated_images gi
        LEFT JOIN users u ON gi.user_id = u.id
        WHERE gi.is_private = false
      )
      SELECT 
        ri.*,
        COALESCE(like_counts.like_count, 0) AS like_count,
        (user_likes.user_id IS NOT NULL) AS liked_by_user
      FROM ranked_images ri
      LEFT JOIN (
        SELECT image_id, COUNT(*) AS like_count
        FROM image_likes
        GROUP BY image_id
      ) like_counts ON like_counts.image_id = ri.id
      LEFT JOIN (
        SELECT image_id, user_id FROM image_likes WHERE user_id = $1
      ) user_likes ON user_likes.image_id = ri.id
      ORDER BY RANDOM()
      LIMIT 300`,
      [userId]
    );

    // Add cache headers
    res.set({
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Expires': new Date(Date.now() + 86400000).toUTCString(),
      'Vary': 'Accept-Encoding'
    });
    
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

// Like or unlike an image
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const imageId = parseInt(req.params.id, 10);
    // Check if already liked
    const existing = await db.query(
      'SELECT id FROM image_likes WHERE user_id = $1 AND image_id = $2',
      [userId, imageId]
    );
    let likedByUser;
    if (existing.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM image_likes WHERE user_id = $1 AND image_id = $2', [userId, imageId]);
      likedByUser = false;
    } else {
      // Like
      await db.query('INSERT INTO image_likes (user_id, image_id) VALUES ($1, $2)', [userId, imageId]);
      likedByUser = true;
    }
    // Return new like count and status
    const likeCountResult = await db.query('SELECT COUNT(*) FROM image_likes WHERE image_id = $1', [imageId]);
    res.json({
      like_count: parseInt(likeCountResult.rows[0].count, 10),
      liked_by_user: likedByUser,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

module.exports = router; 