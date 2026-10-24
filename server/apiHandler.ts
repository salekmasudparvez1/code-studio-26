import crypto from 'crypto';
import { pool, ensureDbInitialized } from './db.ts';

export interface StudioUserRecord {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_plan?: string;
  request_note?: string;
  password_hash?: string;
  session_token?: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

// Production PBKDF2 password hashing with salt
function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // Fallback for legacy sha256 hashes
  if (!storedHash.includes(':')) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    return legacyHash === storedHash;
  }
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function handleApiRequest(
  urlPath: string,
  method: string,
  bodyData?: any,
  queryParams?: Record<string, string>,
  headers?: Record<string, string | string[]>
): Promise<{ status: number; data: any }> {
  await ensureDbInitialized();

  // Normalize path without trailing slash
  const path = urlPath.replace(/\/$/, '');

  // 0. Auth0 Public Client Config: GET /api/auth/config
  if (path === '/api/auth/config' && method === 'GET') {
    const rawDomain = process.env.VITE_AUTH0_DOMAIN || process.env.AUTH0_DOMAIN || '';
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const clientId = process.env.VITE_AUTH0_CLIENT_ID || process.env.AUTH0_CLIENT_ID || '';
    return {
      status: 200,
      data: {
        domain: cleanDomain,
        clientId: clientId,
      },
    };
  }

  // 1. Direct Email/Password Login: POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = bodyData || {};
    if (!email || typeof email !== 'string') {
      return { status: 400, data: { error: 'Valid email address is required.' } };
    }
    if (!password || typeof password !== 'string') {
      return { status: 400, data: { error: 'Password is required.' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdminEmail =
      normalizedEmail === 'smp23997@gmail.com' ||
      normalizedEmail === 'sakekmasudparvez@gmail.com' ||
      normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

    const expectedAdminPass = process.env.ADMIN_PASSWORD || 'admin_parvez@25$J';

    if (isAdminEmail) {
      if (password !== expectedAdminPass) {
        return { status: 401, data: { error: 'Invalid administrator credentials.' } };
      }
    }

    // Check if user exists in database
    const existing = await pool.query(
      'SELECT * FROM studio_users WHERE LOWER(email) = LOWER($1);',
      [normalizedEmail]
    );

    const sessionToken = generateSessionToken();

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (!isAdminEmail && user.password_hash) {
        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) {
          return { status: 401, data: { error: 'Incorrect email or password.' } };
        }
      }

      await pool.query(
        'UPDATE studio_users SET last_login_at = CURRENT_TIMESTAMP, session_token = $1 WHERE id = $2;',
        [sessionToken, user.id]
      );

      const isPermitted = user.status === 'APPROVED' || user.role === 'ADMIN';
      return {
        status: 200,
        data: {
          user: { ...user, session_token: sessionToken },
          token: sessionToken,
          permitted: isPermitted,
          isAdmin: user.role === 'ADMIN',
        },
      };
    }

    // New user signing in: If admin email, auto-insert; otherwise inform user to sign up
    if (isAdminEmail) {
      const userId = 'auth0|admin_smp';
      const insertRes = await pool.query(
        `INSERT INTO studio_users (id, email, name, role, status, password_hash, requested_plan, session_token, last_login_at)
         VALUES ($1, $2, 'Salek Masud Parvez', 'ADMIN', 'APPROVED', $3, 'ENTERPRISE', $4, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [userId, normalizedEmail, hashPassword(expectedAdminPass), sessionToken]
      );

      const newUser = insertRes.rows[0];
      return {
        status: 200,
        data: {
          user: newUser,
          token: sessionToken,
          permitted: true,
          isAdmin: true,
        },
      };
    }

    return {
      status: 404,
      data: { error: 'Account not found. Please click "Create Account" to register.' },
    };
  }

  // 2. User Sign Up: POST /api/auth/signup
  if (path === '/api/auth/signup' && method === 'POST') {
    const { name, email, password } = bodyData || {};
    if (!email || !email.includes('@')) {
      return { status: 400, data: { error: 'Please enter a valid email address.' } };
    }
    if (!password || password.length < 6) {
      return { status: 400, data: { error: 'Password must be at least 6 characters long.' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userName = (name && name.trim().length > 0 ? name.trim() : normalizedEmail.split('@')[0]);
    const isAdminEmail =
      normalizedEmail === 'smp23997@gmail.com' ||
      normalizedEmail === 'sakekmasudparvez@gmail.com' ||
      normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

    const initialRole = isAdminEmail ? 'ADMIN' : 'USER';
    const initialStatus = isAdminEmail ? 'APPROVED' : 'PENDING';
    const passHash = hashPassword(password);
    const userId = `user_${Date.now()}`;
    const sessionToken = generateSessionToken();

    const res = await pool.query(
      `INSERT INTO studio_users (id, email, name, role, status, password_hash, requested_plan, session_token, last_login_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PRO', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE
       SET
         name = COALESCE($3, studio_users.name),
         password_hash = COALESCE($6, studio_users.password_hash),
         session_token = $7,
         last_login_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [userId, normalizedEmail, userName, initialRole, initialStatus, passHash, sessionToken]
    );

    const user = res.rows[0];
    return {
      status: 200,
      data: {
        user,
        token: sessionToken,
        permitted: user.status === 'APPROVED' || user.role === 'ADMIN',
        isAdmin: user.role === 'ADMIN',
      },
    };
  }

  // 3. User Sync (Auth0 & Quick Profiles): POST /api/auth/sync
  if (path === '/api/auth/sync' && method === 'POST') {
    const { id, email, name, picture, password } = bodyData || {};
    if (!email) {
      return { status: 400, data: { error: 'Email is required' } };
    }

    const userId = id || `user_${Date.now()}`;
    const userName = name || email.split('@')[0];
    const normalizedEmail = email.toLowerCase().trim();
    const isAdminEmail =
      normalizedEmail === 'smp23997@gmail.com' ||
      normalizedEmail === 'sakekmasudparvez@gmail.com' ||
      normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

    if (isAdminEmail && password) {
      const expectedPass = process.env.ADMIN_PASSWORD || 'admin_parvez@25$J';
      if (password !== expectedPass) {
        return { status: 401, data: { error: 'Invalid admin password' } };
      }
    }

    const initialRole = isAdminEmail ? 'ADMIN' : 'USER';
    const initialStatus = isAdminEmail ? 'APPROVED' : 'PENDING';
    const passHash = password ? hashPassword(password) : null;
    const sessionToken = generateSessionToken();

    const query = `
      INSERT INTO studio_users (id, email, name, picture, role, status, password_hash, requested_plan, session_token, last_login_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PRO', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE 
      SET 
        name = COALESCE($3, studio_users.name),
        picture = COALESCE($4, studio_users.picture),
        role = CASE WHEN $5 = 'ADMIN' THEN 'ADMIN' ELSE studio_users.role END,
        status = CASE WHEN $6 = 'APPROVED' THEN 'APPROVED' ELSE studio_users.status END,
        password_hash = COALESCE($7, studio_users.password_hash),
        session_token = $8,
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await pool.query(query, [
      userId,
      normalizedEmail,
      userName,
      picture || null,
      initialRole,
      initialStatus,
      passHash,
      sessionToken,
    ]);

    const user: StudioUserRecord = res.rows[0];
    const isPermitted = user.status === 'APPROVED' || user.role === 'ADMIN';

    return {
      status: 200,
      data: {
        user,
        token: sessionToken,
        permitted: isPermitted,
        isAdmin: user.role === 'ADMIN',
      },
    };
  }

  // 4. Current User Status: GET /api/auth/me
  if (path === '/api/auth/me' && method === 'GET') {
    const email = queryParams?.email;
    const token = queryParams?.token;

    let res;
    if (email) {
      res = await pool.query('SELECT * FROM studio_users WHERE LOWER(email) = LOWER($1);', [
        email,
      ]);
    } else if (token) {
      res = await pool.query('SELECT * FROM studio_users WHERE session_token = $1;', [token]);
    } else {
      return { status: 400, data: { error: 'Authentication parameter required (email or session token)' } };
    }

    if (!res || res.rows.length === 0) {
      return { status: 404, data: { error: 'User account not found' } };
    }

    const user: StudioUserRecord = res.rows[0];
    const isPermitted = user.status === 'APPROVED' || user.role === 'ADMIN';

    return {
      status: 200,
      data: {
        user,
        permitted: isPermitted,
        isAdmin: user.role === 'ADMIN',
      },
    };
  }

  // 5. Sign Out: POST /api/auth/logout
  if (path === '/api/auth/logout' && method === 'POST') {
    const { email } = bodyData || {};
    if (email) {
      await pool.query('UPDATE studio_users SET session_token = NULL WHERE LOWER(email) = LOWER($1);', [
        email,
      ]);
    }
    return {
      status: 200,
      data: { success: true },
    };
  }

  // 6. Request Studio Package Access: POST /api/access/request
  if (path === '/api/access/request' && method === 'POST') {
    const { email, plan, note } = bodyData || {};
    if (!email) {
      return { status: 400, data: { error: 'User email is required to submit access request' } };
    }

    const targetPlan = (plan || 'PRO').toUpperCase();
    const normalizedEmail = email.toLowerCase().trim();
    const requestNote = (note || '').trim();

    const res = await pool.query(
      `UPDATE studio_users
       SET requested_plan = $1, request_note = $2, status = 'PENDING', updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = LOWER($3)
       RETURNING *;`,
      [targetPlan, requestNote, normalizedEmail]
    );

    if (res.rows.length === 0) {
      const userId = `user_${Date.now()}`;
      const ins = await pool.query(
        `INSERT INTO studio_users (id, email, name, role, status, requested_plan, request_note, last_login_at, updated_at)
         VALUES ($1, $2, $3, 'USER', 'PENDING', $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [userId, normalizedEmail, normalizedEmail.split('@')[0], targetPlan, requestNote]
      );
      return {
        status: 200,
        data: {
          success: true,
          user: ins.rows[0],
          message: `Studio access request for ${targetPlan} plan successfully submitted to Administrator Salek Masud Parvez.`,
        },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        user: res.rows[0],
        message: `Studio access request for ${targetPlan} plan successfully submitted to Administrator Salek Masud Parvez.`,
      },
    };
  }

  // 7. Admin: List All Users: GET /api/admin/users
  if (path === '/api/admin/users' && method === 'GET') {
    const res = await pool.query('SELECT * FROM studio_users ORDER BY created_at DESC;');
    return {
      status: 200,
      data: {
        users: res.rows,
      },
    };
  }

  // 8. Admin: Update User Approval Status: POST /api/admin/users/status
  if (path === '/api/admin/users/status' && method === 'POST') {
    const { email, status } = bodyData || {};
    if (!email || !['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
      return { status: 400, data: { error: 'Valid email and status required' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'smp23997@gmail.com' && status !== 'APPROVED') {
      return { status: 403, data: { error: 'Root administrator account cannot be revoked.' } };
    }

    const res = await pool.query(
      'UPDATE studio_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2) RETURNING *;',
      [status, normalizedEmail]
    );

    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found' } };
    }

    return {
      status: 200,
      data: {
        user: res.rows[0],
        message: `User access status updated to ${status}`,
      },
    };
  }

  // 9. Admin: Update User Role: POST /api/admin/users/role
  if (path === '/api/admin/users/role' && method === 'POST') {
    const { email, role } = bodyData || {};
    if (!email || !['USER', 'ADMIN'].includes(role)) {
      return { status: 400, data: { error: 'Valid email and role required' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'smp23997@gmail.com' && role !== 'ADMIN') {
      return { status: 403, data: { error: 'Root administrator account cannot be downgraded.' } };
    }

    const res = await pool.query(
      'UPDATE studio_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2) RETURNING *;',
      [role, normalizedEmail]
    );

    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found' } };
    }

    return {
      status: 200,
      data: {
        user: res.rows[0],
        message: `User role updated to ${role}`,
      },
    };
  }

  // 10. Admin: Delete User: POST /api/admin/users/delete or DELETE /api/admin/users
  if ((path === '/api/admin/users/delete' && method === 'POST') || (path === '/api/admin/users' && method === 'DELETE')) {
    const email = bodyData?.email || queryParams?.email;
    if (!email) {
      return { status: 400, data: { error: 'Email parameter is required to delete a user.' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'smp23997@gmail.com' || normalizedEmail === 'sakekmasudparvez@gmail.com') {
      return { status: 403, data: { error: 'Root administrator account cannot be deleted.' } };
    }

    const res = await pool.query('DELETE FROM studio_users WHERE LOWER(email) = LOWER($1) RETURNING *;', [
      normalizedEmail,
    ]);

    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found in database.' } };
    }

    return {
      status: 200,
      data: {
        success: true,
        message: `Account for ${normalizedEmail} has been permanently deleted.`,
        deletedUser: res.rows[0],
      },
    };
  }

  // 11. Self Account Deletion: POST /api/auth/delete-account
  if (path === '/api/auth/delete-account' && method === 'POST') {
    const { email } = bodyData || {};
    if (!email) {
      return { status: 400, data: { error: 'Email is required to delete account.' } };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'smp23997@gmail.com' || normalizedEmail === 'sakekmasudparvez@gmail.com') {
      return { status: 403, data: { error: 'Root administrator account cannot be deleted.' } };
    }

    const res = await pool.query('DELETE FROM studio_users WHERE LOWER(email) = LOWER($1) RETURNING *;', [
      normalizedEmail,
    ]);

    return {
      status: 200,
      data: {
        success: true,
        message: 'Your account has been permanently removed.',
      },
    };
  }

  // 12. Platform Statistics: GET /api/stats
  if (path === '/api/stats' && method === 'GET') {
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM studio_users;');
    const approvedUsers = await pool.query(
      "SELECT COUNT(*) as count FROM studio_users WHERE status = 'APPROVED';"
    );
    const pendingUsers = await pool.query(
      "SELECT COUNT(*) as count FROM studio_users WHERE status = 'PENDING';"
    );
    const adminUsers = await pool.query(
      "SELECT COUNT(*) as count FROM studio_users WHERE role = 'ADMIN';"
    );

    return {
      status: 200,
      data: {
        totalUsers: parseInt(totalUsers.rows[0].count, 10),
        approvedUsers: parseInt(approvedUsers.rows[0].count, 10),
        pendingUsers: parseInt(pendingUsers.rows[0].count, 10),
        adminUsers: parseInt(adminUsers.rows[0].count, 10),
      },
    };
  }

  return { status: 404, data: { error: 'Endpoint not found' } };
}
