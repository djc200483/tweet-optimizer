-- 20240609_add_image_likes.sql

CREATE TABLE IF NOT EXISTS image_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_id INTEGER NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_image_likes_image_id ON image_likes(image_id);
CREATE INDEX IF NOT EXISTS idx_image_likes_user_id ON image_likes(user_id); 