import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NmyBackupRecord, NmyIntegrityReport } from '../types/nmyTypes';

export class NmyBackupService {
  private static instance: NmyBackupService;
  private backupDir: string;
  private registryFile: string;
  private dbFilePath: string;

  private constructor() {
    this.backupDir = path.join(process.cwd(), 'data', 'backups');
    this.registryFile = path.join(this.backupDir, 'nmy_backup_registry.json');
    this.dbFilePath = path.join(process.cwd(), 'data', 'nida_mitandao_yote_db.json');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    if (!fs.existsSync(this.registryFile)) {
      fs.writeFileSync(this.registryFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static getInstance(): NmyBackupService {
    if (!NmyBackupService.instance) {
      NmyBackupService.instance = new NmyBackupService();
    }
    return NmyBackupService.instance;
  }

  private getRegistry(): NmyBackupRecord[] {
    try {
      if (!fs.existsSync(this.registryFile)) return [];
      const raw = fs.readFileSync(this.registryFile, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveRegistry(records: NmyBackupRecord[]): void {
    const tmp = `${this.registryFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf-8');
    fs.renameSync(tmp, this.registryFile);
  }

  // CREATE → VERIFY → STORE → RECORD
  public async createVerifiedBackup(reason = 'AUTOMATIC_SNAPSHOT'): Promise<{
    success: boolean;
    record?: NmyBackupRecord;
    error?: string;
  }> {
    try {
      if (!fs.existsSync(this.dbFilePath)) {
        return { success: false, error: 'Database halisi haikupatikana kwa ajili ya backup.' };
      }

      const rawDb = fs.readFileSync(this.dbFilePath, 'utf-8');
      const parsedDb = JSON.parse(rawDb);

      const timestamp = new Date().toISOString();
      const safeTs = timestamp.replace(/[:.]/g, '-');
      const backupFilename = `nmy_prod_backup_${safeTs}.json`;
      const backupFilePath = path.join(this.backupDir, backupFilename);

      // 1. CREATE & STORE
      fs.writeFileSync(backupFilePath, rawDb, 'utf-8');

      // 2. VERIFY
      const readBack = fs.readFileSync(backupFilePath, 'utf-8');
      const readBackParsed = JSON.parse(readBack);

      const hasher = crypto.createHash('sha256');
      hasher.update(readBack);
      const sha256Checksum = hasher.digest('hex');

      const sourceUsersCount = Array.isArray(parsedDb.users) ? parsedDb.users.length : 0;
      const readBackUsersCount = Array.isArray(readBackParsed.users) ? readBackParsed.users.length : 0;

      const sourceReqCount = Array.isArray(parsedDb.requests) ? parsedDb.requests.length : 0;
      const readBackReqCount = Array.isArray(readBackParsed.requests) ? readBackParsed.requests.length : 0;

      const sourceLedgerCount = Array.isArray(parsedDb.creditLedger) ? parsedDb.creditLedger.length : 0;
      const readBackLedgerCount = Array.isArray(readBackParsed.creditLedger) ? readBackParsed.creditLedger.length : 0;

      const sourceCreditReqCount = Array.isArray(parsedDb.creditRequests) ? parsedDb.creditRequests.length : 0;
      const readBackCreditReqCount = Array.isArray(readBackParsed.creditRequests) ? readBackParsed.creditRequests.length : 0;

      const sourceAuditCount = Array.isArray(parsedDb.auditLogs) ? parsedDb.auditLogs.length : 0;
      const readBackAuditCount = Array.isArray(readBackParsed.auditLogs) ? readBackParsed.auditLogs.length : 0;

      // Verification integrity check
      const isIntegrityValid =
        sourceUsersCount === readBackUsersCount &&
        sourceReqCount === readBackReqCount &&
        sourceLedgerCount === readBackLedgerCount &&
        sourceCreditReqCount === readBackCreditReqCount &&
        sourceAuditCount === readBackAuditCount &&
        readBackParsed.users?.some((u: any) => u.phone === '255748604483');

      if (!isIntegrityValid) {
        fs.unlinkSync(backupFilePath);
        console.error('[NMY BACKUP CRITICAL] Backup verification failed for', backupFilename);
        return {
          success: false,
          error: 'Uhakiki wa backup umeshindikana (Verification Failed). Backup haijarekodiwa.'
        };
      }

      const stat = fs.statSync(backupFilePath);

      // 3. RECORD in registry
      const backupRecord: NmyBackupRecord = {
        id: `bup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        filename: backupFilename,
        filePath: backupFilePath,
        sizeBytes: stat.size,
        sha256Checksum,
        timestamp,
        environment: 'PRODUCTION',
        databaseIdentity: 'NIDA_MITANDAO_YOTE_PROD_DB',
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        recordCounts: {
          users: readBackUsersCount,
          requests: readBackReqCount,
          creditLedger: readBackLedgerCount,
          creditRequests: readBackCreditReqCount,
          auditLogs: readBackAuditCount
        },
        status: 'VERIFIED'
      };

      const registry = this.getRegistry();
      registry.unshift(backupRecord);
      // Keep up to 50 verified backups
      if (registry.length > 50) {
        const toPrune = registry.slice(50);
        for (const oldRec of toPrune) {
          try {
            if (fs.existsSync(oldRec.filePath)) {
              fs.unlinkSync(oldRec.filePath);
            }
          } catch {}
        }
        this.saveRegistry(registry.slice(0, 50));
      } else {
        this.saveRegistry(registry);
      }

      console.log(`[NMY BACKUP] Verified Backup created: ${backupFilename} (${stat.size} bytes, SHA256: ${sha256Checksum.slice(0, 10)}...) Reason: ${reason}`);
      return { success: true, record: backupRecord };
    } catch (err: any) {
      console.error('[NMY BACKUP ERROR]:', err);
      return { success: false, error: err.message || 'Hitilafu ya kuunda backup.' };
    }
  }

  public getBackups(): NmyBackupRecord[] {
    const list = this.getRegistry();
    // Validate each file still exists on disk
    return list.map(rec => ({
      ...rec,
      isVerified: fs.existsSync(rec.filePath) ? rec.isVerified : false
    }));
  }

  public getLastBackup(): NmyBackupRecord | null {
    const list = this.getBackups();
    return list[0] || null;
  }

  public getLastVerifiedBackup(): NmyBackupRecord | null {
    const list = this.getBackups();
    return list.find(b => b.status === 'VERIFIED' && fs.existsSync(b.filePath)) || null;
  }

  // SAFE CONTROLLED RECOVERY
  // Never "delete everything -> restore everything" blindly.
  // Instead:
  // 1. Take safety snapshot of current state
  // 2. Read and verify recovery file
  // 3. Apply state
  // 4. Record audit event
  public async safeRestorePoint(backupId: string, actor: { id: string; name: string; role: string }): Promise<{
    success: boolean;
    restoredRecord?: NmyBackupRecord;
    error?: string;
  }> {
    try {
      const registry = this.getRegistry();
      const targetBackup = registry.find(b => b.id === backupId);

      if (!targetBackup) {
        return { success: false, error: 'Backup uliyochagua haikupatikana.' };
      }

      if (!fs.existsSync(targetBackup.filePath)) {
        return { success: false, error: 'Faili halisi la backup halipatikani kwenye hifadhi salama.' };
      }

      // Step 1: Pre-restore Safety Snapshot
      await this.createVerifiedBackup(`PRE_RESTORE_SAFETY_SNAPSHOT_BEFORE_${targetBackup.id}`);

      // Step 2: Read and verify target backup
      const rawTarget = fs.readFileSync(targetBackup.filePath, 'utf-8');
      const parsedTarget = JSON.parse(rawTarget);

      // Verify canonical super admin is present
      const hasSuperAdmin = parsedTarget.users?.some((u: any) => u.phone === '255748604483');
      if (!hasSuperAdmin) {
        return { success: false, error: 'Backup haina Super Admin anayetambulika. Urejeshaji umesimamishwa kwa usalama.' };
      }

      // Step 3: Write safely using temporary file
      const tempPath = `${this.dbFilePath}.restore.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(parsedTarget, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbFilePath);

      console.log(`[NMY RECOVERY] Controlled recovery executed successfully from ${targetBackup.filename} by ${actor.name} (${actor.role})`);
      return { success: true, restoredRecord: targetBackup };
    } catch (err: any) {
      console.error('[NMY RECOVERY ERROR]:', err);
      return { success: false, error: err.message || 'Hitilafu ya kurejesha mfumo.' };
    }
  }

  // DATA INTEGRITY & AUDIT SCANNER
  public async runDataIntegrityCheck(currentDbData: any): Promise<NmyIntegrityReport> {
    const discrepancies: NmyIntegrityReport['discrepancies'] = [];

    const users = currentDbData?.users || [];
    const requests = currentDbData?.requests || [];
    const creditAccounts = currentDbData?.creditAccounts || {};
    const creditLedger = currentDbData?.creditLedger || [];
    const creditRequests = currentDbData?.creditRequests || [];
    const auditLogs = currentDbData?.auditLogs || [];

    // 1. Verify credit balances vs ledger sum
    const ledgerSumsByUser: Record<string, number> = {};
    for (const entry of creditLedger) {
      if (!ledgerSumsByUser[entry.userId]) ledgerSumsByUser[entry.userId] = 0;
      if (entry.type === 'ADD' || entry.type === 'REFUND') {
        ledgerSumsByUser[entry.userId] += entry.amount;
      } else if (entry.type === 'CHARGE') {
        ledgerSumsByUser[entry.userId] -= entry.amount;
      } else if (entry.type === 'ADJUSTMENT') {
        ledgerSumsByUser[entry.userId] += entry.amount;
      }
    }

    for (const user of users) {
      if (user.role === 'CUSTOMER') {
        const storedBalance = creditAccounts[user.id]?.balanceTzs || 0;
        const calculatedBalance = ledgerSumsByUser[user.id] || 0;

        if (storedBalance < 0) {
          discrepancies.push({
            type: 'CREDIT_MISMATCH',
            severity: 'CRITICAL',
            message: `Mteja ${user.fullName} (${user.phone}) ana salio hasi (negative balance): TSh ${storedBalance}. Salio hasi haliruhusiwi!`,
            details: { userId: user.id, storedBalance }
          });
        }

        if (storedBalance !== calculatedBalance) {
          discrepancies.push({
            type: 'CREDIT_MISMATCH',
            severity: 'MEDIUM',
            message: `Salio la mteja ${user.fullName} (TSh ${storedBalance}) lina tofauti na hesabu ya Ledger (TSh ${calculatedBalance}).`,
            details: { userId: user.id, storedBalance, calculatedBalance }
          });
        }
      }
    }

    // 2. Check for duplicate request IDs
    const seenReqIds = new Set<string>();
    for (const req of requests) {
      if (seenReqIds.has(req.id)) {
        discrepancies.push({
          type: 'DUPLICATE_TRANSACTION',
          severity: 'HIGH',
          message: `Namba ya ombi (${req.id}) imejirudia mara mbili!`,
          details: { requestId: req.id }
        });
      }
      seenReqIds.add(req.id);
    }

    // 3. Check for approved credit requests with missing ledger records
    for (const cr of creditRequests) {
      if (cr.status === 'APPROVED') {
        const foundInLedger = creditLedger.some((e: any) => e.reference?.includes(cr.id) || e.reference === cr.paymentReference);
        if (!foundInLedger) {
          discrepancies.push({
            type: 'UNRESOLVED_PAYMENT',
            severity: 'HIGH',
            message: `Ombi la malipo ${cr.id} la TSh ${cr.amountTzs} limeidhinishwa lakini rekodi yake haionekani kwenye Credit Ledger.`,
            details: { creditRequestId: cr.id, amount: cr.amountTzs }
          });
        }
      }
    }

    const isHealthy = discrepancies.filter(d => d.severity === 'CRITICAL' || d.severity === 'HIGH').length === 0;

    return {
      isHealthy,
      checkedAt: new Date().toISOString(),
      totalUsers: users.length,
      totalRequests: requests.length,
      totalLedgerEntries: creditLedger.length,
      totalCreditRequests: creditRequests.length,
      totalAuditLogs: auditLogs.length,
      discrepancies
    };
  }
}

export function getNmyBackupService(): NmyBackupService {
  return NmyBackupService.getInstance();
}
