-- 20250101_create_featured_videos.sql

-- Featured videos configuration table
CREATE TABLE IF NOT EXISTS featured_videos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Homepage Featured Videos',
    max_videos INTEGER DEFAULT 10,
    videos_per_page INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Featured videos items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS featured_videos_items (
    id SERIAL PRIMARY KEY,
    gallery_id INTEGER NOT NULL REFERENCES featured_videos(id) ON DELETE CASCADE,
    image_id INTEGER NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (gallery_id, image_id)
);

-- Insert default videos gallery
INSERT INTO featured_videos (id, name) VALUES (1, 'Homepage Featured Videos') ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_videos_items_gallery_id ON featured_videos_items(gallery_id);
CREATE INDEX IF NOT EXISTS idx_featured_videos_items_image_id ON featured_videos_items(image_id);
CREATE INDEX IF NOT EXISTS idx_featured_videos_items_position ON featured_videos_items(position); 