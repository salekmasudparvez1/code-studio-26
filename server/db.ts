import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Load .env variables into process.env if not set
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch {
  // ignore
}

let dbUrl = process.env.DATABASE_URL;

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
        password_hash TEXT,
        requested_plan VARCHAR(100) DEFAULT 'PRO',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE studio_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE studio_users ADD COLUMN IF NOT EXISTS requested_plan VARCHAR(100) DEFAULT 'PRO';
      ALTER TABLE studio_users ADD COLUMN IF NOT EXISTS request_note TEXT;
      ALTER TABLE studio_users ADD COLUMN IF NOT EXISTS session_token TEXT;
    `);

    // Ensure default admin Salek Masud Parvez (smp23997@gmail.com) is present and approved
    await pool.query(`
      INSERT INTO studio_users (id, email, name, role, status, password_hash, requested_plan)
      VALUES (
        'auth0|admin_smp',
        'smp23997@gmail.com',
        'Salek Masud Parvez',
        'ADMIN',
        'APPROVED',
        '87c9f86480f2d1e1f579177e77a76059d48b77a11ca4798e3b5df5aa2e8739da',
        'ENTERPRISE'
      )
      ON CONFLICT (email) DO UPDATE 
      SET role = 'ADMIN', status = 'APPROVED', requested_plan = 'ENTERPRISE', updated_at = CURRENT_TIMESTAMP;
    `);

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
}
