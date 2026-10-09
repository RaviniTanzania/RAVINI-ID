import { pool } from '../../src/db';
import bcrypt from 'bcryptjs';
import {
  NmyUser,
  NmyUserRole,
  NmySession,
  NmyTermsVersion,
  NmyService,
  NmyCreditLedgerEntry,
  NmyAdminWorkCreditLedgerEntry,
  NmySuperAdminWorkCreditLedgerEntry,
  NmyRequest,
  NmyCreditRequest,
  NmyNotification,
  NmyAnnouncement,
  NmyDepartment,
  NmyFile,
  NmyAuditLog,
  NmySettings,
  NmyAdvertisement
} from '../types/nmyTypes';
import { pushService } from '../services/pushService';

export function normalizePhone(input: string): string {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '255' + digits.substring(1);
  }
  if (digits.length === 9) {
    return '255' + digits;
  }
  return digits;
}

export class NmyDatabase {
  private static instance: NmyDatabase;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NmyDatabase {
    if (!NmyDatabase.instance) {
      NmyDatabase.instance = new NmyDatabase();
    }
    return NmyDatabase.instance;
  }

  // --- HARDENED STARTUP & HEALTH CHECK ---
  // ZERO SILENT RECREATION: If connection fails or tables are missing, FAIL SAFE!
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!process.env.SQL_HOST || !process.env.SQL_DB_NAME || !process.env.SQL_USER) {
      throw new Error('[DATA PROTECTION LOCK] Missing Cloud SQL environment variables (SQL_HOST, SQL_DB_NAME, SQL_USER). Refusing to start.');
    }

    try {
      const ping = await pool.query('SELECT current_database(), current_user, NOW() as current_time');
      console.log(`[NMY CLOUD SQL] Connected to PostgreSQL database: ${ping.rows[0].current_database} as ${ping.rows[0].current_user}`);

      // Verify all required tables exist
      const requiredTables = [
        'users', 'sessions', 'terms_versions', 'terms_acceptances', 'services',
        'credit_accounts', 'credit_ledger', 'admin_work_credit_accounts', 'admin_work_credit_ledger',
        'super_admin_work_credit_accounts', 'super_admin_work_credit_ledger', 'requests',
        'request_events', 'credit_requests', 'notifications', 'announcements',
        'departments', 'files', 'audit_logs', 'settings', 'advertisements'
      ];

      const tablesRes = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

      for (const t of requiredTables) {
        if (!existingTables.has(t)) {
          throw new Error(`[DATA INTEGRITY LOCK] Required production table '${t}' is missing in Cloud SQL. Refusing to run.`);
        }
      }

      // Verify Canonical Super Admin exists
      const superAdminRes = await pool.query(
        `SELECT id, phone, role, status FROM users WHERE phone = '255748604483'`
      );

      if (superAdminRes.rowCount === 0) {
        throw new Error('[DATA INTEGRITY LOCK] Canonical Super Admin (255748604483) does not exist in Cloud SQL PostgreSQL. Refusing silent seed.');
      }

      this.isInitialized = true;
      console.log('[NMY CLOUD SQL] Production Database Initialized and Verified: Cloud SQL PostgreSQL is AUTHORITATIVE SOURCE OF TRUTH.');
    } catch (err: any) {
      console.error('[NMY CLOUD SQL CRITICAL FAIL-SAFE]:', err.message);
      throw err;
    }
  }

  // --- USERS ---
  public async getUsers(): Promise<NmyUser[]> {
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              failed_login_attempts as "failedLoginAttempts",
              lock_level as "lockLevel",
              locked_until as "lockedUntil",
              lock_reason as "lockReason",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users ORDER BY created_at ASC`
    );
    return res.rows.map(r => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : undefined,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : undefined,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : undefined,
      lockedUntil: r.lockedUntil ? new Date(r.lockedUntil).toISOString() : undefined,
      deletionInitiatedBy: r.deletionInitiatedBy || undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }

  public async getUserById(id: string): Promise<NmyUser | null> {
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              failed_login_attempts as "failedLoginAttempts",
              lock_level as "lockLevel",
              locked_until as "lockedUntil",
              lock_reason as "lockReason",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : undefined,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : undefined,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : undefined,
      lockedUntil: r.lockedUntil ? new Date(r.lockedUntil).toISOString() : undefined,
      deletionInitiatedBy: r.deletionInitiatedBy || undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  public async getUserByPhone(phone: string): Promise<NmyUser | null> {
    const normalized = normalizePhone(phone);
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              failed_login_attempts as "failedLoginAttempts",
              lock_level as "lockLevel",
              locked_until as "lockedUntil",
              lock_reason as "lockReason",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE phone = $1`,
      [normalized]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : undefined,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : undefined,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : undefined,
      lockedUntil: r.lockedUntil ? new Date(r.lockedUntil).toISOString() : undefined,
      deletionInitiatedBy: r.deletionInitiatedBy || undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  public async createUser(user: NmyUser): Promise<NmyUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const normalized = normalizePhone(user.phone);
      const res = await client.query(
        `INSERT INTO users (id, phone, full_name, password, role, status, department_id, permissions, language, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, phone, full_name as "fullName", password, role, status, department_id as "departmentId", permissions, language, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          user.id,
          normalized,
          user.fullName,
          user.password,
          user.role,
          user.status,
          user.departmentId || null,
          JSON.stringify(user.permissions || []),
          user.language || 'sw',
          user.mustChangePassword || false,
          new Date(user.createdAt || Date.now()),
          new Date(user.updatedAt || Date.now())
        ]
      );

      // Create initial credit account
      if (user.role === 'CUSTOMER') {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        );
      } else if (user.role === 'ADMIN') {
        await client.query(
          `INSERT INTO admin_work_credit_accounts (admin_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (admin_id) DO NOTHING`,
          [user.id]
        );
      } else if (user.role === 'SUPER_ADMIN') {
        await client.query(
          `INSERT INTO super_admin_work_credit_accounts (super_admin_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (super_admin_id) DO NOTHING`,
          [user.id]
        );
      }

      await client.query('COMMIT');
      const r = res.rows[0];
      return {
        ...r,
        permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateUser(id: string, patch: Partial<NmyUser>): Promise<NmyUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (patch.fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(patch.fullName); }
    if (patch.password !== undefined) { fields.push(`password = $${idx++}`); values.push(patch.password); }
    if (patch.role !== undefined) { fields.push(`role = $${idx++}`); values.push(patch.role); }
    if (patch.status !== undefined) { fields.push(`status = $${idx++}`); values.push(patch.status); }
    if (patch.departmentId !== undefined) { fields.push(`department_id = $${idx++}`); values.push(patch.departmentId); }
    if (patch.permissions !== undefined) { fields.push(`permissions = $${idx++}`); values.push(JSON.stringify(patch.permissions)); }
    if (patch.language !== undefined) { fields.push(`language = $${idx++}`); values.push(patch.language); }
    if (patch.mustChangePassword !== undefined) { fields.push(`must_change_password = $${idx++}`); values.push(patch.mustChangePassword); }
    if (patch.lastLoginAt !== undefined) { fields.push(`last_login_at = $${idx++}`); values.push(patch.lastLoginAt ? new Date(patch.lastLoginAt) : null); }
    if (patch.markedForDeletionAt !== undefined) { fields.push(`marked_for_deletion_at = $${idx++}`); values.push(patch.markedForDeletionAt ? new Date(patch.markedForDeletionAt) : null); }
    if (patch.scheduledPermanentDeletionAt !== undefined) { fields.push(`scheduled_permanent_deletion_at = $${idx++}`); values.push(patch.scheduledPermanentDeletionAt ? new Date(patch.scheduledPermanentDeletionAt) : null); }
    if (patch.deletionInitiatedBy !== undefined) { fields.push(`deletion_initiated_by = $${idx++}`); values.push(patch.deletionInitiatedBy || null); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, phone, full_name as "fullName", password, role, status, department_id as "departmentId", permissions, language, must_change_password as "mustChangePassword", last_login_at as "lastLoginAt", marked_for_deletion_at as "markedForDeletionAt", scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt", deletion_initiated_by as "deletionInitiatedBy", created_at as "createdAt", updated_at as "updatedAt"`;

    const res = await pool.query(query, values);
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : undefined,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : undefined,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : undefined,
      deletionInitiatedBy: r.deletionInitiatedBy || undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  // --- SESSIONS & DEVICE LIMITS ---
  // Device limits: CUSTOMER max 1, ADMIN max 2, SUPER_ADMIN max 3
  public async createSession(session: NmySession): Promise<NmySession> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const maxDevices = session.role === 'CUSTOMER' ? 1 : session.role === 'ADMIN' ? 2 : 3;

      // Find active sessions
      const activeRes = await client.query(
        `SELECT id, token FROM sessions WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW() ORDER BY created_at ASC`,
        [session.userId]
      );

      // If active sessions count >= maxDevices, revoke oldest
      if (activeRes.rowCount !== null && activeRes.rowCount >= maxDevices) {
        const toRevokeCount = activeRes.rowCount - maxDevices + 1;
        const idsToRevoke = activeRes.rows.slice(0, toRevokeCount).map(r => r.id);
        await client.query(
          `UPDATE sessions SET is_revoked = true, revoke_reason = 'ANOTHER_DEVICE' WHERE id = ANY($1::text[])`,
          [idsToRevoke]
        );
      }

      const now = Date.now();
      const expiresAt = session.expiresAt ? new Date(session.expiresAt) : new Date(now + 30 * 24 * 60 * 60 * 1000);
      const createdAt = session.createdAt ? new Date(session.createdAt) : new Date(now);
      const sessionId = session.id || `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
      const token = session.token || `tok_${now}_${Math.random().toString(36).substring(2, 15)}`;

      const finalSession: NmySession = {
        ...session,
        id: sessionId,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        isRevoked: session.isRevoked || false
      };

      await client.query(
        `INSERT INTO sessions (id, token, user_id, role, device_name, ip, is_revoked, revoke_reason, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          sessionId,
          token,
          session.userId,
          session.role,
          session.deviceName,
          session.ip,
          session.isRevoked || false,
          session.revokeReason || null,
          expiresAt,
          createdAt
        ]
      );

      await client.query('COMMIT');
      return finalSession;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async getSessionByToken(token: string): Promise<NmySession | null> {
    const res = await pool.query(
      `SELECT id, token, user_id as "userId", role, device_name as "deviceName", ip,
              is_revoked as "isRevoked", revoke_reason as "revokeReason",
              expires_at as "expiresAt", created_at as "createdAt"
       FROM sessions WHERE token = $1`,
      [token]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      expiresAt: new Date(r.expiresAt).toISOString(),
      createdAt: new Date(r.createdAt).toISOString()
    };
  }

  public async revokeSession(token: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE sessions SET is_revoked = true WHERE token = $1`,
      [token]
    );
    return (res.rowCount || 0) > 0;
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    await pool.query(
      `UPDATE sessions SET is_revoked = true WHERE user_id = $1`,
      [userId]
    );
  }

  public async getActiveSessions(userId: string): Promise<NmySession[]> {
    const res = await pool.query(
      `SELECT id, token, user_id as "userId", role, device_name as "deviceName", ip,
              is_revoked as "isRevoked", revoke_reason as "revokeReason",
              expires_at as "expiresAt", created_at as "createdAt"
       FROM sessions WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map(r => ({
      ...r,
      expiresAt: new Date(r.expiresAt).toISOString(),
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  // --- TERMS ---
  public async getLatestTerms(): Promise<NmyTermsVersion> {
    const res = await pool.query(
      `SELECT version, content, updated_at as "updatedAt" FROM terms_versions ORDER BY updated_at DESC LIMIT 1`
    );
    if (res.rowCount === 0) {
      return {
        version: 'v1.0',
        content: 'Vigezo na Masharti ya Huduma ya RAVINI.',
        updatedAt: new Date().toISOString()
      };
    }
    const r = res.rows[0];
    return {
      version: r.version,
      content: r.content,
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  public async recordTermsAcceptance(userId: string, termsVersion: string): Promise<void> {
    await pool.query(
      `INSERT INTO terms_acceptances (user_id, terms_version, accepted_at)
       VALUES ($1, $2, NOW())`,
      [userId, termsVersion]
    );
  }

  // --- SERVICES ---
  public async getServices(): Promise<NmyService[]> {
    const res = await pool.query(
      `SELECT id, code, name, description, price_tzs as "priceTzs", is_active as "isActive",
              input_requirement as "inputRequirement", result_type as "resultType",
              department_id as "departmentId", updated_at as "updatedAt"
       FROM services ORDER BY id ASC`
    );
    return res.rows.map(r => ({
      ...r,
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }

  public async updateServicePrice(serviceId: string, newPriceTzs: number, actor: { id: string; name: string }): Promise<NmyService | null> {
    const res = await pool.query(
      `UPDATE services SET price_tzs = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, code, name, description, price_tzs as "priceTzs", is_active as "isActive",
                 input_requirement as "inputRequirement", result_type as "resultType",
                 department_id as "departmentId", updated_at as "updatedAt"`,
      [newPriceTzs, serviceId]
    );
    if (res.rowCount === 0) return null;

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'SERVICE_PRICE_UPDATED',
      target: `SERVICE:${serviceId}`,
      targetId: serviceId,
      details: `Super Admin changed price to TSh ${newPriceTzs.toLocaleString()}`
    });

    const r = res.rows[0];
    return {
      ...r,
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  // --- CUSTOMER CREDIT & TRANSACTION-SAFE LEDGER ---
  public async getCustomerCredit(userId: string): Promise<number> {
    const res = await pool.query(
      `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1`,
      [userId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }

  public async getCustomerLedger(userId: string): Promise<NmyCreditLedgerEntry[]> {
    const res = await pool.query(
      `SELECT id, user_id as "userId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM credit_ledger WHERE user_id = $1 ORDER BY timestamp DESC`,
      [userId]
    );
    return res.rows.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  public async getAllCreditLedger(): Promise<NmyCreditLedgerEntry[]> {
    const res = await pool.query(
      `SELECT id, user_id as "userId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM credit_ledger ORDER BY timestamp DESC LIMIT 100`
    );
    return res.rows.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  // Atomic, Row-Locked Credit ADD
  public async addCustomerCredit(params: {
    userId: string;
    amount: number;
    actorId: string;
    actorName: string;
    actorRole: NmyUserRole;
    reason: string;
    reference: string;
  }): Promise<{ balanceAfter: number; ledgerEntry: NmyCreditLedgerEntry }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );

      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.userId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }

      const balanceAfter = balanceBefore + params.amount;
      if (balanceAfter < 0) {
        throw new Error(`Salio la mteja haliwezi kuwa chini ya sifuri (Negative Balance Protection). Salio la sasa: TSh ${balanceBefore.toLocaleString()}, kiasi cha kupunguza: TSh ${Math.abs(params.amount).toLocaleString()}.`);
      }

      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );

      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const ledgerType = params.amount >= 0 ? 'ADD' : 'ADJUSTMENT';

      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          ledgerType,
          params.amount,
          balanceBefore,
          balanceAfter,
          null,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          params.reference,
          now
        ]
      );

      const entry: NmyCreditLedgerEntry = {
        id: ledgerId,
        userId: params.userId,
        type: ledgerType as any,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: params.reference,
        timestamp: now.toISOString()
      };

      await client.query('COMMIT');
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Atomic, Row-Locked Credit CHARGE (Prevents double spending & negative balance)
  public async chargeCustomerCredit(params: {
    userId: string;
    amount: number;
    requestId: string;
    actorId: string;
    actorName: string;
    actorRole: NmyUserRole;
    reason: string;
  }): Promise<{ balanceAfter: number; ledgerEntry: NmyCreditLedgerEntry }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );

      if (accRes.rowCount === 0) {
        throw new Error('Akaunti ya Credit haikupatikana.');
      }

      const balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      if (balanceBefore < params.amount) {
        throw new Error('SALIO LA CREDIT HALITOSHI. Tafadhali ongeza salio kwanza ili uweze kutuma ombi hili.');
      }

      const balanceAfter = balanceBefore - params.amount;
      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );

      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `CHARGE_${params.requestId}`;
      const now = new Date();

      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          'CHARGE',
          params.amount,
          balanceBefore,
          balanceAfter,
          params.requestId,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          ref,
          now
        ]
      );

      const entry: NmyCreditLedgerEntry = {
        id: ledgerId,
        userId: params.userId,
        type: 'CHARGE',
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: params.requestId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };

      await client.query('COMMIT');
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Atomic REFUND with Idempotency Protection
  public async refundCustomerCredit(params: {
    userId: string;
    amount: number;
    requestId: string;
    actorId: string;
    actorName: string;
    actorRole: NmyUserRole;
    reason: string;
  }): Promise<{ balanceAfter: number; ledgerEntry: NmyCreditLedgerEntry }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Idempotency check: don't double refund
      const existingRefund = await client.query(
        `SELECT id FROM credit_ledger WHERE request_id = $1 AND type = 'REFUND'`,
        [params.requestId]
      );

      if (existingRefund.rowCount !== null && existingRefund.rowCount > 0) {
        throw new Error('Ombi hili lilikwishafanyiwa refund tayari.');
      }

      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );

      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.userId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }

      const balanceAfter = balanceBefore + params.amount;
      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );

      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `REFUND_${params.requestId}`;
      const now = new Date();

      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          'REFUND',
          params.amount,
          balanceBefore,
          balanceAfter,
          params.requestId,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          ref,
          now
        ]
      );

      // Update request refund status
      await client.query(
        `UPDATE requests SET refund_status = 'REFUNDED', refunded_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [params.requestId]
      );

      const entry: NmyCreditLedgerEntry = {
        id: ledgerId,
        userId: params.userId,
        type: 'REFUND',
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: params.requestId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };

      await client.query('COMMIT');
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- WORK ACCOUNT (ADMIN & SUPER ADMIN) ---
  public async getAdminWorkCredit(workerId: string): Promise<number> {
    const res = await pool.query(
      `SELECT balance_tzs FROM admin_work_credit_accounts WHERE admin_id = $1`,
      [workerId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }

  public async getSuperAdminWorkCredit(superAdminId: string): Promise<number> {
    const res = await pool.query(
      `SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1`,
      [superAdminId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }

  public async getAdminWorkLedger(workerId: string): Promise<NmyAdminWorkCreditLedgerEntry[]> {
    const res = await pool.query(
      `SELECT id, admin_id as "adminId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM admin_work_credit_ledger WHERE admin_id = $1 ORDER BY timestamp DESC`,
      [workerId]
    );
    return res.rows.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  public async getSuperAdminWorkLedger(superAdminId: string): Promise<NmySuperAdminWorkCreditLedgerEntry[]> {
    const res = await pool.query(
      `SELECT id, super_admin_id as "superAdminId", amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM super_admin_work_credit_ledger WHERE super_admin_id = $1 ORDER BY timestamp DESC`,
      [superAdminId]
    );
    return res.rows.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  public async creditWorkerEarning(params: {
    workerId: string;
    workerRole: 'ADMIN' | 'SUPER_ADMIN';
    amount: number;
    requestId: string;
    actorId: string;
    actorName: string;
    reason: string;
  }): Promise<{ balanceAfter: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const isSuper = params.workerRole === 'SUPER_ADMIN';
      const table = isSuper ? 'super_admin_work_credit_accounts' : 'admin_work_credit_accounts';
      const colId = isSuper ? 'super_admin_id' : 'admin_id';
      const ledgerTable = isSuper ? 'super_admin_work_credit_ledger' : 'admin_work_credit_ledger';

      const accRes = await client.query(
        `SELECT balance_tzs FROM ${table} WHERE ${colId} = $1 FOR UPDATE`,
        [params.workerId]
      );

      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO ${table} (${colId}, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.workerId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }

      const balanceAfter = balanceBefore + params.amount;
      await client.query(
        `UPDATE ${table} SET balance_tzs = $1, updated_at = NOW() WHERE ${colId} = $2`,
        [balanceAfter, params.workerId]
      );

      const ledgerId = `w_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `WORK_PAYOUT_${params.requestId}`;

      if (isSuper) {
        await client.query(
          `INSERT INTO ${ledgerTable} (id, super_admin_id, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [ledgerId, params.workerId, params.amount, balanceBefore, balanceAfter, params.requestId, params.actorId, params.actorName, 'SUPER_ADMIN', params.reason, ref]
        );
      } else {
        await client.query(
          `INSERT INTO ${ledgerTable} (id, admin_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [ledgerId, params.workerId, 'WORK_EARNING', params.amount, balanceBefore, balanceAfter, params.requestId, params.actorId, params.actorName, 'ADMIN', params.reason, ref]
        );
      }

      await client.query('COMMIT');
      return { balanceAfter };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- ADMIN WORK ACCOUNT PAYOUT (PAY ACTION) ---
  public async payAdminWorkBalance(params: {
    adminId: string;
    amount: number;
    actorId: string;
    actorName: string;
    reason: string;
    reference?: string;
  }): Promise<{ balanceAfter: number; paidAmount: number; ledgerEntry: NmyAdminWorkCreditLedgerEntry }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (params.amount <= 0) {
        throw new Error('Kiasi cha malipo lazima kiwe zaidi ya 0.');
      }

      const accRes = await client.query(
        `SELECT balance_tzs FROM admin_work_credit_accounts WHERE admin_id = $1 FOR UPDATE`,
        [params.adminId]
      );

      if (accRes.rowCount === 0) {
        throw new Error('Akaunti ya kazi ya mtendaji haikupatikana.');
      }

      const balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      if (params.amount > balanceBefore) {
        throw new Error(`Kiasi cha malipo (TSh ${params.amount.toLocaleString()}) hakiwezi kuzidi salio lililopo la kazi (TSh ${balanceBefore.toLocaleString()}).`);
      }

      const balanceAfter = balanceBefore - params.amount;
      await client.query(
        `UPDATE admin_work_credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE admin_id = $2`,
        [balanceAfter, params.adminId]
      );

      const ledgerId = `w_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = params.reference || `PAYOUT_${Date.now()}`;
      const now = new Date();

      await client.query(
        `INSERT INTO admin_work_credit_ledger (id, admin_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.adminId,
          'WITHDRAWAL',
          params.amount,
          balanceBefore,
          balanceAfter,
          null,
          params.actorId,
          params.actorName,
          'SUPER_ADMIN',
          params.reason,
          ref,
          now
        ]
      );

      const entry: NmyAdminWorkCreditLedgerEntry = {
        id: ledgerId,
        workerId: params.adminId,
        adminId: params.adminId,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: '',
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: 'SUPER_ADMIN' as any,
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };

      await this.addAuditLog({
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: 'SUPER_ADMIN',
        action: 'ADMIN_WORK_PAYMENT_CONFIRMED',
        target: `ADMIN_WORK:${params.adminId}`,
        targetId: params.adminId,
        details: `Super Admin confirmed payment of TSh ${params.amount.toLocaleString()} to Admin ${params.adminId}. Remaining balance: TSh ${balanceAfter.toLocaleString()}. Ref: ${ref}.`
      });

      await client.query('COMMIT');
      return { balanceAfter, paidAmount: params.amount, ledgerEntry: entry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- SUPER ADMIN WORK ACCOUNT PAYOUT (PAY ACTION) ---
  public async paySuperAdminWorkBalance(params: {
    superAdminId: string;
    amount: number;
    actorId: string;
    actorName: string;
    reason: string;
    reference?: string;
  }): Promise<{ balanceAfter: number; paidAmount: number; ledgerEntry: NmySuperAdminWorkCreditLedgerEntry }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (params.amount <= 0) {
        throw new Error('Kiasi cha malipo lazima kiwe zaidi ya 0.');
      }

      const accRes = await client.query(
        `SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1 FOR UPDATE`,
        [params.superAdminId]
      );

      if (accRes.rowCount === 0) {
        throw new Error('Akaunti ya kazi ya Super Admin haikupatikana.');
      }

      const balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      if (params.amount > balanceBefore) {
        throw new Error(`Kiasi cha malipo (TSh ${params.amount.toLocaleString()}) hakiwezi kuzidi salio lililopo la kazi (TSh ${balanceBefore.toLocaleString()}).`);
      }

      const balanceAfter = balanceBefore - params.amount;
      await client.query(
        `UPDATE super_admin_work_credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE super_admin_id = $2`,
        [balanceAfter, params.superAdminId]
      );

      const ledgerId = `sw_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = params.reference || `SUPER_PAYOUT_${Date.now()}`;
      const now = new Date();

      await client.query(
        `INSERT INTO super_admin_work_credit_ledger (id, super_admin_id, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          ledgerId,
          params.superAdminId,
          -params.amount,
          balanceBefore,
          balanceAfter,
          null,
          params.actorId,
          params.actorName,
          'SUPER_ADMIN',
          params.reason,
          ref,
          now
        ]
      );

      const entry: NmySuperAdminWorkCreditLedgerEntry = {
        id: ledgerId,
        superAdminId: params.superAdminId,
        amount: -params.amount,
        balanceBefore,
        balanceAfter,
        requestId: '',
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: 'SUPER_ADMIN',
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };

      await this.addAuditLog({
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_WORK_PAYMENT_CONFIRMED',
        target: `SUPER_ADMIN_WORK:${params.superAdminId}`,
        targetId: params.superAdminId,
        details: `Super Admin confirmed payout of TSh ${params.amount.toLocaleString()} on his own work balance. Remaining balance: TSh ${balanceAfter.toLocaleString()}. Ref: ${ref}.`
      });

      await client.query('COMMIT');
      return { balanceAfter, paidAmount: params.amount, ledgerEntry: entry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- REQUESTS (APPLICATIONS) ---
  public async createRequest(request: NmyRequest): Promise<NmyRequest> {
    const res = await pool.query(
      `INSERT INTO requests (id, customer_id, customer_name, customer_phone, service_id, service_code, service_name, target_phone_number, charged_price_tzs, status, claimed_by_worker_id, claimed_by_worker_name, claimed_by_worker_role, claimed_at, completed_at, rejected_at, nida_result, rejection_reason, refund_status, refunded_at, is_deleted_by_customer, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        request.id,
        request.customerId,
        request.customerName,
        request.customerPhone,
        request.serviceId,
        request.serviceCode,
        request.serviceName,
        request.targetPhoneNumber,
        request.chargedPriceTzs,
        request.status,
        request.claimedByWorkerId || null,
        request.claimedByWorkerName || null,
        request.claimedByWorkerRole || null,
        request.claimedAt ? new Date(request.claimedAt) : null,
        request.completedAt ? new Date(request.completedAt) : null,
        request.rejectedAt ? new Date(request.rejectedAt) : null,
        request.nidaResult || null,
        request.rejectionReason || null,
        request.refundStatus || 'NONE',
        request.refundedAt ? new Date(request.refundedAt) : null,
        request.isDeletedByCustomer || false,
        new Date(request.createdAt || Date.now()),
        new Date(request.updatedAt || Date.now())
      ]
    );

    return this.mapRequestRow(res.rows[0]);
  }

  public async getRequests(options?: {
    customerId?: string;
    workerId?: string;
    status?: string;
    includeDeletedByCustomer?: boolean;
  }): Promise<NmyRequest[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (options?.customerId) {
      where.push(`customer_id = $${idx++}`);
      values.push(options.customerId);
    }
    if (options?.workerId) {
      where.push(`claimed_by_worker_id = $${idx++}`);
      values.push(options.workerId);
    }
    if (options?.status) {
      where.push(`status = $${idx++}`);
      values.push(options.status);
    }
    if (!options?.includeDeletedByCustomer) {
      where.push(`is_deleted_by_customer = false`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT * FROM requests ${whereClause} ORDER BY created_at DESC`,
      values
    );

    return res.rows.map(r => this.mapRequestRow(r));
  }

  public async getRequestById(id: string): Promise<NmyRequest | null> {
    const res = await pool.query(`SELECT * FROM requests WHERE id = $1`, [id]);
    if (res.rowCount === 0) return null;
    return this.mapRequestRow(res.rows[0]);
  }

  public async claimRequest(params: {
    requestId: string;
    workerId: string;
    workerName: string;
    workerRole: 'ADMIN' | 'SUPER_ADMIN';
  }): Promise<{ success: boolean; request?: NmyRequest; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );

      if (reqRes.rowCount === 0) {
        return { success: false, error: 'Ombi halikupatikana.' };
      }

      const current = reqRes.rows[0];
      if (current.status !== 'PENDING') {
        return { success: false, error: 'Ombi hili tayari limechukuliwa au kusindikwa na mtumiaji mwingine.' };
      }

      const now = new Date();
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'PROCESSING',
           claimed_by_worker_id = $1,
           claimed_by_worker_name = $2,
           claimed_by_worker_role = $3,
           claimed_at = $4,
           updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [params.workerId, params.workerName, params.workerRole, now, params.requestId]
      );

      await client.query('COMMIT');
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || 'Hitilafu ya kudai ombi.' };
    } finally {
      client.release();
    }
  }

  public async completeRequest(params: {
    requestId: string;
    nidaResult: string;
    workerId: string;
  }): Promise<{ success: boolean; request?: NmyRequest; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );

      if (reqRes.rowCount === 0) {
        return { success: false, error: 'Ombi halikupatikana.' };
      }

      const current = reqRes.rows[0];
      if (current.status !== 'PROCESSING') {
        return { success: false, error: 'Ombi haliko katika hali ya kufanyiwa kazi.' };
      }

      const now = new Date();
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'APPROVED',
           nida_result = $1,
           completed_at = $2,
           updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [params.nidaResult, now, params.requestId]
      );

      // Payout 100 TSh to worker account
      await this.creditWorkerEarning({
        workerId: current.claimed_by_worker_id,
        workerRole: current.claimed_by_worker_role as any,
        amount: current.charged_price_tzs || 100,
        requestId: params.requestId,
        actorId: params.workerId,
        actorName: current.claimed_by_worker_name,
        reason: `Malipo ya kukamilisha ombi la NIDA ${params.requestId}`
      });

      await client.query('COMMIT');
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || 'Hitilafu ya kukamilisha ombi.' };
    } finally {
      client.release();
    }
  }

  public async rejectRequest(params: {
    requestId: string;
    rejectionReason: string;
    workerId: string;
    workerName?: string;
    workerRole?: string;
  }): Promise<{ success: boolean; request?: NmyRequest; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );

      if (reqRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Ombi halikupatikana.' };
      }

      const current = reqRes.rows[0];

      // Eligible statuses: PENDING or PROCESSING according to workflow
      if (current.status !== 'PENDING' && current.status !== 'PROCESSING') {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `Ombi haliko katika hali inayoweza kukataliwa. Hali ya sasa ni: ${current.status}.`
        };
      }

      const refundAmount = Number(current.charged_price_tzs) || 100;
      const workerName = params.workerName || current.claimed_by_worker_name || 'Admin';
      const workerRole = params.workerRole || current.claimed_by_worker_role || 'ADMIN';
      const refundReason = `Marejesho (Refund): Ombi lilikataliwa kwa sababu - ${params.rejectionReason}`;

      // Idempotency check: don't double refund if already refunded
      const existingRefund = await client.query(
        `SELECT id FROM credit_ledger WHERE request_id = $1 AND type = 'REFUND'`,
        [params.requestId]
      );

      const alreadyRefunded = (existingRefund.rowCount !== null && existingRefund.rowCount > 0) || current.refund_status === 'REFUNDED';

      if (!alreadyRefunded && refundAmount > 0) {
        // Lock customer credit account
        const accRes = await client.query(
          `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
          [current.customer_id]
        );

        let balanceBefore = 0;
        if (accRes.rowCount === 0) {
          await client.query(
            `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
            [current.customer_id]
          );
        } else {
          balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
        }

        const balanceAfter = balanceBefore + refundAmount;
        await client.query(
          `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
          [balanceAfter, current.customer_id]
        );

        const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const ref = `REFUND_${params.requestId}`;
        const now = new Date();

        await client.query(
          `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            ledgerId,
            current.customer_id,
            'REFUND',
            refundAmount,
            balanceBefore,
            balanceAfter,
            params.requestId,
            params.workerId,
            workerName,
            workerRole,
            refundReason,
            ref,
            now
          ]
        );
      }

      // Update requests row atomically in the SAME transaction
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'REJECTED',
           rejection_reason = $1,
           rejected_at = NOW(),
           refund_status = 'REFUNDED',
           refunded_at = COALESCE(refunded_at, NOW()),
           updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [params.rejectionReason, params.requestId]
      );

      await client.query('COMMIT');
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[REJECT REQUEST ERROR]:', err);
      return { success: false, error: err.message || 'Hitilafu ya kukataa ombi.' };
    } finally {
      client.release();
    }
  }

  // SOFT DELETION for customer self-service safety
  public async deleteCustomerRequest(requestId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [requestId, customerId]
      );

      if (reqRes.rowCount === 0) {
        return { success: false, error: 'Ombi halikupatikana au huna idhini nalo.' };
      }

      const current = reqRes.rows[0];

      // If pending, refund customer first
      if (current.status === 'PENDING') {
        await this.refundCustomerCredit({
          userId: customerId,
          amount: current.charged_price_tzs,
          requestId: current.id,
          actorId: customerId,
          actorName: current.customer_name,
          actorRole: 'CUSTOMER',
          reason: 'Mteja amefuta ombi lililokuwa linasubiri (Cancellation refund).'
        });
      }

      // Soft delete: is_deleted_by_customer = true
      await client.query(
        `UPDATE requests SET
           is_deleted_by_customer = true,
           deleted_at = NOW(),
           deleted_by = $1,
           updated_at = NOW()
         WHERE id = $2`,
        [customerId, requestId]
      );

      await this.addAuditLog({
        actorId: customerId,
        actorName: current.customer_name,
        actorRole: 'CUSTOMER',
        action: 'CUSTOMER_REQUEST_SOFT_DELETED',
        target: `REQUEST:${requestId}`,
        targetId: requestId,
        details: `Customer soft-deleted request ${requestId}. Financial ledger and history safely preserved.`
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || 'Hitilafu ya kufuta ombi.' };
    } finally {
      client.release();
    }
  }

  // Soft deactivate customer
  public async deleteCustomerAccountManual(params: {
    customerId: string;
    actorId: string;
    actorName: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const user = await this.getUserById(params.customerId);
    if (!user) return { success: false, error: 'Mteja hakupatikana.' };
    if (user.role === 'SUPER_ADMIN' || user.phone === '255748604483') {
      return { success: false, error: 'Huwezi kufuta akaunti ya Super Admin.' };
    }

    await pool.query(
      `UPDATE users SET status = 'DISABLED', updated_at = NOW() WHERE id = $1`,
      [params.customerId]
    );

    await this.addAuditLog({
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: 'SUPER_ADMIN',
      action: 'CUSTOMER_ACCOUNT_DISABLED_MANUAL',
      target: `USER:${user.id}`,
      targetId: user.id,
      details: `Super Admin ${params.actorName} deactivated customer ${user.fullName} (${user.phone}). Reason: ${params.reason}. Financial records preserved.`
    });

    return { success: true };
  }

  public async checkAndExpireTimedOutRequests(): Promise<number> {
    try {
      const settings = await this.getSettings();
      const timeoutMinutes = Number(settings.requestTimeoutMinutes) || 15;

      const res = await pool.query(
        `SELECT id, customer_id as "customerId", customer_name as "customerName", charged_price_tzs as "chargedPriceTzs", target_phone_number as "targetPhoneNumber"
         FROM requests
         WHERE status = 'PENDING'
           AND created_at < NOW() - ($1 || ' minutes')::interval`,
        [timeoutMinutes]
      );

      let expiredCount = 0;
      for (const row of res.rows) {
        const requestId = row.id;
        const customerId = row.customerId;
        const amount = Number(row.chargedPriceTzs) || 0;

        await pool.query(
          `UPDATE requests
           SET status = 'EXPIRED',
               refund_status = 'COMPLETED',
               updated_at = NOW()
           WHERE id = $1 AND status = 'PENDING'`,
          [requestId]
        );

        if (amount > 0) {
          await this.refundCustomerCredit({
            userId: customerId,
            amount,
            requestId,
            actorId: 'system',
            actorName: 'Mfumo wa RAVINI (Timeout)',
            actorRole: 'SUPER_ADMIN' as any,
            reason: `Rejesho la moja kwa moja: Ombi ${requestId} limeisha muda (${timeoutMinutes} dakika).`
          }).catch(err => console.error('[EXPIRE REFUND ERROR]:', err));
        }

        await this.addAuditLog({
          actorId: 'system',
          actorName: 'Mfumo wa RAVINI (Timeout)',
          actorRole: 'SUPER_ADMIN',
          action: 'REQUEST_EXPIRED',
          target: `REQUEST:${requestId}`,
          targetId: requestId,
          details: `Ombi ${requestId} limepitisha muda wa dakika ${timeoutMinutes} bila kushughulikiwa. Hali imebadilika kuwa EXPIRED na TSh ${amount} zimerudishwa kwa mteja.`
        }).catch(() => {});

        // Send In-App & Outside Notification to customer
        await this.createNotification({
          userId: customerId,
          title: 'Ombi Limeisha Muda',
          message: `Ombi lako la namba ${row.targetPhoneNumber} limeisha muda wa kushughulikiwa (${timeoutMinutes} dakika). TSh ${amount} zimerudishwa kwenye salio lako. Bofya "Tuma Tena Ombi" ikiwa bado unahitaji huduma.`,
          type: 'WARNING',
          url: '/customer/requests'
        }).catch(() => {});

        pushService.sendNotificationToUser(customerId, {
          title: 'Ombi Limeisha Muda',
          message: `Ombi lako la ${row.targetPhoneNumber} limeisha muda. Salio lako limerejeshwa.`,
          url: '/customer/requests',
          type: 'WARNING'
        }).catch(() => {});

        expiredCount++;
      }

      return expiredCount;
    } catch (err: any) {
      console.error('[EXPIRE TIMEOUT ERROR]:', err);
      return 0;
    }
  }

  public async deleteUserWithSevenDayRestriction(
    userId: string,
    actor: { id: string; name: string }
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };
    if (user.role === 'SUPER_ADMIN' || user.phone === '255748604483') {
      return { success: false, message: 'Akaunti ya Super Admin haiwezi kufutwa.' };
    }

    const normPhone = normalizePhone(user.phone);

    // Save phone restriction for 7 days
    try {
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      let restrictions: Array<{ phone: string; deletedAt: string; expiresAt: string; actorName: string }> = [];
      if (restRes.rowCount && restRes.rowCount > 0) {
        restrictions = typeof restRes.rows[0].value === 'string'
          ? JSON.parse(restRes.rows[0].value)
          : restRes.rows[0].value;
      }

      const now = Date.now();
      restrictions = (Array.isArray(restrictions) ? restrictions : []).filter(
        r => new Date(r.expiresAt).getTime() > now && r.phone !== normPhone
      );

      restrictions.push({
        phone: normPhone,
        deletedAt: new Date().toISOString(),
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actorName: actor.name
      });

      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ('deleted_phone_restrictions', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(restrictions)]
      );
    } catch (e) {
      console.error('[RESTRICTION SAVE ERROR]:', e);
    }

    // Revoke all sessions
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);

    // Audit log
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'ACCOUNT_DELETED',
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alifuta akaunti ya ${user.fullName} (${user.phone}). Usajili mpya umezuiwa kwa siku 7.`
    });

    // Delete user (or soft-delete if foreign keys exist to preserve referential integrity)
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    } catch (delErr: any) {
      await pool.query(`UPDATE users SET status = 'DELETED', updated_at = NOW() WHERE id = $1`, [userId]);
    }

    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imefutwa kikamilifu. Namba hii imezuiwa kujisajili upya kwa siku 7.`
    };
  }

  public async markUserForDeletion(
    userId: string,
    actor: { id: string; name: string }
  ): Promise<{ success: boolean; message: string; user?: NmyUser }> {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };
    if (user.role === 'SUPER_ADMIN') {
      return { success: false, message: 'Huwezi kufuta akaunti ya Super Admin.' };
    }

    const now = new Date();
    const scheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Invalidate active sessions immediately
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);

    await pool.query(
      `UPDATE users
       SET status = 'MARKED_FOR_DELETION',
           marked_for_deletion_at = $1,
           scheduled_permanent_deletion_at = $2,
           deletion_initiated_by = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [now, scheduled, actor.name, userId]
    );

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'ACCOUNT_MARKED_FOR_DELETION',
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alianzisha ufutaji wa akaunti ya ${user.fullName} (${user.phone}). Akaunti imeingia kwenye Grace Period ya siku 7 (hadi ${scheduled.toISOString()}). Sessions zimefungwa.`
    });

    const updatedUser = await this.getUserById(userId);
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imewekwa MARKED_FOR_DELETION na kuingia kwenye Grace Period ya siku 7. Mtumiaji hawezi kuingia. Unaweza kuirejesha (Restore) wakati wowote kabla ya siku 7.`,
      user: updatedUser || undefined
    };
  }

  public async restoreUserFromDeletion(
    userId: string,
    actor: { id: string; name: string }
  ): Promise<{ success: boolean; message: string; user?: NmyUser }> {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };
    if (user.status !== 'MARKED_FOR_DELETION') {
      return { success: false, message: 'Akaunti hii haipo kwenye hatua ya MARKED_FOR_DELETION.' };
    }

    await pool.query(
      `UPDATE users
       SET status = 'ACTIVE',
           marked_for_deletion_at = NULL,
           scheduled_permanent_deletion_at = NULL,
           deletion_initiated_by = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'ACCOUNT_RESTORED',
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alirejesha akaunti ya ${user.fullName} (${user.phone}) kuwa ACTIVE.`
    });

    const updatedUser = await this.getUserById(userId);
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imerejeshwa kikamilifu kuwa ACTIVE. Mtumiaji anaweza kuingia sasa na kuendelea kutumia mfumo.`,
      user: updatedUser || undefined
    };
  }

  public async permanentlyDeleteUser(
    userId: string,
    actor: { id: string; name: string },
    force: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };
    if (user.role === 'SUPER_ADMIN') {
      return { success: false, message: 'Huwezi kufuta akaunti ya Super Admin.' };
    }

    if (!force && user.status !== 'MARKED_FOR_DELETION') {
      return { success: false, message: 'Akaunti lazima iwe MARKED_FOR_DELETION kwanza kabla ya kufutwa kabisa.' };
    }

    // Invalidate sessions
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);

    // Record restriction for 7 days
    try {
      const normPhone = normalizePhone(user.phone);
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      let restrictions: Array<{ phone: string; deletedAt: string; expiresAt: string; actorName: string }> = [];
      if (restRes.rowCount && restRes.rowCount > 0) {
        restrictions = typeof restRes.rows[0].value === 'string'
          ? JSON.parse(restRes.rows[0].value)
          : restRes.rows[0].value;
      }
      restrictions = restrictions.filter(
        r => r.phone !== normPhone && new Date(r.expiresAt).getTime() > Date.now()
      );
      restrictions.push({
        phone: normPhone,
        deletedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actorName: actor.name
      });
      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ('deleted_phone_restrictions', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(restrictions)]
      );
    } catch (e) {
      console.error('[RESTRICTION SAVE ERROR]:', e);
    }

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'ACCOUNT_DELETED_PERMANENTLY',
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alifuta kabisa akaunti ya ${user.fullName} (${user.phone}). Ufutaji wa kudumu umekamilika.`
    });

    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    } catch (delErr: any) {
      await pool.query(`UPDATE users SET status = 'DELETED', updated_at = NOW() WHERE id = $1`, [userId]);
    }

    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imefutwa kabisa (PERMANENT DELETION).`
    };
  }

  public async purgeExpiredMarkedForDeletionUsers(): Promise<number> {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", phone
         FROM users
         WHERE status = 'MARKED_FOR_DELETION'
           AND scheduled_permanent_deletion_at IS NOT NULL
           AND scheduled_permanent_deletion_at <= NOW()`
      );
      if (!res.rowCount || res.rowCount === 0) return 0;

      let count = 0;
      for (const row of res.rows) {
        await this.permanentlyDeleteUser(row.id, { id: 'system_auto_purge', name: 'Mfumo wa Kisheria (Grace Period Expired)' }, true);
        count++;
      }
      return count;
    } catch (e) {
      console.error('[PURGE EXPIRED ERROR]:', e);
      return 0;
    }
  }

  public async isPhoneRestrictedByDeletion(phone: string): Promise<{ restricted: boolean; expiresAt?: string }> {
    const norm = normalizePhone(phone);
    try {
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      if (restRes.rowCount && restRes.rowCount > 0) {
        const restrictions: Array<{ phone: string; expiresAt: string }> = typeof restRes.rows[0].value === 'string'
          ? JSON.parse(restRes.rows[0].value)
          : restRes.rows[0].value;

        if (Array.isArray(restrictions)) {
          const match = restrictions.find(r => r.phone === norm && new Date(r.expiresAt).getTime() > Date.now());
          if (match) {
            return { restricted: true, expiresAt: match.expiresAt };
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return { restricted: false };
  }

  public async updateAdminCreditPermission(
    adminId: string,
    canAddCredit: boolean,
    actor: { id: string; name: string }
  ): Promise<{ success: boolean; user?: NmyUser; error?: string }> {
    const user = await this.getUserById(adminId);
    if (!user) return { success: false, error: 'Admin hakupatikana.' };
    if (user.role !== 'ADMIN') return { success: false, error: 'Mtumiaji huyu si Admin.' };

    let permissions = Array.isArray(user.permissions) ? [...user.permissions] : [];
    if (canAddCredit) {
      if (!permissions.includes('CAN_ADD_CREDIT')) {
        permissions.push('CAN_ADD_CREDIT');
      }
    } else {
      permissions = permissions.filter(p => p !== 'CAN_ADD_CREDIT');
    }

    const updated = await this.updateUser(adminId, { permissions });

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: canAddCredit ? 'ADMIN_CREDIT_PERMISSION_GRANTED' : 'ADMIN_CREDIT_PERMISSION_REVOKED',
      target: `ADMIN:${adminId}`,
      targetId: adminId,
      details: `Super Admin ${actor.name} ${canAddCredit ? 'alitoa' : 'aliondoa'} ruhusa ya kuongeza Credit kwa Admin ${user.fullName} (${user.phone}).`
    });

    return { success: true, user: updated || undefined };
  }

  public async cleanupHistoryManual(params: {
    olderThanDays: number;
    category: 'NOTIFICATIONS' | 'AUDIT_LOGS' | 'SESSIONS';
    actorId: string;
    actorName: string;
  }): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    const cutoff = new Date(Date.now() - params.olderThanDays * 24 * 60 * 60 * 1000);
    let count = 0;

    if (params.category === 'NOTIFICATIONS') {
      const res = await pool.query(
        `DELETE FROM notifications WHERE created_at < $1`,
        [cutoff]
      );
      count = res.rowCount || 0;
    } else if (params.category === 'SESSIONS') {
      const res = await pool.query(
        `DELETE FROM sessions WHERE created_at < $1 AND is_revoked = true`,
        [cutoff]
      );
      count = res.rowCount || 0;
    } else {
      return { success: false, affectedCount: 0, error: 'Aina hii ya data hairuhusiwi kufutwa.' };
    }

    await this.addAuditLog({
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: 'SUPER_ADMIN',
      action: 'MANUAL_HISTORY_CLEANUP',
      target: params.category,
      details: `Super Admin cleaned ${count} records older than ${params.olderThanDays} days from ${params.category}.`
    });

    return { success: true, affectedCount: count };
  }

  // --- CREDIT REQUESTS (PAYMENTS) ---
  public async createCreditRequest(creditReq: NmyCreditRequest): Promise<NmyCreditRequest> {
    await pool.query(
      `INSERT INTO credit_requests (id, customer_id, customer_name, customer_phone, amount_tzs, payment_method, payment_reference, proof_image_url, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        creditReq.id,
        creditReq.customerId,
        creditReq.customerName,
        creditReq.customerPhone,
        creditReq.amountTzs,
        creditReq.paymentMethod,
        creditReq.paymentReference,
        creditReq.proofImageUrl || null,
        creditReq.status || 'PENDING_VERIFICATION',
        new Date(creditReq.createdAt || Date.now())
      ]
    );
    return creditReq;
  }

  public async getCreditRequests(): Promise<NmyCreditRequest[]> {
    const res = await pool.query(
      `SELECT id, customer_id as "customerId", customer_name as "customerName",
              customer_phone as "customerPhone", amount_tzs as "amountTzs",
              payment_method as "paymentMethod", payment_reference as "paymentReference",
              proof_image_url as "proofImageUrl", status, reviewed_by as "reviewedBy",
              rejection_reason as "rejectionReason", reviewed_at as "reviewedAt", created_at as "createdAt"
       FROM credit_requests ORDER BY created_at DESC`
    );
    return res.rows.map(r => ({
      ...r,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  public async reviewCreditRequest(params: {
    id: string;
    action: 'APPROVE' | 'REJECT';
    reviewedBy: string;
    rejectionReason?: string;
  }): Promise<{ success: boolean; creditRequest?: NmyCreditRequest; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        `SELECT * FROM credit_requests WHERE id = $1 FOR UPDATE`,
        [params.id]
      );

      if (reqRes.rowCount === 0) {
        return { success: false, error: 'Ombi la Credit halikupatikana.' };
      }

      const current = reqRes.rows[0];
      if (current.status !== 'PENDING_VERIFICATION') {
        return { success: false, error: 'Ombi hili lilikwishakaguliwa tayari.' };
      }

      const now = new Date();
      if (params.action === 'APPROVE') {
        await client.query(
          `UPDATE credit_requests SET status = 'APPROVED', reviewed_by = $1, reviewed_at = $2 WHERE id = $3`,
          [params.reviewedBy, now, params.id]
        );

        // Atomically add credit
        await this.addCustomerCredit({
          userId: current.customer_id,
          amount: current.amount_tzs,
          actorId: params.reviewedBy,
          actorName: 'Super Admin',
          actorRole: 'SUPER_ADMIN',
          reason: `Idhini ya malipo ya Credit (Ref: ${current.payment_reference})`,
          reference: current.payment_reference
        });
      } else {
        await client.query(
          `UPDATE credit_requests SET status = 'REJECTED', reviewed_by = $1, rejection_reason = $2, reviewed_at = $3 WHERE id = $4`,
          [params.reviewedBy, params.rejectionReason || 'Malipo yamekataliwa.', now, params.id]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || 'Hitilafu ya kukagua malipo.' };
    } finally {
      client.release();
    }
  }

  // --- DEPARTMENTS ---
  public async getDepartments(): Promise<NmyDepartment[]> {
    const res = await pool.query(`SELECT id, name, code, description, permissions, created_at as "createdAt" FROM departments`);
    return res.rows.map(r => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'),
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  // --- NOTIFICATIONS ---
  public async getNotifications(userId: string): Promise<NmyNotification[]> {
    const res = await pool.query(
      `SELECT id, user_id as "userId", title, message, type, is_read as "isRead", created_at as "createdAt"
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
  }

  public async createNotification(notif: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    url?: string;
  }): Promise<NmyNotification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [id, notif.userId, notif.title, notif.message, notif.type || 'INFO', now]
    );

    // Dispatch real mobile push notification immediately to device
    pushService.sendNotificationToUser(notif.userId, {
      title: notif.title,
      message: notif.message,
      type: notif.type,
      url: notif.url || '/'
    }).catch((err: any) => console.warn('[PUSH DISPATCH WARNING]:', err.message));

    return {
      id,
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: (notif.type as any) || 'REQUEST',
      read: false,
      createdAt: now.toISOString()
    };
  }

  // --- ANNOUNCEMENTS (TEXT ONLY) ---
  public async getAnnouncements(onlyActive = false): Promise<NmyAnnouncement[]> {
    let sql = `SELECT id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"
               FROM announcements`;
    if (onlyActive) {
      sql += ` WHERE is_active = true`;
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const res = await pool.query(sql);
    return res.rows.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  public async getActiveAnnouncementsForRole(role?: string): Promise<NmyAnnouncement[]> {
    let sql = `SELECT id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"
               FROM announcements
               WHERE is_active = true`;

    const params: any[] = [];
    if (role === 'CUSTOMER') {
      sql += ` AND (target_type = 'ALL' OR target_type = 'ALL_CUSTOMERS')`;
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      sql += ` AND (target_type = 'ALL' OR target_type = 'ALL_ADMINS')`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 10`;
    const res = await pool.query(sql, params);
    return res.rows.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  public async createAnnouncement(announcement: NmyAnnouncement): Promise<NmyAnnouncement> {
    const isActive = announcement.isActive !== false;
    await pool.query(
      `INSERT INTO announcements (id, title, message, target_type, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        announcement.id,
        announcement.title.trim(),
        announcement.message.trim(),
        announcement.targetType || 'ALL',
        isActive,
        new Date(announcement.createdAt || Date.now())
      ]
    );

    // Only send push notification if announcement is active
    if (isActive) {
      const payload = {
        title: `Tangazo: ${announcement.title.trim()}`,
        message: announcement.message.trim(),
        type: 'ANNOUNCEMENT',
        url: '/',
        eventKey: `ann_push_${announcement.id}`
      };

      if (announcement.targetType === 'ALL') {
        pushService.broadcastNotification(payload).catch((err: any) =>
          console.warn('[PUSH ANNOUNCEMENT WARNING]:', err.message)
        );
      } else if (announcement.targetType === 'ALL_CUSTOMERS') {
        pushService.sendNotificationToRole('CUSTOMER', payload).catch((err: any) =>
          console.warn('[PUSH ANNOUNCEMENT WARNING]:', err.message)
        );
      } else if (announcement.targetType === 'ALL_ADMINS') {
        pushService.sendNotificationToRole('ADMIN', payload).catch((err: any) =>
          console.warn('[PUSH ANNOUNCEMENT WARNING]:', err.message)
        );
        pushService.sendNotificationToRole('SUPER_ADMIN', payload).catch((err: any) =>
          console.warn('[PUSH ANNOUNCEMENT WARNING]:', err.message)
        );
      } else if (announcement.targetUserId) {
        pushService.sendNotificationToUser(announcement.targetUserId, payload).catch((err: any) =>
          console.warn('[PUSH ANNOUNCEMENT WARNING]:', err.message)
        );
      }
    }

    return announcement;
  }

  public async updateAnnouncement(
    id: string,
    patch: { title?: string; message?: string; targetType?: string; isActive?: boolean }
  ): Promise<NmyAnnouncement | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (patch.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(patch.title.trim());
    }
    if (patch.message !== undefined) {
      updates.push(`message = $${idx++}`);
      values.push(patch.message.trim());
    }
    if (patch.targetType !== undefined) {
      updates.push(`target_type = $${idx++}`);
      values.push(patch.targetType);
    }
    if (patch.isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(patch.isActive);
    }

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE announcements SET ${updates.join(', ')} WHERE id = $${idx}
                 RETURNING id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"`;

    const res = await pool.query(sql, values);
    if (res.rowCount === 0) return null;

    const row = res.rows[0];
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString()
    };
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM announcements WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- ADVERTISEMENTS (MATANGAZO YA VIDEO, PICHA NA MAANDISHI) ---
  public async getAdvertisements(onlyActive = false): Promise<NmyAdvertisement[]> {
    let query = `SELECT id, type, title, description, media_url as "mediaUrl",
                        cover_url as "coverUrl", start_date as "startDate", end_date as "endDate",
                        is_active as "isActive", created_by_id as "createdById",
                        created_by_name as "createdByName", created_at as "createdAt",
                        updated_at as "updatedAt"
                 FROM advertisements`;
    if (onlyActive) {
      query += ` WHERE is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())`;
    }
    query += ` ORDER BY created_at DESC`;
    const res = await pool.query(query);
    return res.rows.map(r => ({
      ...r,
      startDate: r.startDate ? new Date(r.startDate).toISOString() : undefined,
      endDate: r.endDate ? new Date(r.endDate).toISOString() : undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }

  public async getAdvertisementById(id: string): Promise<NmyAdvertisement | null> {
    const res = await pool.query(
      `SELECT id, type, title, description, media_url as "mediaUrl",
              cover_url as "coverUrl", start_date as "startDate", end_date as "endDate",
              is_active as "isActive", created_by_id as "createdById",
              created_by_name as "createdByName", created_at as "createdAt",
              updated_at as "updatedAt"
       FROM advertisements WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      startDate: r.startDate ? new Date(r.startDate).toISOString() : undefined,
      endDate: r.endDate ? new Date(r.endDate).toISOString() : undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }

  public async createAdvertisement(ad: Omit<NmyAdvertisement, 'createdAt' | 'updatedAt'>): Promise<NmyAdvertisement> {
    const now = new Date();
    await pool.query(
      `INSERT INTO advertisements (id, type, title, description, media_url, cover_url, start_date, end_date, is_active, created_by_id, created_by_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
      [
        ad.id,
        ad.type,
        ad.title,
        ad.description,
        ad.mediaUrl || null,
        ad.coverUrl || null,
        ad.startDate ? new Date(ad.startDate) : null,
        ad.endDate ? new Date(ad.endDate) : null,
        ad.isActive !== false,
        ad.createdById,
        ad.createdByName,
        now
      ]
    );
    return {
      ...ad,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  public async updateAdvertisement(id: string, patch: Partial<NmyAdvertisement>): Promise<NmyAdvertisement | null> {
    const current = await this.getAdvertisementById(id);
    if (!current) return null;

    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await pool.query(
      `UPDATE advertisements SET
         type = $1, title = $2, description = $3, media_url = $4, cover_url = $5,
         start_date = $6, end_date = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        updated.type,
        updated.title,
        updated.description,
        updated.mediaUrl || null,
        updated.coverUrl || null,
        updated.startDate ? new Date(updated.startDate) : null,
        updated.endDate ? new Date(updated.endDate) : null,
        updated.isActive,
        id
      ]
    );
    return updated;
  }

  public async deleteAdvertisement(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM advertisements WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- FILES (METADATA IN POSTGRESQL) ---
  public async getFiles(options?: { ownerId?: string; role?: NmyUserRole; departmentId?: string }): Promise<NmyFile[]> {
    let query = `SELECT id, user_id as "userId", file_name as "fileName", file_url as "fileUrl",
                        file_type as "fileType", size_bytes as "sizeBytes", checksum,
                        storage_bucket as "storageBucket", is_private as "isPrivate",
                        created_at as "createdAt" FROM files`;
    const values: any[] = [];
    if (options?.ownerId && options.role !== 'SUPER_ADMIN') {
      query += ` WHERE user_id = $1`;
      values.push(options.ownerId);
    }
    query += ` ORDER BY created_at DESC`;

    const res = await pool.query(query, values);
    return res.rows.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }

  public async createFile(file: NmyFile): Promise<NmyFile> {
    await pool.query(
      `INSERT INTO files (id, user_id, file_name, file_url, file_type, size_bytes, checksum, storage_bucket, is_private, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        file.id,
        file.userId,
        file.fileName,
        file.fileUrl,
        file.fileType,
        file.sizeBytes,
        file.checksum || null,
        file.storageBucket || 'cloud_storage_nmy',
        file.isPrivate !== false,
        new Date(file.createdAt || Date.now())
      ]
    );
    return file;
  }

  // --- AUDIT LOGS ---
  public async addAuditLog(log: Omit<NmyAuditLog, 'id' | 'timestamp'>): Promise<NmyAuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target, target_id, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        log.actorId,
        log.actorName,
        log.actorRole,
        log.action,
        log.target,
        log.targetId || null,
        log.details,
        now
      ]
    );
    return {
      ...log,
      id,
      timestamp: now.toISOString()
    };
  }

  public async getAuditLogs(limit = 100): Promise<NmyAuditLog[]> {
    const res = await pool.query(
      `SELECT id, actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              action, target, target_id as "targetId", details, timestamp
       FROM audit_logs ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    return res.rows.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<NmySettings> {
    const res = await pool.query(`SELECT value FROM settings WHERE key = 'app_settings'`);
    if (res.rowCount === 0) {
      return {
        platformName: 'RAVINI',
        companyName: 'RAVINI',
        supportPhone: '255748604483',
        whatsappNumber: '255748604483',
        servicePriceTzs: 100,
        appAccessOpen: true,
        publicRegistrationOpen: true,
        requestTimeoutMinutes: 15,
        paymentInstructions: 'Lipa kiasi unachotaka cha Credit kupitia namba zetu za malipo hapa chini.',
        paymentMethods: []
      };
    }
    const s = res.rows[0].value as NmySettings;
    return {
      ...s,
      platformName: 'RAVINI',
      companyName: 'RAVINI'
    };
  }

  public async updateSettings(patch: Partial<NmySettings>, actor: { id: string; name: string }): Promise<NmySettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...patch };

    await pool.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('app_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [JSON.stringify(updated)]
    );

    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'SUPER_ADMIN',
      action: 'SETTINGS_UPDATED',
      target: 'SYSTEM_SETTINGS',
      details: `Super Admin updated system settings: ${JSON.stringify(patch)}`
    });

    return updated;
  }

  private mapRequestRow(r: any): NmyRequest {
    return {
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      serviceId: r.service_id,
      serviceCode: r.service_code,
      serviceName: r.service_name,
      targetPhoneNumber: r.target_phone_number,
      chargedPriceTzs: Number(r.charged_price_tzs),
      status: r.status,
      claimedByWorkerId: r.claimed_by_worker_id || undefined,
      claimedByWorkerName: r.claimed_by_worker_name || undefined,
      claimedByWorkerRole: r.claimed_by_worker_role || undefined,
      claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : undefined,
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
      rejectedAt: r.rejected_at ? new Date(r.rejected_at).toISOString() : undefined,
      nidaResult: r.nida_result || undefined,
      rejectionReason: r.rejection_reason || undefined,
      refundStatus: r.refund_status || 'NONE',
      refundedAt: r.refunded_at ? new Date(r.refunded_at).toISOString() : undefined,
      isDeletedByCustomer: r.is_deleted_by_customer || false,
      deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
      deletedBy: r.deleted_by || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString()
    };
  }

  public async resetSuperAdminWorkBalance(
    superAdminId: string,
    actor: { id: string; name: string },
    reason: string = 'Kuweka salio la kazi kuwa 0 na Super Admin'
  ): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const accRes = await client.query(
        `SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1 FOR UPDATE`,
        [superAdminId]
      );
      let balanceBefore = 0;
      if (accRes.rowCount && accRes.rowCount > 0) {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }
      await client.query(
        `INSERT INTO super_admin_work_credit_accounts (super_admin_id, balance_tzs, updated_at)
         VALUES ($1, 0, NOW())
         ON CONFLICT (super_admin_id) DO UPDATE SET balance_tzs = 0, updated_at = NOW()`,
        [superAdminId]
      );
      if (balanceBefore !== 0) {
        await client.query(
          `INSERT INTO super_admin_work_credit_ledger
           (super_admin_id, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, 0, NULL, $4, $5, 'SUPER_ADMIN', $6, $7, NOW())`,
          [
            superAdminId,
            -balanceBefore,
            balanceBefore,
            actor.id,
            actor.name,
            reason,
            `RESET_WORK_BAL_${Date.now()}`
          ]
        );
      }
      await client.query('COMMIT');
      await this.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: 'SUPER_ADMIN',
        action: 'WORK_BALANCE_RESET',
        target: `SUPER_ADMIN_WORK_ACC:${superAdminId}`,
        targetId: superAdminId,
        details: `Super Admin ${actor.name} aliweka salio la kazi kuwa 0 (Kutoka TSh ${balanceBefore.toLocaleString()} hadi TSh 0). Sababu: ${reason}.`
      });
      return { success: true, balanceBefore, balanceAfter: 0 };
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  public async deleteFile(
    fileId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<{ success: boolean; message: string }> {
    const fileRes = await pool.query(`SELECT * FROM files WHERE id = $1`, [fileId]);
    if (fileRes.rowCount === 0) return { success: false, message: 'Faili halikupatikana.' };
    const file = fileRes.rows[0];
    if (actor.role !== 'SUPER_ADMIN' && file.user_id !== actor.id) {
      return { success: false, message: 'Huna mamlaka ya kufuta faili hili.' };
    }
    await pool.query(`DELETE FROM files WHERE id = $1`, [fileId]);
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'FILE_DELETED',
      target: `FILE:${fileId}`,
      targetId: fileId,
      details: `${actor.role} ${actor.name} alifuta faili "${file.file_name}" (${file.size_bytes} bytes).`
    });
    return { success: true, message: `Faili "${file.file_name}" limefutwa kikamilifu.` };
  }

  public async getRawSnapshot(): Promise<any> {
    const users = await this.getUsers();
    const requests = await this.getRequests();
    const creditRequests = await this.getCreditRequests();
    const ledger = await this.getAllCreditLedger();
    const auditLogs = await this.getAuditLogs(1000);
    const services = await this.getServices();
    const settings = await this.getSettings();

    const creditAccounts: Record<string, { balanceTzs: number; updatedAt: string }> = {};
    const accRows = await pool.query('SELECT user_id, balance_tzs, updated_at FROM credit_accounts');
    for (const r of accRows.rows) {
      creditAccounts[r.user_id] = {
        balanceTzs: Number(r.balance_tzs),
        updatedAt: new Date(r.updated_at).toISOString()
      };
    }

    return {
      users,
      requests,
      creditRequests,
      creditAccounts,
      creditLedger: ledger,
      auditLogs,
      services,
      settings
    };
  }
}

export const getNmyDb = () => NmyDatabase.getInstance();
