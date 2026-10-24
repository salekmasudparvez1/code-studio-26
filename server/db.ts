import pg from 'pg';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, 'utf8');
      const match = env.match(/DATABASE_URL=([^\r\n]+)/);
      if (match) dbUrl = match[1].trim();
    }
  } catch (e) {
    // ignore
  }
}

export const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS studio_users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure default admin Salek Masud Parvez is present and approved
    await pool.query(`
      INSERT INTO studio_users (id, email, name, role, status)
      VALUES ('auth0|admin_salek', 'sakekmasudparvez@gmail.com', 'Salek Masud Parvez', 'ADMIN', 'APPROVED')
      ON CONFLICT (email) DO UPDATE 
      SET role = 'ADMIN', status = 'APPROVED', updated_at = CURRENT_TIMESTAMP;
    `);

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
}
