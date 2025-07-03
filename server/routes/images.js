const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const Replicate = require('replicate');
const AWS = require('aws-sdk');
const { uploadImageBufferToS3 } = require('../s3Service');
const fetch = require('node-fetch');

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Video generation rate limiting - 3 videos per day per user
const videoGenerationCounts = new Map();

// Reset video generation counts daily
setInterval(() => {
  videoGenerationCounts.clear();
}, 24 * 60 * 60 * 1000); // 24 hours

// Helper function to check video generation limit
function checkVideoGenerationLimit(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}-${today}`;
  const count = videoGenerationCounts.get(key) || 0;
  
  if (count >= 3) {
    return false;
  }
  
  videoGenerationCounts.set(key, count + 1);
  return true;
}

// Helper function to get remaining video generations
function getRemainingVideoGenerations(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}-${today}`;
  const count = videoGenerationCounts.get(key) || 0;
  return Math.max(0, 3 - count);
}

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
router.get('/explore', async (req, res) => {
  try {
    // If user is logged in, get their id from token, else null
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.replace('Bearer ', ''), process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        userId = null;
      }
    }
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
    const { prompt, imageUrl, s3Key, isPrivate = false, videoUrl = null } = req.body;
    
    const result = await db.query(
      'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, video_url, is_private) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, prompt, imageUrl, s3Key, videoUrl, isPrivate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving generated image:', error);
    res.status(500).json({ error: 'Failed to save generated image' });
  }
});

// Generate video from image
router.post('/generate-video', authMiddleware, async (req, res) => {
  try {
    const { imageUrl, prompt, cameraFixed = false } = req.body;
    
    // Check video generation limit
    if (!checkVideoGenerationLimit(req.user.id)) {
      return res.status(429).json({ 
        error: 'Video generation limit reached. You can generate 3 videos per day.',
        remaining: 0
      });
    }
    
    // Validate required fields
    if (!imageUrl || !prompt) {
      return res.status(400).json({ error: 'Image URL and prompt are required' });
    }
    
    // Handle image upload if it's a base64 string (File object from frontend)
    let processedImageUrl = imageUrl;
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(imageUrl, 'base64');
      const timestamp = Date.now();
      const key = `user-images/${req.user.id}/${timestamp}.png`;
      const s3Result = await uploadImageBufferToS3(buffer, key);
      if (!s3Result.success) {
        return res.status(500).json({ error: 'Failed to upload image to S3', details: s3Result.error });
      }
      processedImageUrl = s3Result.s3Url;
    }
    
    // Start video generation
    console.log(`Starting video generation for user ${req.user.id}`);
    
    const prediction = await replicate.predictions.create({
      version: "bytedance/seedance-1-lite",
      input: {
        fps: 24,
        image: processedImageUrl,
        prompt: prompt,
        duration: 5,
        resolution: "720p",
        camera_fixed: cameraFixed
      },
    });
    
    // Return prediction ID for polling
    res.json({
      prediction_id: prediction.id,
      status: prediction.status,
      remaining: getRemainingVideoGenerations(req.user.id)
    });
    
  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Check video generation status
router.get('/video-status/:predictionId', authMiddleware, async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    const prediction = await replicate.predictions.get(predictionId);
    
    if (prediction.status === 'succeeded' && prediction.output) {
      // Check if this video has already been processed
      const existingVideo = await db.query(
        'SELECT id FROM generated_images WHERE user_id = $1 AND prompt = $2 AND video_url IS NOT NULL AND created_at > NOW() - INTERVAL \'5 minutes\'',
        [req.user.id, prediction.input.prompt]
      );
      
      if (existingVideo.rows.length > 0) {
        // Video already exists, return existing data
        res.json({
          status: 'completed',
          video_url: existingVideo.rows[0].video_url,
          image: existingVideo.rows[0]
        });
        return;
      }
      
      // Video generation completed, save to database and S3
      const videoUrl = prediction.output;
      
      // Upload to S3 using the same pattern as images
      const videoKey = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
      
      // Download video from Replicate and upload to S3
      const videoResponse = await fetch(videoUrl);
      const videoBuffer = await videoResponse.arrayBuffer();
      
      // Use the same S3 service pattern as images
      const s3Result = await uploadImageBufferToS3(Buffer.from(videoBuffer), videoKey, 'video/mp4');
      if (!s3Result.success) {
        console.error('Failed to upload video to S3:', s3Result.error);
        return res.status(500).json({ error: 'Failed to upload video to S3' });
      }
      
      const s3VideoUrl = s3Result.s3Url;
      
      // Save to database
      const result = await db.query(
        'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, aspect_ratio, video_url, is_private) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [req.user.id, prediction.input.prompt, prediction.input.image, prediction.input.image, '16:9', s3VideoUrl, false]
      );
      
      res.json({
        status: 'completed',
        video_url: s3VideoUrl,
        image: result.rows[0]
      });
    } else if (prediction.status === 'failed') {
      res.json({
        status: 'failed',
        error: prediction.error || 'Video generation failed'
      });
    } else {
      // Still processing
      res.json({
        status: prediction.status,
        progress: prediction.progress || 0
      });
    }
    
  } catch (error) {
    console.error('Error checking video status:', error);
    res.status(500).json({ error: 'Failed to check video status' });
  }
});

// Get remaining video generations
router.get('/video-remaining', authMiddleware, async (req, res) => {
  try {
    const remaining = getRemainingVideoGenerations(req.user.id);
    res.json({ remaining });
  } catch (error) {
    console.error('Error getting remaining video generations:', error);
    res.status(500).json({ error: 'Failed to get remaining video generations' });
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
      let fillResult;
      if (likedImageIds.length > 0) {
        fillResult = await db.query(`
          SELECT gi.*,
            (SELECT COUNT(*) FROM image_likes il WHERE il.image_id = gi.id) AS like_count
          FROM generated_images gi
          WHERE gi.is_private = false
            AND gi.id NOT IN (${likedImageIds.join(',')})
          ORDER BY RANDOM()
          LIMIT $1
        `, [fillCount]);
      } else {
        fillResult = await db.query(`
          SELECT gi.*,
            (SELECT COUNT(*) FROM image_likes il WHERE il.image_id = gi.id) AS like_count
          FROM generated_images gi
          WHERE gi.is_private = false
          ORDER BY RANDOM()
          LIMIT $1
        `, [fillCount]);
      }
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

// Proxy video download for mobile/desktop compatibility
router.get('/download-video/:key', async (req, res) => {
  const key = req.params.key;
  const params = {
    Bucket: 'echosphere-images', // update to your actual bucket name if different
    Key: `videos/${key}`
  };
  try {
    const s3 = new (require('aws-sdk')).S3();
    const s3Stream = s3.getObject(params).createReadStream();
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    s3Stream.pipe(res);
  } catch (err) {
    res.status(500).send('Error downloading video');
  }
});

module.exports = router; 