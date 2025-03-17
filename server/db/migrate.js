const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { Pool } = require('pg');

// Debug: Log current directory and environment variables
console.log('Current directory:', process.cwd());
const envPath = path.join(__dirname, '..', '.env');
console.log('Looking for .env at:', envPath);

// Read and parse the .env file manually
try {
  // Try reading with different encodings
  let envContent;
  try {
    // Try UTF-16
    envContent = fs.readFileSync(envPath, 'utf16le');
  } catch (e) {
    // Fallback to UTF-8
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Clean the content
  envContent = envContent
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
  
  console.log('Found .env file with content length:', envContent.length);
  
  // Parse each line and set environment variables
  const lines = envContent.split('\n');
  lines.forEach((line, index) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return; // Skip empty lines and comments
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Clean the key name to ensure no special characters
      const cleanKey = key.replace(/[^\x00-\x7F]/g, '');
      console.log(`Setting ${cleanKey}=${value.substring(0, 20)}...`);
      process.env[cleanKey] = value;
    }
  });
  
  console.log('After parsing, DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 30));
  }
} catch (err) {
  console.error('Error reading .env file:', err);
  process.exit(1);
}

// Parse the DATABASE_URL to add sslmode=disable
let connectionConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  // Add sslmode=disable to the connection string
  url.searchParams.set('sslmode', 'disable');
  connectionConfig = { connectionString: url.toString() };
  console.log('Using database URL with SSL disabled');
} else {
  console.error('DATABASE_URL is not set in environment');
  process.exit(1);
}

// Create a connection pool with SSL disabled
const pool = new Pool(connectionConfig);

// Test the connection
pool.connect()
  .then(client => {
    console.log('Successfully connected to database');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getMigrationsDir() {
  return path.join(__dirname, 'migrations');
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function executeMigration(filePath, direction = 'up') {
  const content = await fsPromises.readFile(filePath, 'utf-8');
  const migrationName = path.basename(filePath);
  
  let sql;
  if (direction === 'up') {
    sql = content.split('-- DOWN Migration')[0];
  } else {
    sql = content.split('/*')[1].split('*/')[0];
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Execute the migration
    await client.query(sql);
    
    // Record the migration
    if (direction === 'up') {
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [migrationName]
      );
    } else {
      await client.query(
        'DELETE FROM migrations WHERE name = $1',
        [migrationName]
      );
    }
    
    await client.query('COMMIT');
    console.log(`Successfully ${direction === 'up' ? 'applied' : 'rolled back'} migration: ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function migrate(direction = 'up') {
  try {
    await ensureMigrationsTable();
    
    const migrationsDir = await getMigrationsDir();
    const files = await fsPromises.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    
    const executedMigrations = await getExecutedMigrations();
    
    if (direction === 'up') {
      const pendingMigrations = sqlFiles.filter(f => !executedMigrations.includes(f));
      
      for (const file of pendingMigrations) {
        await executeMigration(path.join(migrationsDir, file), 'up');
      }
    } else {
      const migrationsToRollback = sqlFiles
        .filter(f => executedMigrations.includes(f))
        .reverse();
      
      for (const file of migrationsToRollback) {
        await executeMigration(path.join(migrationsDir, file), 'down');
      }
    }
    
    console.log(`Migration ${direction} completed successfully`);
  } catch (error) {
    console.error(`Migration ${direction} failed:`, error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute migrations based on command line argument
const direction = process.argv[2] === 'down' ? 'down' : 'up';
migrate(direction); 