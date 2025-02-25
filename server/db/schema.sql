-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    x_handle VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allowed_users (
    id SERIAL PRIMARY KEY,
    x_handle VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
); 