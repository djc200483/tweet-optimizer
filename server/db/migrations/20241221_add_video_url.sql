-- 20241221_add_video_url.sql

-- Add video_url column to generated_images table
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create index for video_url for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_video_url ON generated_images(video_url) WHERE video_url IS NOT NULL; 