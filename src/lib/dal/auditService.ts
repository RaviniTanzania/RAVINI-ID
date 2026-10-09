import { AuditLog, User } from '../../types';
import { db } from './databaseAdapter';

export interface AuthoritativeAuditRecord {
  id: string;
  eventId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 
    | 'WALLET_CREDIT'
    | 'WALLET_DEBIT'
    | 'WALLET_TRANSFER'
    | 'REFUND_REQUESTED'
    | 'REFUND_PROCESSED_APPROVED'
    | 'REFUND_PROCESSED_REJECTED'
    | 'CAMPAIGN_CREATED'
    | 'CAMPAIGN_APPROVED'
    | 'CAMPAIGN_REJECTED'
    | 'CAMPAIGN_PAUSED'
    | 'CAMPAIGN_RESUMED'
    | 'CAMPAIGN_CANCELLED_REFUNDED'
    | 'PRICING_UPDATED'
    | 'COMMISSION_UPDATED'
    | 'VERIFICATION_APPROVED'
    | 'VERIFICATION_REJECTED'
    | 'ADMIN_PERMISSIONS_CHANGED'
    | 'USER_BLOCKED'
    | 'USER_UNBLOCKED'
    | 'SESSION_TERMINATED'
    | 'OFFICIAL_ANNOUNCEMENT_PUBLISHED';
  target: string;
  targetId?: string;
  details: string;
  beforeValue?: string | number | Record<string, any>;
  afterValue?: string | number | Record<string, any>;
  reason?: string;
  ipAddress?: string;
}

const AUDIT_COLLECTION = 'audit_logs';

export class AuditService {
  /**
   * Records an immutable, tamper-evident audit log entry.
   */
  static async record(entry: {
    actor: Pick<User, 'id' | 'name' | 'role'>;
    action: AuthoritativeAuditRecord['action'];
    target: string;
    targetId?: string;
    details: string;
    beforeValue?: any;
    afterValue?: any;
    reason?: string;
  }): Promise<AuthoritativeAuditRecord> {
    const timestamp = new Date().toISOString();
    const uniqueEventId = `EVT-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: AuthoritativeAuditRecord = {
      id,
      eventId: uniqueEventId,
      timestamp,
      actorId: entry.actor.id,
      actorName: entry.actor.name,
      actorRole: entry.actor.role,
      action: entry.action,
      target: entry.target,
      targetId: entry.targetId,
      details: entry.details,
      beforeValue: entry.beforeValue,
      afterValue: entry.afterValue,
      reason: entry.reason,
    };

    // Persist via DAL
    await db.set(AUDIT_COLLECTION, record.id, record);

    // Also mirror into legacy audit list for UI backward compatibility
    try {
      const legacyLog: AuditLog = {
        id: record.id,
        actorId: record.actorId,
        actorName: record.actorName,
        actorRole: record.actorRole,
        action: record.action,
        target: record.target,
        details: record.details,
        timestamp: record.timestamp,
      };
      const raw = localStorage.getItem('ravini_audit_logs_permanent_v3');
      const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
      logs.unshift(legacyLog);
      localStorage.setItem('ravini_audit_logs_permanent_v3', JSON.stringify(logs.slice(0, 1000)));
    } catch (e) {
      console.error('[AuditService] Failed to mirror legacy log:', e);
    }

    return record;
  }

  /**
   * Retrieves paginated audit logs for administration inspection.
   */
  static async getLogs(options?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
  }): Promise<{ logs: AuthoritativeAuditRecord[]; total: number }> {
    const all = await db.list<AuthoritativeAuditRecord>(AUDIT_COLLECTION);
    
    let filtered = all;
    if (options?.action) {
      filtered = filtered.filter(l => l.action === options.action);
    }
    if (options?.actorId) {
      filtered = filtered.filter(l => l.actorId === options.actorId);
    }

    // Sort descending by timestamp
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;

    return {
      logs: filtered.slice(offset, offset + limit),
      total: filtered.length
    };
  }
}
