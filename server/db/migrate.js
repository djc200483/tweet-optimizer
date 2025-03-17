const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { Pool } = require('pg');

// Debug: Log current directory and environment variables
console.log('Current directory:', process.cwd());
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 30));
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

// Export the migrate function
module.exports = migrate; 