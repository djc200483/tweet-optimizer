-- UP Migration
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add an index for performance on soft delete queries
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- DOWN Migration
/*
DROP INDEX IF EXISTS idx_users_deleted_at;
ALTER TABLE users DROP COLUMN deleted_at;
*/ 