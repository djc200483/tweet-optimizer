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

// In-memory cache for liked-today gallery
let likedTodayCache = {
  date: null, // e.g. '2024-06-10'
  images: null
};

// Helper to get previous UTC day as YYYY-MM-DD
function getPrevUtcDayString() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().slice(0, 10);
}

// GET /api/images/liked-today
router.get('/liked-today', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    if (likedTodayCache.date === todayStr && likedTodayCache.images) {
      return res.json(likedTodayCache.images);
    }
    const prevDay = new Date(today);
    prevDay.setUTCDate(today.getUTCDate() - 1);
    const prevDayStr = prevDay.toISOString().slice(0, 10);
    const prevDayStart = prevDayStr + 'T00:00:00.000Z';
    const prevDayEnd = prevDayStr + 'T23:59:59.999Z';

    // 1. Get images liked during previous UTC day
    const likedResult = await db.query(`
      SELECT gi.*, 
        COUNT(il.id) AS like_count,
        MAX(il.created_at) AS last_liked_at
      FROM image_likes il
      JOIN generated_images gi ON il.image_id = gi.id
      WHERE il.created_at >= $1 AND il.created_at <= $2
        AND gi.is_private = false
      GROUP BY gi.id
      ORDER BY last_liked_at DESC
      LIMIT 80
    `, [prevDayStart, prevDayEnd]);
    let images = likedResult.rows;
    const likedImageIds = images.map(img => img.id);

    // 2. If fewer than 80, fill with random public images not already included
    if (images.length < 80) {
      const fillCount = 80 - images.length;
      const fillResult = await db.query(`
        SELECT gi.*,
          (SELECT COUNT(*) FROM image_likes il WHERE il.image_id = gi.id) AS like_count
        FROM generated_images gi
        WHERE gi.is_private = false
          AND gi.id NOT IN (${likedImageIds.length > 0 ? likedImageIds.join(',') : 'NULL'})
        ORDER BY RANDOM()
        LIMIT $1
      `, [fillCount]);
      images = images.concat(fillResult.rows);
    }
    // Cache for the day
    likedTodayCache = {
      date: todayStr,
      images
    };
    res.json(images);
  } catch (error) {
    console.error('Error fetching liked-today gallery:', error);
    res.status(500).json({ error: 'Failed to fetch liked-today gallery' });
  }
});

module.exports = router; 