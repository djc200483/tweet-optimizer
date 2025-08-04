-- 20250102_add_model_column.sql

-- Add model column to generated_images table
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS model VARCHAR(255);

-- Create index for model column for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_model ON generated_images(model) WHERE model IS NOT NULL; 