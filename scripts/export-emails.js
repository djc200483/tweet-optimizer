const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function exportEmails() {
  try {
    const result = await pool.query('SELECT email FROM users WHERE is_active = true');
    const emails = result.rows.map(row => row.email);
    
    // Write to CSV
    const csvContent = 'email\n' + emails.join('\n');
    fs.writeFileSync('user_emails.csv', csvContent);
    
    console.log(`Successfully exported ${emails.length} email addresses to user_emails.csv`);
    process.exit(0);
  } catch (error) {
    console.error('Error exporting emails:', error);
    process.exit(1);
  }
}

exportEmails(); 