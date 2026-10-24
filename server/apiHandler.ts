import { pool, ensureDbInitialized } from './db.ts';

export interface StudioUserRecord {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export async function handleApiRequest(
  urlPath: string,
  method: string,
  bodyData?: any,
  queryParams?: Record<string, string>
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

  // 1. Sync / Login User: POST /api/auth/sync
  if (path === '/api/auth/sync' && method === 'POST') {
    const { id, email, name, picture } = bodyData || {};
    if (!email) {
      return { status: 400, data: { error: 'Email is required' } };
    }

    const userId = id || `user_${Date.now()}`;
    const userName = name || email.split('@')[0];
    const isAdminEmail = email.toLowerCase() === 'sakekmasudparvez@gmail.com';

    // Insert or update user
    const query = `
      INSERT INTO studio_users (id, email, name, picture, role, status, last_login_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE 
      SET 
        name = COALESCE($3, studio_users.name),
        picture = COALESCE($4, studio_users.picture),
        role = CASE WHEN $5 = 'ADMIN' THEN 'ADMIN' ELSE studio_users.role END,
        status = CASE WHEN $6 = 'APPROVED' THEN 'APPROVED' ELSE studio_users.status END,
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const initialRole = isAdminEmail ? 'ADMIN' : 'USER';
    const initialStatus = isAdminEmail ? 'APPROVED' : 'PENDING';

    const res = await pool.query(query, [
      userId,
      email.toLowerCase(),
      userName,
      picture || null,
      initialRole,
      initialStatus,
    ]);

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

  // 2. Current User Status: GET /api/auth/me
  if (path === '/api/auth/me' && method === 'GET') {
    const email = queryParams?.email;
    if (!email) {
      return { status: 400, data: { error: 'Email is required' } };
    }

    const res = await pool.query('SELECT * FROM studio_users WHERE LOWER(email) = LOWER($1);', [
      email,
    ]);
    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found' } };
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

  // 3. Admin: List All Users: GET /api/admin/users
  if (path === '/api/admin/users' && method === 'GET') {
    const res = await pool.query('SELECT * FROM studio_users ORDER BY created_at DESC;');
    return {
      status: 200,
      data: {
        users: res.rows,
      },
    };
  }

  // 4. Admin: Update User Approval Status: POST /api/admin/users/status
  if (path === '/api/admin/users/status' && method === 'POST') {
    const { email, status } = bodyData || {};
    if (!email || !['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
      return { status: 400, data: { error: 'Valid email and status required' } };
    }

    const res = await pool.query(
      'UPDATE studio_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2) RETURNING *;',
      [status, email]
    );

    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found' } };
    }

    return {
      status: 200,
      data: {
        user: res.rows[0],
        message: `Status updated to ${status}`,
      },
    };
  }

  // 5. Admin: Update User Role: POST /api/admin/users/role
  if (path === '/api/admin/users/role' && method === 'POST') {
    const { email, role } = bodyData || {};
    if (!email || !['USER', 'ADMIN'].includes(role)) {
      return { status: 400, data: { error: 'Valid email and role required' } };
    }

    const res = await pool.query(
      'UPDATE studio_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2) RETURNING *;',
      [role, email]
    );

    if (res.rows.length === 0) {
      return { status: 404, data: { error: 'User not found' } };
    }

    return {
      status: 200,
      data: {
        user: res.rows[0],
        message: `Role updated to ${role}`,
      },
    };
  }

  // 6. Platform Statistics: GET /api/stats
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
