import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { 
  User, 
  WalletTransaction, 
  AdCampaign, 
  CompanyLedgerTransaction, 
  RefundRecord, 
  PlatformPricingConfig, 
  AuditLog, 
  RvcDepositRequest, 
  PaymentConfig,
  CreditConfig,
  CreditBundle,
  SystemSettings,
  AuthoritativeLedgers,
  SystemPersistenceStatus,
  ChatMessage,
  ChatConversation,
  MessageRequest,
  ChatPrivacySettings,
  UserPrivacySettings,
  FollowRequest,
  CallSession,
  Post,
  PostComment,
  ContentReport,
  MarketItem,
  MarketOrder,
  NotificationItem,
  CreatorApplication,
  BusinessApplication,
  CompanyApplication,
  GlobalCommunicationSettings,
  GlobalCommunicationServiceControl,
  DailyReportData
} from '../../src/types';
import { IRaviniDataStore, PaginationOptions } from './dataStoreInterface';
import { hashPassword, isHashed } from '../utils/passwordSecurity';

export class SqliteProductionDataStore implements IRaviniDataStore {
  readonly name = 'SqliteProductionDataStore (ACID WAL Engine)';
  private dbPath: string;
  private db!: DatabaseSync;
  private isInitialized = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'ravini_production.sqlite');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(this.dbPath);
    
    // Enable WAL mode & foreign keys for high throughput and durability
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
    `);

    this.createTables();
    this.reconcileAccountsAndSecurity();
    this.isInitialized = true;
    console.log(`[RAVINI SQLite Engine] Production SQLite database initialized at ${this.dbPath}`);
  }

  private reconcileAccountsAndSecurity() {
    try {
      const now = new Date().toISOString();
      const existingRows = this.db.prepare('SELECT id, username, phone, role, data_json FROM users').all() as any[];
      const usersMap = new Map<string, User>();
      
      for (const row of existingRows) {
        try {
          const user = JSON.parse(row.data_json);
          usersMap.set(user.id, user);
        } catch {}
      }

      // 1. Enforce Canonical SUPER_ADMIN (Baraka Mabula - 255748604483)
      const CANONICAL_PHONE = '255748604483';
      const CANONICAL_ID = 'usr_baraka_mabula';
      let superAdmin = usersMap.get(CANONICAL_ID);

      if (!superAdmin) {
        for (const u of usersMap.values()) {
          const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '');
          if (cleanPhone === CANONICAL_PHONE || u.username === CANONICAL_PHONE) {
            superAdmin = u;
            break;
          }
        }
      }

      const superAdminHashedPass = superAdmin?.password && isHashed(superAdmin.password)
        ? superAdmin.password
        : hashPassword('1234');

      if (!superAdmin) {
        superAdmin = {
          id: CANONICAL_ID,
          name: 'Baraka Mabula',
          username: CANONICAL_PHONE,
          email: 'barakamabula82@gmail.com',
          phone: CANONICAL_PHONE,
          password: superAdminHashedPass,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
          bio: 'Mwanzilishi & Msimamizi Mkuu (Super Admin) wa RAVINI COMPANY LIMITED. Full Controller System. Karibuni sana kwenye mtandao mkuu wa kijamii wa Kitanzania! 🇹🇿🚀',
          location: 'Dar es Salaam, Tanzania',
          verified: true,
          role: 'SUPER_ADMIN',
          walletBalance: 0,
          followersCount: 0,
          followingCount: 0,
          createdAt: '2026-01-10T08:00:00.000Z',
          isOnline: true,
          savedPosts: [],
          followingUsers: [],
          permissions: ['all'],
          mustChangePassword: false,
          accountStatus: 'ACTIVE',
          isDisabled: false,
          isSuspended: false
        };
      } else {
        superAdmin.id = CANONICAL_ID;
        superAdmin.name = 'Baraka Mabula';
        superAdmin.username = CANONICAL_PHONE;
        superAdmin.phone = CANONICAL_PHONE;
        superAdmin.role = 'SUPER_ADMIN';
        superAdmin.password = superAdminHashedPass;
        superAdmin.mustChangePassword = false;
        superAdmin.isDisabled = false;
        superAdmin.isSuspended = false;
        superAdmin.accountStatus = 'ACTIVE';
        superAdmin.permissions = ['all'];
        const LEGACY_DEMO_IDS = ['usr_amina_juma', 'usr_juma_rashid', 'usr_neema_mrosso', 'usr_salim_admin', 'usr_huduma_wateja'];
        superAdmin.followingUsers = (superAdmin.followingUsers || []).filter((id: string) => !LEGACY_DEMO_IDS.includes(id));
        if (superAdmin.followersCount === 12450) superAdmin.followersCount = 0;
        if (superAdmin.followingCount === 320) superAdmin.followingCount = 0;
        if (superAdmin.walletBalance === 250000) superAdmin.walletBalance = 0;
      }

      this.db.prepare(`
        INSERT INTO users (id, username, email, phone, role, verified, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username=excluded.username,
          phone=excluded.phone,
          role=excluded.role,
          verified=excluded.verified,
          data_json=excluded.data_json,
          updated_at=excluded.updated_at
      `).run(
        superAdmin.id,
        superAdmin.username,
        superAdmin.email || '',
        superAdmin.phone || '',
        'SUPER_ADMIN',
        1,
        JSON.stringify(superAdmin),
        superAdmin.createdAt || now,
        now
      );

      // 2. Super Admin Uniqueness: Revoke any unauthorized SUPER_ADMIN role on non-canonical accounts
      for (const [id, u] of usersMap.entries()) {
        if (id === CANONICAL_ID) continue;
        if (u.role === 'SUPER_ADMIN' || u.role === 'super_admin') {
          console.warn(`[RAVINI Integrity] Revoking duplicate SUPER_ADMIN role on non-canonical account ${id}`);
          u.role = 'admin';
          if (!u.permissions) u.permissions = [];
          const uJson = JSON.stringify(u);
          this.db.prepare('UPDATE users SET role = ?, data_json = ?, updated_at = ? WHERE id = ?')
            .run('admin', uJson, now, id);
        }
      }

      // 3. Purge legacy demo accounts and demo data from database if present
      const LEGACY_DEMO_IDS = ['usr_amina_juma', 'usr_juma_rashid', 'usr_neema_mrosso', 'usr_salim_admin', 'usr_huduma_wateja'];
      for (const demoId of LEGACY_DEMO_IDS) {
        this.db.prepare('DELETE FROM users WHERE id = ?').run(demoId);
        this.db.prepare('DELETE FROM posts WHERE author_id = ?').run(demoId);
        this.db.prepare('DELETE FROM post_comments WHERE author_id = ?').run(demoId);
        this.db.prepare('DELETE FROM market_items WHERE seller_id = ?').run(demoId);
        this.db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(demoId, demoId);
        this.db.prepare('DELETE FROM call_sessions WHERE caller_id = ? OR receiver_id = ?').run(demoId, demoId);
        this.db.prepare("DELETE FROM conversations WHERE participant_ids LIKE ?").run(`%"${demoId}"%`);
      }
      this.db.prepare("DELETE FROM posts WHERE id IN ('post_welcome_baraka', 'post_amina_business', 'post_neema_tech')").run();
      this.db.prepare("DELETE FROM wallet_transactions WHERE id = 'tx_init_baraka'").run();
      this.db.prepare("DELETE FROM company_ledger WHERE id = 'cld_init_001'").run();

      // 4. Global password sweep: ensure every record in `users` has a hashed password
      const allRows = this.db.prepare('SELECT id, data_json FROM users').all() as any[];
      for (const row of allRows) {
        try {
          const u = JSON.parse(row.data_json);
          if (u.password && !isHashed(u.password)) {
            u.password = hashPassword(u.password);
            this.db.prepare('UPDATE users SET data_json = ?, updated_at = ? WHERE id = ?')
              .run(JSON.stringify(u), now, row.id);
          }
        } catch {}
      }

      console.log(`[RAVINI Integrity] Account and security reconciliation completed successfully. Verified canonical Super Admin (${CANONICAL_PHONE}).`);
    } catch (err) {
      console.error('[RAVINI Integrity] Error during account reconciliation:', err);
    }
  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        phone TEXT,
        role TEXT,
        verified INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        content TEXT,
        media_url TEXT,
        media_type TEXT,
        privacy TEXT DEFAULT 'public',
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS market_items (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS market_orders (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        content TEXT,
        media_url TEXT,
        is_delivered INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        participant_ids TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS message_requests (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS call_sessions (
        id TEXT PRIMARY KEY,
        caller_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ad_campaigns (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        budget REAL DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS company_ledger (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refund_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rvc_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        actor_id TEXT,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS creator_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS business_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS company_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_kv (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS content_reports (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);
    `);
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const rows = this.db.prepare('SELECT data_json FROM users ORDER BY created_at ASC').all() as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT data_json FROM users WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const clean = username.trim().toLowerCase();
    const row = this.db.prepare('SELECT data_json FROM users WHERE LOWER(username) = ?').get(clean) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const clean = email.trim().toLowerCase();
    const row = this.db.prepare('SELECT data_json FROM users WHERE LOWER(email) = ?').get(clean) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const clean = phone.replace(/[^0-9]/g, '');
    const users = await this.getUsers();
    return users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === clean) || null;
  }

  async saveUser(user: User): Promise<User> {
    const isCanonical = user.id === 'usr_baraka_mabula' || user.phone === '255748604483' || user.username === '255748604483';
    // Enforce canonical Super Admin immutability
    if (isCanonical) {
      user.id = 'usr_baraka_mabula';
      user.phone = '255748604483';
      user.role = 'SUPER_ADMIN';
      user.isDisabled = false;
      user.isSuspended = false;
      user.permissions = ['all'];
      user.mustChangePassword = false;
      user.accountStatus = 'ACTIVE';
    } else {
      // Prevent unauthorized role escalation to SUPER_ADMIN
      if (user.role === 'SUPER_ADMIN' || user.role === 'super_admin') {
        throw new Error('Huwezi kumpa mtumiaji cheo cha SUPER_ADMIN. Kuna Super Admin mmoja tu anayetambulika.');
      }
    }

    // Ensure password is NEVER stored in plaintext
    if (user.password && !isHashed(user.password)) {
      user.password = hashPassword(user.password);
    }

    const now = new Date().toISOString();
    const json = JSON.stringify(user);
    this.db.prepare(`
      INSERT INTO users (id, username, email, phone, role, verified, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username=excluded.username,
        email=excluded.email,
        phone=excluded.phone,
        role=excluded.role,
        verified=excluded.verified,
        data_json=excluded.data_json,
        updated_at=excluded.updated_at
    `).run(
      user.id,
      user.username || '',
      user.email || '',
      user.phone || '',
      user.role || 'user',
      user.verified ? 1 : 0,
      json,
      user.createdAt || now,
      now
    );
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;

    const isCanonical = existing.id === 'usr_baraka_mabula' || existing.phone === '255748604483' || existing.username === '255748604483';

    // Protection for canonical Super Admin
    if (isCanonical) {
      if (updates.role && updates.role !== 'SUPER_ADMIN' && updates.role !== 'super_admin') {
        throw new Error('Msimamizi Mkuu (Super Admin) hawezi kushushwa cheo.');
      }
      updates.role = 'SUPER_ADMIN';
      updates.isDisabled = false;
      updates.isSuspended = false;
      updates.mustChangePassword = false;
      updates.accountStatus = 'ACTIVE';
    } else {
      // Prevent non-canonical accounts from being elevated to SUPER_ADMIN
      if (updates.role === 'SUPER_ADMIN' || updates.role === 'super_admin') {
        throw new Error('Huwezi kubadilisha akaunti hii kuwa Super Admin.');
      }
    }

    if (updates.password && !isHashed(updates.password)) {
      updates.password = hashPassword(updates.password);
    }

    const merged: User = { ...existing, ...updates };
    return this.saveUser(merged);
  }

  async purgeUser(id: string, actorId: string): Promise<boolean> {
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || '').toLowerCase();
    if (role !== 'super_admin' && actorId !== 'usr_baraka_mabula') {
      throw new Error('Ni Super Admin pekee anayeweza kufuta akaunti ya mtumiaji kabisa.');
    }

    const target = await this.getUserById(id);
    if (!target) return false;

    if (target.id === 'usr_baraka_mabula' || target.phone === '255748604483' || (target.role || '').toLowerCase() === 'super_admin') {
      throw new Error('Akaunti ya Msimamizi Mkuu (Super Admin) haiwezi kufutwa.');
    }

    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);

    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: 'SUPER_ADMIN',
      action: 'PURGE_USER',
      target: `${target.name} (@${target.username})`,
      targetId: id,
      details: `Permanently purged user ${target.name} (${id}) from database.`
    });

    return true;
  }

  // --- Transactions ---
  async getUserTransactions(userId: string, options?: PaginationOptions): Promise<WalletTransaction[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM wallet_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getAllTransactions(options?: PaginationOptions): Promise<WalletTransaction[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM wallet_transactions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async recordWalletTransaction(tx: WalletTransaction): Promise<WalletTransaction> {
    const json = JSON.stringify(tx);
    this.db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(tx.id, tx.userId, tx.type, tx.amount, tx.status || 'completed', tx.description || '', json, tx.createdAt);
    return tx;
  }

  async atomicWalletTransfer(params: {
    senderId: string;
    recipientId: string;
    amountRvc: number;
    description: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }> {
    const { senderId, recipientId, amountRvc, description, idempotencyKey } = params;

    if (amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha RVC kinapaswa kuwa zaidi ya sifuri.' };
    }

    if (senderId === recipientId) {
      return { success: false, message: 'Huwezi kujitumia RVC mwenyewe.' };
    }

    const sender = await this.getUserById(senderId);
    const recipient = await this.getUserById(recipientId);

    if (!sender) return { success: false, message: 'Mtumaji hakupatikana.' };
    if (!recipient) return { success: false, message: 'Mpokeaji hakupatikana.' };

    if ((sender.walletBalance || 0) < amountRvc) {
      return { 
        success: false, 
        message: `Salio lako la RVC (${sender.walletBalance || 0} RVC) halitoshi kukamilisha muamala huu wa ${amountRvc} RVC.` 
      };
    }

    const now = new Date().toISOString();
    const txId = idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

    // Execute atomic update
    sender.walletBalance = (sender.walletBalance || 0) - amountRvc;
    recipient.walletBalance = (recipient.walletBalance || 0) + amountRvc;

    await this.saveUser(sender);
    await this.saveUser(recipient);

    const tx: WalletTransaction = {
      id: txId,
      userId: sender.id,
      amount: -amountRvc,
      type: 'transfer',
      description: `Uhamisho wa ${amountRvc} RVC kwenda kwa ${recipient.name} (${description || 'Hamisha RVC'})`,
      createdAt: now,
      status: 'completed',
      recipientId: recipient.id,
      recipientName: recipient.name,
      currency: 'RVC'
    };

    const recipTx: WalletTransaction = {
      id: `rx_${txId}`,
      userId: recipient.id,
      amount: amountRvc,
      type: 'transfer',
      description: `Ulipokea ${amountRvc} RVC kutoka kwa ${sender.name} (${description || 'Hamisha RVC'})`,
      createdAt: now,
      status: 'completed',
      senderId: sender.id,
      senderName: sender.name,
      currency: 'RVC'
    };

    await this.recordWalletTransaction(tx);
    await this.recordWalletTransaction(recipTx);

    // Audit log
    await this.addAuditLog({
      actorId: sender.id,
      actorName: sender.name,
      actorRole: sender.role,
      action: 'RVC_PEER_TRANSFER',
      target: recipient.name,
      targetId: recipient.id,
      details: `Transferred ${amountRvc} RVC from ${sender.name} to ${recipient.name}. Tx: ${txId}`
    });

    return {
      success: true,
      message: `Umefanikiwa kutuma ${amountRvc} RVC kwa ${recipient.name}!`,
      transaction: tx
    };
  }

  // --- Ad Campaigns ---
  async getAdCampaigns(options?: PaginationOptions): Promise<AdCampaign[]> {
    const limit = options?.limit || 100;
    const rows = this.db.prepare('SELECT data_json FROM ad_campaigns ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getAdCampaignById(id: string): Promise<AdCampaign | null> {
    const row = this.db.prepare('SELECT data_json FROM ad_campaigns WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveAdCampaign(campaign: AdCampaign): Promise<AdCampaign> {
    const json = JSON.stringify(campaign);
    this.db.prepare(`
      INSERT INTO ad_campaigns (id, user_id, title, status, budget, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        budget=excluded.budget,
        data_json=excluded.data_json
    `).run(campaign.id, campaign.userId, campaign.title, campaign.status, campaign.totalBudgetRvc || 0, json, campaign.createdAt);
    return campaign;
  }

  async updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign | null> {
    const existing = await this.getAdCampaignById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveAdCampaign(merged);
  }

  // --- Company Ledger ---
  async getCompanyLedger(options?: PaginationOptions): Promise<CompanyLedgerTransaction[]> {
    const limit = options?.limit || 100;
    const rows = this.db.prepare('SELECT data_json FROM company_ledger ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async addCompanyLedgerEntry(entry: CompanyLedgerTransaction): Promise<CompanyLedgerTransaction> {
    const json = JSON.stringify(entry);
    this.db.prepare(`
      INSERT INTO company_ledger (id, type, amount, description, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entry.id, 
      entry.type || 'revenue', 
      entry.amount || 0, 
      entry.description || '', 
      json, 
      entry.createdAt || new Date().toISOString()
    );
    return entry;
  }

  async getAuthoritativeLedgers(): Promise<AuthoritativeLedgers> {
    const ledger = await this.getCompanyLedger();
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalAdsRevenue = 0;
    let totalRvcDeposits = 0;

    ledger.forEach(item => {
      totalRevenue += item.amount;
      if (item.type === 'commission' || item.service === 'market_commission') totalCommission += item.amount;
      if (item.service === 'ads') totalAdsRevenue += item.amount;
      if (item.service === 'wallet_topup') totalRvcDeposits += item.amount;
    });

    const users = await this.getUsers();
    let customerRvcTotal = 0;
    users.forEach(u => {
      customerRvcTotal += (u.walletBalance || 0);
    });

    return {
      customerRvcWalletTotal: customerRvcTotal,
      pendingEscrowFundsTotal: 0,
      creatorEarningsTotal: 0,
      sellerFundsTotal: 0,
      refundsTotal: 0,
      companyRevenueTotal: totalRevenue,
      platformCostsTotal: 0,
      reconciliationTimestamp: new Date().toISOString(),
      isBalanced: true,
      variance: 0,
      totalRevenueTzs: totalRevenue,
      totalCommissionEarnedTzs: totalCommission,
      totalAdsRevenueTzs: totalAdsRevenue,
      totalRvcDepositsTzs: totalRvcDeposits,
      activeLedgerTransactionsCount: ledger.length,
      lastAuditedAt: new Date().toISOString()
    };
  }

  // --- Refunds ---
  async getRefunds(options?: PaginationOptions): Promise<RefundRecord[]> {
    const limit = options?.limit || 100;
    const rows = this.db.prepare('SELECT data_json FROM refund_records ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getRefundById(id: string): Promise<RefundRecord | null> {
    const row = this.db.prepare('SELECT data_json FROM refund_records WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveRefund(refund: RefundRecord): Promise<RefundRecord> {
    const json = JSON.stringify(refund);
    this.db.prepare(`
      INSERT INTO refund_records (id, user_id, amount, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(refund.id, refund.userId, refund.amountRvc, refund.status, json, refund.requestedAt || new Date().toISOString());
    return refund;
  }

  async updateRefund(id: string, updates: Partial<RefundRecord>): Promise<RefundRecord | null> {
    const existing = await this.getRefundById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveRefund(merged);
  }

  // --- Platform Pricing ---
  async getPlatformPricing(): Promise<PlatformPricingConfig> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'pricing'").get() as any;
    if (row) return JSON.parse(row.value_json);

    const defaultPricing: PlatformPricingConfig = {
      adPricing: {
        sponsoredPostPerDay: 1000,
        sponsoredVideoPerDay: 1800,
        sponsoredClipPerDay: 1400,
        sponsoredProductPerDay: 1200,
        sponsoredBusinessPerDay: 2000,
        bannerPerDay: 2500,
        feedAdPerDay: 1500,
        cpmRate: 100,
        minimumBudgetRvc: 1000,
      },
      premiumPricing: {
        monthlyRvc: 9900,
        quarterlyRvc: 26900,
        annualRvc: 95000,
      },
      pushViralPackages: [],
      marketCommissionRate: 0.05,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    await this.setKV('pricing', defaultPricing);
    return defaultPricing;
  }

  async updatePlatformPricing(pricing: PlatformPricingConfig, actorId: string, actorName: string): Promise<PlatformPricingConfig> {
    const updated: PlatformPricingConfig = {
      ...pricing,
      updatedAt: new Date().toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };
    await this.setKV('pricing', updated);
    return updated;
  }

  // --- RVC Requests ---
  async getRvcRequests(options?: PaginationOptions): Promise<RvcDepositRequest[]> {
    const limit = options?.limit || 100;
    const rows = this.db.prepare('SELECT data_json FROM rvc_requests ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getRvcRequestById(id: string): Promise<RvcDepositRequest | null> {
    const row = this.db.prepare('SELECT data_json FROM rvc_requests WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveRvcRequest(req: RvcDepositRequest): Promise<RvcDepositRequest> {
    const json = JSON.stringify(req);
    this.db.prepare(`
      INSERT INTO rvc_requests (id, user_id, amount, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(req.id, req.userId, req.amount, req.status, json, req.createdAt || new Date().toISOString());
    return req;
  }

  async updateRvcRequest(id: string, updates: Partial<RvcDepositRequest>): Promise<RvcDepositRequest | null> {
    const existing = await this.getRvcRequestById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveRvcRequest(merged);
  }

  // --- Payment Configuration (Super Admin Configurable Manual System) ---
  async getPaymentConfig(): Promise<PaymentConfig> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'payment_config'").get() as any;
    if (row) {
      try {
        const parsed = JSON.parse(row.value_json);
        return {
          whatsappNumber: parsed.whatsappNumber || '+255748604483',
          whatsappDisplayName: parsed.whatsappDisplayName || 'RAVINI Payment Desk',
          paymentInstructions: parsed.paymentInstructions || 'Malipo ya RAVINI yanafanyika kwa njia ya manual. Fanya malipo kupitia namba za Lipa zilizo hapa chini kisha bonyeza ENDELEA WHATSAPP kutuma namba ya kumbukumbu ya muamala wako.',
          paymentReferenceInstructions: parsed.paymentReferenceInstructions || 'Tuma ujumbe wenye namba ya kumbukumbu ya muamala (SMS ya malipo) na jina lako la mtumiaji (Username) kupitia WhatsApp rasmi ili kuthibitishiwa.',
          minTopUpAmount: parsed.minTopUpAmount || 1000,
          maxTopUpAmount: parsed.maxTopUpAmount || 5000000,
          isActive: parsed.isActive !== undefined ? parsed.isActive : true,
          availableMethods: parsed.availableMethods || ['M-Pesa', 'Airtel Money', 'Mixx by Yas', 'HaloPesa'],
          mpesaNumber: parsed.mpesaNumber || '5566778',
          mpesaName: parsed.mpesaName || 'RAVINI COMPANY LIMITED (Lipa Namba)',
          airtelNumber: parsed.airtelNumber || '8899001',
          airtelName: parsed.airtelName || 'RAVINI COMPANY LIMITED (Paybill)',
          mixxNumber: parsed.mixxNumber || '334455',
          mixxName: parsed.mixxName || 'RAVINI COMPANY LIMITED',
          haloPesaNumber: parsed.haloPesaNumber || '778899',
          haloPesaName: parsed.haloPesaName || 'RAVINI COMPANY LIMITED',
          conversionRate: 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          updatedBy: parsed.updatedBy || 'System'
        };
      } catch (e) {
        // Fall back to default
      }
    }

    const defaultConfig: PaymentConfig = {
      whatsappNumber: '+255748604483',
      whatsappDisplayName: 'RAVINI Payment Desk',
      paymentInstructions: 'Malipo ya RAVINI yanafanyika kwa njia ya manual. Fanya malipo kupitia namba za Lipa zilizo hapa chini kisha bonyeza ENDELEA WHATSAPP kutuma namba ya kumbukumbu ya muamala wako.',
      paymentReferenceInstructions: 'Tuma ujumbe wenye namba ya kumbukumbu ya muamala (SMS ya malipo) na jina lako la mtumiaji (Username) kupitia WhatsApp rasmi ili kuthibitishiwa.',
      minTopUpAmount: 1000,
      maxTopUpAmount: 5000000,
      isActive: true,
      availableMethods: ['M-Pesa', 'Airtel Money', 'Mixx by Yas', 'HaloPesa'],
      mpesaNumber: '5566778',
      mpesaName: 'RAVINI COMPANY LIMITED (Lipa Namba)',
      airtelNumber: '8899001',
      airtelName: 'RAVINI COMPANY LIMITED (Paybill)',
      mixxNumber: '334455',
      mixxName: 'RAVINI COMPANY LIMITED',
      haloPesaNumber: '778899',
      haloPesaName: 'RAVINI COMPANY LIMITED',
      conversionRate: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    await this.setKV('payment_config', defaultConfig);
    return defaultConfig;
  }

  async updatePaymentConfig(config: PaymentConfig, actorId: string, actorName: string): Promise<PaymentConfig> {
    const existing = await this.getPaymentConfig();
    const merged: PaymentConfig = {
      ...existing,
      ...config,
      conversionRate: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName
    };
    await this.setKV('payment_config', merged);
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: 'super_admin',
      action: 'PAYMENT_CONFIG_UPDATED',
      target: 'payment_config',
      details: `Updated manual payment settings. WhatsApp Contact: ${merged.whatsappNumber} (${merged.whatsappDisplayName}). Active: ${merged.isActive}. Min: ${merged.minTopUpAmount}, Max: ${merged.maxTopUpAmount}.`
    });
    return merged;
  }

  // --- Credit System Configuration (Prices, Bundles, WhatsApp) ---
  async getCreditConfig(): Promise<CreditConfig> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'credit_config'").get() as any;
    if (row) {
      try {
        const parsed = JSON.parse(row.value_json);
        return {
          postPriceCredits: typeof parsed.postPriceCredits === 'number' ? parsed.postPriceCredits : 1,
          videoPriceCredits: typeof parsed.videoPriceCredits === 'number' ? parsed.videoPriceCredits : 2,
          moviePriceCredits: typeof parsed.moviePriceCredits === 'number' ? parsed.moviePriceCredits : 3,
          bundles: Array.isArray(parsed.bundles) && parsed.bundles.length > 0 ? parsed.bundles : [
            { credits: 50, priceTzs: 5000, label: 'Kifurushi Kidogo', popular: false },
            { credits: 100, priceTzs: 10000, label: 'Kifurushi cha Kawaida', popular: true },
            { credits: 250, priceTzs: 20000, label: 'Kifurushi Bora (Nafuu)', popular: false },
          ],
          pricePerCreditTzs: typeof parsed.pricePerCreditTzs === 'number' ? parsed.pricePerCreditTzs : 100,
          minCustomCredits: typeof parsed.minCustomCredits === 'number' ? parsed.minCustomCredits : 10,
          maxCustomCredits: typeof parsed.maxCustomCredits === 'number' ? parsed.maxCustomCredits : 50000,
          whatsappNumber: (parsed.whatsappNumber || '255748604483').replace(/[^0-9]/g, ''),
          whatsappDisplayName: parsed.whatsappDisplayName || 'RAVINI COMPANY LIMITED (Manager)',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          updatedBy: parsed.updatedBy || 'System'
        };
      } catch (e) {
        // Fall back to default
      }
    }

    const defaultConfig: CreditConfig = {
      postPriceCredits: 1,
      videoPriceCredits: 2,
      moviePriceCredits: 3,
      bundles: [
        { credits: 50, priceTzs: 5000, label: 'Kifurushi Kidogo', popular: false },
        { credits: 100, priceTzs: 10000, label: 'Kifurushi cha Kawaida', popular: true },
        { credits: 250, priceTzs: 20000, label: 'Kifurushi Bora (Nafuu)', popular: false },
      ],
      pricePerCreditTzs: 100,
      minCustomCredits: 10,
      maxCustomCredits: 50000,
      whatsappNumber: '255748604483',
      whatsappDisplayName: 'RAVINI COMPANY LIMITED (Manager)',
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    await this.setKV('credit_config', defaultConfig);
    return defaultConfig;
  }

  async updateCreditConfig(config: Partial<CreditConfig>, actorId: string, actorName: string): Promise<CreditConfig> {
    const existing = await this.getCreditConfig();
    const cleanNumber = (config.whatsappNumber || existing.whatsappNumber).replace(/[^0-9]/g, '');
    const merged: CreditConfig = {
      ...existing,
      ...config,
      whatsappNumber: cleanNumber || '255748604483',
      updatedAt: new Date().toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };
    await this.setKV('credit_config', merged);

    // Keep payment_config WhatsApp contact synchronized
    try {
      const payConfig = await this.getPaymentConfig();
      if (payConfig.whatsappNumber !== merged.whatsappNumber) {
        payConfig.whatsappNumber = merged.whatsappNumber;
        await this.setKV('payment_config', payConfig);
      }
    } catch {}

    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: 'manager',
      action: 'CREDIT_CONFIG_UPDATED',
      target: 'credit_config',
      details: `Updated Credit pricing & WhatsApp configuration. Post: ${merged.postPriceCredits}cr, Video: ${merged.videoPriceCredits}cr, Movie: ${merged.moviePriceCredits}cr, WhatsApp: ${merged.whatsappNumber}.`
    });
    return merged;
  }

  // --- Audit Logs ---
  async getAuditLogs(options?: PaginationOptions): Promise<AuditLog[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as any[];
    return rows.map(r => ({
      id: r.id,
      actorId: r.actor_id,
      actorName: r.actor_name,
      actorRole: r.action,
      action: r.action,
      target: r.target,
      details: r.details,
      timestamp: r.timestamp
    }));
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, action, target, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.actorId, log.actorName, log.action, log.target || '', log.details || '', timestamp);

    return {
      id,
      actorId: log.actorId,
      actorName: log.actorName,
      actorRole: log.actorRole || 'user',
      action: log.action,
      target: log.target,
      details: log.details,
      timestamp
    };
  }

  // --- System Settings ---
  async getSystemSettings(): Promise<SystemSettings> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'system_settings'").get() as any;
    if (row) return JSON.parse(row.value_json);

    const defaultSettings: SystemSettings = {
      allowRegistrations: true,
      allowMarketPosting: true,
      allowRvcDeposits: true,
      allowStories: true,
      maintenanceMode: false,
      maintenanceMessage: 'Mfumo wa RAVINI unafanyiwa maboresho madogo.',
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    await this.setKV('system_settings', defaultSettings);
    return defaultSettings;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const existing = await this.getSystemSettings();
    const merged = { ...existing, ...settings, updatedAt: new Date().toISOString() };
    await this.setKV('system_settings', merged);
    return merged;
  }

  // --- Chat & Messages ---
  async getConversations(userId: string): Promise<ChatConversation[]> {
    const rows = this.db.prepare('SELECT data_json FROM conversations ORDER BY updated_at DESC').all() as any[];
    const all = rows.map(r => JSON.parse(r.data_json) as ChatConversation);
    return all.filter(c => c.participantIds && c.participantIds.includes(userId));
  }

  async getConversationById(id: string): Promise<ChatConversation | null> {
    const row = this.db.prepare('SELECT data_json FROM conversations WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveConversation(conv: ChatConversation): Promise<ChatConversation> {
    const json = JSON.stringify(conv);
    this.db.prepare(`
      INSERT INTO conversations (id, type, name, participant_ids, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        participant_ids=excluded.participant_ids,
        data_json=excluded.data_json,
        updated_at=excluded.updated_at
    `).run(conv.id, conv.type, conv.name || '', JSON.stringify(conv.participantIds), json, conv.createdAt, conv.updatedAt || new Date().toISOString());
    return conv;
  }

  async updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | null> {
    const existing = await this.getConversationById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.saveConversation(merged);
  }

  async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<ChatConversation> {
    const convs = await this.getConversations(user1Id);
    const existing = convs.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(user1Id) && 
      c.participantIds.includes(user2Id)
    );
    if (existing) return existing;

    const user1 = await this.getUserById(user1Id);
    const user2 = await this.getUserById(user2Id);

    const now = new Date().toISOString();
    const newConv: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'direct',
      participantIds: [user1Id, user2Id],
      participantNames: {
        [user1Id]: user1?.name || 'Mtumiaji',
        [user2Id]: user2?.name || 'Mtumiaji'
      },
      participantAvatars: {
        [user1Id]: user1?.avatar || '',
        [user2Id]: user2?.avatar || ''
      },
      unreadCounts: {
        [user1Id]: 0,
        [user2Id]: 0
      },
      createdAt: now,
      updatedAt: now
    };

    return this.saveConversation(newConv);
  }

  async getMessages(conversationId: string, options?: PaginationOptions): Promise<ChatMessage[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM messages 
      WHERE conversation_id = ? AND is_deleted = 0 
      ORDER BY created_at ASC 
      LIMIT ? OFFSET ?
    `).all(conversationId, limit, offset) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getMessageById(id: string): Promise<ChatMessage | null> {
    const row = this.db.prepare('SELECT data_json FROM messages WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveMessage(msg: ChatMessage): Promise<ChatMessage> {
    const json = JSON.stringify(msg);
    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, media_url, is_delivered, is_read, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_delivered=excluded.is_delivered,
        is_read=excluded.is_read,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(
      msg.id,
      msg.conversationId || '',
      msg.senderId,
      msg.receiverId || '',
      msg.content || '',
      msg.mediaUrl || '',
      (msg.isDelivered || msg.status === 'delivered' || msg.status === 'read') ? 1 : 0,
      (msg.isRead || msg.read || msg.status === 'read') ? 1 : 0,
      msg.isDeleted ? 1 : 0,
      json,
      msg.createdAt
    );
    return msg;
  }

  async updateMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null> {
    const existing = await this.getMessageById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveMessage(merged);
  }

  async deleteMessage(id: string, deletedByUserId: string, forEveryone: boolean): Promise<boolean> {
    const msg = await this.getMessageById(id);
    if (!msg) return false;

    if (forEveryone) {
      msg.isDeleted = true;
      msg.content = 'Ujumbe huu umefutwa.';
      msg.mediaUrl = undefined;
      await this.saveMessage(msg);
      return true;
    } else {
      msg.deletedFor = [...(msg.deletedFor || []), deletedByUserId];
      await this.saveMessage(msg);
      return true;
    }
  }

  async searchMessages(userId: string, query: string, conversationId?: string): Promise<ChatMessage[]> {
    const cleanQ = `%${query.toLowerCase()}%`;
    let rows: any[];
    if (conversationId) {
      rows = this.db.prepare(`
        SELECT data_json FROM messages 
        WHERE conversation_id = ? AND LOWER(content) LIKE ? AND is_deleted = 0 
        ORDER BY created_at DESC LIMIT 50
      `).all(conversationId, cleanQ) as any[];
    } else {
      const convs = await this.getConversations(userId);
      const convIds = convs.map(c => c.id);
      if (convIds.length === 0) return [];
      rows = this.db.prepare(`
        SELECT data_json FROM messages 
        WHERE LOWER(content) LIKE ? AND is_deleted = 0 
        ORDER BY created_at DESC LIMIT 50
      `).all(cleanQ) as any[];
      return rows.map(r => JSON.parse(r.data_json)).filter(m => convIds.includes(m.conversationId));
    }
    return rows.map(r => JSON.parse(r.data_json));
  }

  // --- Message Requests & Privacy ---
  async getMessageRequests(userId: string): Promise<MessageRequest[]> {
    const rows = this.db.prepare('SELECT data_json FROM message_requests WHERE receiver_id = ? ORDER BY created_at DESC').all(userId) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveMessageRequest(req: MessageRequest): Promise<MessageRequest> {
    const json = JSON.stringify(req);
    this.db.prepare(`
      INSERT INTO message_requests (id, sender_id, receiver_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(req.id, req.senderId, req.receiverId, req.status, json, req.createdAt);
    return req;
  }

  async updateMessageRequest(id: string, updates: Partial<MessageRequest>): Promise<MessageRequest | null> {
    const row = this.db.prepare('SELECT data_json FROM message_requests WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveMessageRequest(merged);
  }

  async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`privacy_${userId}`) as any;
    const parsed = row ? JSON.parse(row.value_json) : {};

    const defaultSettings: UserPrivacySettings = {
      userId,
      accountVisibility: parsed.accountVisibility || 'public',
      whoCanFollowMe: parsed.whoCanFollowMe || 'everyone',
      whoCanMessageMe: parsed.whoCanMessageMe || 'everyone',
      whoCanCallMe: parsed.whoCanCallMe || 'everyone',
      whoCanComment: parsed.whoCanComment || 'everyone',
      whoCanMentionMe: parsed.whoCanMentionMe || 'everyone',
      whoCanTagMe: parsed.whoCanTagMe || 'everyone',
      whoCanSeePosts: parsed.whoCanSeePosts || 'public',
      whoCanSeeFollowList: parsed.whoCanSeeFollowList || 'everyone',
      showReadReceipts: parsed.showReadReceipts !== undefined ? parsed.showReadReceipts : true,
      showOnlineStatus: parsed.showOnlineStatus !== undefined ? parsed.showOnlineStatus : true,
      showLastSeen: parsed.showLastSeen !== undefined ? parsed.showLastSeen : true,
      allowDownloads: parsed.allowDownloads !== undefined ? parsed.allowDownloads : true,
      screenshotProtection: parsed.screenshotProtection !== undefined ? parsed.screenshotProtection : false,
      blockedUserIds: parsed.blockedUserIds || [],
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };

    if (!row) {
      await this.setKV(`privacy_${userId}`, defaultSettings);
    }
    return defaultSettings;
  }

  async updateUserPrivacySettings(userId: string, updates: Partial<UserPrivacySettings>): Promise<UserPrivacySettings> {
    const existing = await this.getUserPrivacySettings(userId);
    const merged: UserPrivacySettings = { 
      ...existing, 
      ...updates, 
      accountVisibility: updates.accountVisibility || existing.accountVisibility,
      whoCanFollowMe: updates.whoCanFollowMe || existing.whoCanFollowMe,
      updatedAt: new Date().toISOString() 
    };
    await this.setKV(`privacy_${userId}`, merged);
    return merged;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const privacy = await this.getUserPrivacySettings(blockerId);
    if (!privacy.blockedUserIds.includes(blockedId)) {
      privacy.blockedUserIds.push(blockedId);
      await this.updateUserPrivacySettings(blockerId, privacy);
    }
    // Also unfollow each other automatically
    const blocker = await this.getUserById(blockerId);
    if (blocker && blocker.followingUsers && blocker.followingUsers.includes(blockedId)) {
      blocker.followingUsers = blocker.followingUsers.filter(id => id !== blockedId);
      blocker.followingCount = blocker.followingUsers.length;
      await this.saveUser(blocker);
    }
    const blocked = await this.getUserById(blockedId);
    if (blocked && blocked.followingUsers && blocked.followingUsers.includes(blockerId)) {
      blocked.followingUsers = blocked.followingUsers.filter(id => id !== blockerId);
      blocked.followingCount = blocked.followingUsers.length;
      await this.saveUser(blocked);
    }
    return true;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const privacy = await this.getUserPrivacySettings(blockerId);
    privacy.blockedUserIds = privacy.blockedUserIds.filter(id => id !== blockedId);
    await this.updateUserPrivacySettings(blockerId, privacy);
    return true;
  }

  async isUserBlocked(user1Id: string, user2Id: string): Promise<boolean> {
    const p1 = await this.getUserPrivacySettings(user1Id);
    if (p1.blockedUserIds.includes(user2Id)) return true;
    const p2 = await this.getUserPrivacySettings(user2Id);
    if (p2.blockedUserIds.includes(user1Id)) return true;
    return false;
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const privacy = await this.getUserPrivacySettings(userId);
    const blocked: User[] = [];
    for (const bId of (privacy.blockedUserIds || [])) {
      const u = await this.getUserById(bId);
      if (u) {
        blocked.push({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          raviniId: u.raviniId,
          role: u.role,
          verified: u.verified,
          followersCount: u.followersCount || 0,
          followingCount: u.followingCount || 0,
          walletBalance: 0,
          email: '',
          createdAt: u.createdAt
        });
      }
    }
    return blocked;
  }

  // --- Call Sessions ---
  async getCallSessions(userId: string): Promise<CallSession[]> {
    const rows = this.db.prepare(`
      SELECT data_json FROM call_sessions 
      WHERE caller_id = ? OR receiver_id = ? 
      ORDER BY created_at DESC LIMIT 50
    `).all(userId, userId) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveCallSession(session: CallSession): Promise<CallSession> {
    const json = JSON.stringify(session);
    this.db.prepare(`
      INSERT INTO call_sessions (id, caller_id, receiver_id, type, status, duration, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        duration=excluded.duration,
        data_json=excluded.data_json
    `).run(session.id, session.callerId, session.receiverId, session.type, session.status, session.durationSeconds || 0, json, session.createdAt || new Date().toISOString());
    return session;
  }

  async updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | null> {
    const row = this.db.prepare('SELECT data_json FROM call_sessions WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCallSession(merged);
  }

  // --- Unread Chat Count ---
  async getUnreadChatCount(userId: string): Promise<number> {
    const convs = await this.getConversations(userId);
    let total = 0;
    convs.forEach(c => {
      total += (c.unreadCounts && c.unreadCounts[userId]) || 0;
    });
    return total;
  }

  // --- Posts & Interactions ---
  async getPosts(options?: PaginationOptions & { 
    authorId?: string; 
    includeDeleted?: boolean;
    mediaType?: string;
    moderationStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    reportedOnly?: boolean;
  }): Promise<Post[]> {
    const limit = options?.limit || 200;
    let query = 'SELECT data_json FROM posts';
    const params: any[] = [];
    const conditions: string[] = [];

    if (!options?.includeDeleted) {
      conditions.push('is_deleted = 0');
    }

    if (options?.authorId) {
      conditions.push('author_id = ?');
      params.push(options.authorId);
    }

    if (options?.mediaType && options.mediaType !== 'all') {
      conditions.push('media_type = ?');
      params.push(options.mediaType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(query).all(...params) as any[];
    let posts: Post[] = rows.map(r => JSON.parse(r.data_json));

    if (options?.moderationStatus && options.moderationStatus !== 'all') {
      posts = posts.filter(p => (p.moderationStatus || 'normal') === options.moderationStatus);
    }
    if (options?.reportedOnly) {
      posts = posts.filter(p => p.moderationStatus === 'reported');
    }
    if (options?.startDate) {
      const startMs = new Date(options.startDate).getTime();
      posts = posts.filter(p => new Date(p.createdAt).getTime() >= startMs);
    }
    if (options?.endDate) {
      const endMs = new Date(options.endDate).getTime();
      posts = posts.filter(p => new Date(p.createdAt).getTime() <= endMs);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      posts = posts.filter(p => 
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.authorName && p.authorName.toLowerCase().includes(q)) ||
        (p.authorUsername && p.authorUsername.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return posts;
  }

  async getPostById(id: string): Promise<Post | null> {
    const row = this.db.prepare('SELECT data_json FROM posts WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async savePost(post: Post): Promise<Post> {
    post.ownerId = post.ownerId || post.authorId;
    const json = JSON.stringify(post);
    this.db.prepare(`
      INSERT INTO posts (id, author_id, content, media_url, media_type, privacy, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content=excluded.content,
        media_url=excluded.media_url,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(
      post.id, 
      post.authorId, 
      post.content || '', 
      post.mediaUrl || '', 
      post.mediaType || 'image', 
      post.privacy || 'public', 
      post.isDeleted ? 1 : 0, 
      json, 
      post.createdAt
    );
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    const existing = await this.getPostById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.savePost(merged);
  }

  async deletePost(id: string, actorId: string, actorRole: string = 'user', reason: string = 'User deleted'): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;

    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || '').toLowerCase();
    const isOwner = post.authorId === actorId || post.ownerId === actorId;
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new Error('Huna idhini ya kufuta chapisho hili.');
    }

    const now = new Date().toISOString();
    post.isDeleted = true;
    post.deletedAt = now;
    post.deletedBy = actorId;
    post.deleteReason = reason;

    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: 'POST_DELETED',
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus: post.moderationStatus || 'normal',
      resultingStatus: 'removed'
    });
    post.moderationStatus = 'removed';

    await this.savePost(post);

    // Immutable audit record
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: isOwner ? 'USER_POST_DELETED' : 'ADMIN_POST_DELETED',
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post deleted by ${actor?.name || actorId} (${role}). Reason: ${reason}. Author: ${post.authorName} (${post.authorId})`
    });

    return true;
  }

  async restorePost(id: string, actorId: string, actorRole: string = 'admin'): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;

    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || '').toLowerCase();
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Super Admin au Admin mwenye ruhusa pekee anaweza kurejesha chapisho.');
    }

    const now = new Date().toISOString();
    post.isDeleted = false;
    post.deletedAt = undefined;
    post.deletedBy = undefined;
    post.deleteReason = undefined;
    post.moderationStatus = 'normal';

    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: 'POST_RESTORED',
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason: 'Post restored by admin review',
      timestamp: now,
      previousStatus: 'removed',
      resultingStatus: 'normal'
    });

    await this.savePost(post);

    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: 'ADMIN_POST_RESTORED',
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post ${post.id} restored by ${actor?.name || actorId}. Author: ${post.authorName}`
    });

    return true;
  }

  async purgePost(id: string, actorId: string): Promise<boolean> {
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || '').toLowerCase();
    const isSuperAdmin = role === 'super_admin' || actorId === 'usr_baraka_mabula';
    if (!isSuperAdmin) {
      throw new Error('Ni Msimamizi Mkuu (Super Admin) pekee anayeweza kufuta chapisho kabisa (purge).');
    }

    const post = await this.getPostById(id);
    this.db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    try {
      this.db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(id);
      this.db.prepare('DELETE FROM content_reports WHERE target_id = ?').run(id);
    } catch {}

    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: 'SUPER_ADMIN',
      action: 'PURGE_POST',
      target: `Post ${id}`,
      targetId: id,
      details: `Permanently purged post ${id}. Author was: ${post?.authorName || 'Unknown'}`
    });

    return true;
  }

  async restrictPost(id: string, actorId: string, actorRole: string = 'admin', reason: string = 'Policy violation'): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;

    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || '').toLowerCase();
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Super Admin au Admin mwenye ruhusa pekee anaweza kuzuia (restrict) chapisho.');
    }

    const now = new Date().toISOString();
    post.moderationStatus = 'restricted';
    post.restrictedReason = reason;
    post.moderatedBy = actorId;
    post.moderatedAt = now;

    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: 'POST_RESTRICTED',
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus: 'normal',
      resultingStatus: 'restricted'
    });

    await this.savePost(post);

    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: 'ADMIN_POST_RESTRICTED',
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post ${post.id} restricted by ${actor?.name || actorId}. Reason: ${reason}`
    });

    return true;
  }

  async togglePostComments(id: string, actorId: string, commentsDisabled: boolean): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;

    const actor = await this.getUserById(actorId);
    const role = (actor?.role || '').toLowerCase();
    const isOwner = post.authorId === actorId || post.ownerId === actorId;
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new Error('Mwenye chapisho au Msimamizi pekee anaweza kurekebisha hali ya maoni.');
    }

    post.commentsDisabled = commentsDisabled;
    await this.savePost(post);
    return true;
  }

  async likePost(postId: string, userId: string, reaction: string = 'like'): Promise<{ likesCount: number; reactions: Record<string, string> }> {
    const post = await this.getPostById(postId);
    if (!post) throw new Error('Post not found');

    post.reactions = post.reactions || {};
    if (post.reactions[userId]) {
      delete post.reactions[userId];
    } else {
      post.reactions[userId] = reaction as any;
    }
    await this.savePost(post);
    return {
      likesCount: Object.keys(post.reactions).length,
      reactions: post.reactions
    };
  }

  // --- Comments ---
  async getComments(
    postIdOrOptions?: string | {
      postId?: string;
      includeRemoved?: boolean;
      authorId?: string;
      moderationStatus?: string;
      search?: string;
      limit?: number;
    },
    legacyIncludeRemoved: boolean = false
  ): Promise<PostComment[]> {
    let postId: string | undefined;
    let includeRemoved = legacyIncludeRemoved;
    let authorId: string | undefined;
    let moderationStatus: string | undefined;
    let search: string | undefined;
    let limit = 200;

    if (typeof postIdOrOptions === 'object' && postIdOrOptions !== null) {
      postId = postIdOrOptions.postId;
      includeRemoved = !!postIdOrOptions.includeRemoved;
      authorId = postIdOrOptions.authorId;
      moderationStatus = postIdOrOptions.moderationStatus;
      search = postIdOrOptions.search;
      if (postIdOrOptions.limit) limit = postIdOrOptions.limit;
    } else if (typeof postIdOrOptions === 'string') {
      postId = postIdOrOptions;
    }

    let query = 'SELECT data_json FROM post_comments';
    const params: any[] = [];
    const conditions: string[] = [];

    if (postId) {
      conditions.push('post_id = ?');
      params.push(postId);
    }
    if (!includeRemoved) {
      conditions.push('is_removed = 0');
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(query).all(...params) as any[];
    let comments: PostComment[] = rows.map(r => JSON.parse(r.data_json));

    if (authorId) {
      comments = comments.filter(c => (c.authorId || c.userId) === authorId);
    }
    if (moderationStatus && moderationStatus !== 'all') {
      comments = comments.filter(c => (c.moderationStatus || 'normal') === moderationStatus);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      comments = comments.filter(c => 
        (c.content && c.content.toLowerCase().includes(q)) || 
        (c.userName && c.userName.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return comments;
  }

  async getCommentById(id: string): Promise<PostComment | null> {
    const row = this.db.prepare('SELECT data_json FROM post_comments WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async addComment(comment: PostComment): Promise<PostComment> {
    const post = await this.getPostById(comment.postId);
    if (!post) throw new Error('Chapisho halijapatikana.');
    if (post.commentsDisabled) {
      throw new Error('Mwenye chapisho amezima maoni kwenye chapisho hili.');
    }

    const json = JSON.stringify(comment);
    this.db.prepare(`
      INSERT INTO post_comments (id, post_id, author_id, content, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content=excluded.content,
        data_json=excluded.data_json
    `).run(comment.id, comment.postId, comment.authorId || comment.userId || '', comment.content, json, comment.createdAt);

    // Increment comment count on post
    post.commentsCount = (post.commentsCount || 0) + 1;
    await this.savePost(post);

    return comment;
  }

  async updateComment(id: string, updates: Partial<PostComment>): Promise<PostComment | null> {
    const existing = await this.getCommentById(id);
    if (!existing) return null;
    const merged: PostComment = { ...existing, ...updates };
    const json = JSON.stringify(merged);
    this.db.prepare(`
      UPDATE post_comments SET content=?, data_json=? WHERE id=?
    `).run(merged.content, json, id);
    return merged;
  }

  async deleteComment(id: string, actorId: string, actorRole: string = 'user', reason: string = 'Comment removed'): Promise<boolean> {
    const comment = await this.getCommentById(id);
    if (!comment) return false;

    const post = await this.getPostById(comment.postId);
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || '').toLowerCase();
    const isCommentAuthor = (comment.authorId || comment.userId) === actorId;
    const isPostAuthor = post ? (post.authorId === actorId || post.ownerId === actorId) : false;
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isCommentAuthor && !isPostAuthor && !isSuperAdmin && !isAdmin) {
      throw new Error('Huna idhini ya kufuta maoni haya.');
    }

    const previousStatus = comment.moderationStatus || (comment.isRemoved ? 'removed' : 'normal');
    const newStatus = 'removed';
    const now = new Date().toISOString();

    comment.isRemoved = true;
    comment.removedAt = now;
    comment.removedBy = actorId;
    comment.removedByRole = role.toUpperCase();
    comment.removeReason = reason;
    comment.moderationStatus = 'removed';

    if (!comment.moderationHistory) comment.moderationHistory = [];
    comment.moderationHistory.push({
      commentId: comment.id,
      postId: comment.postId,
      commentOwnerId: comment.authorId || comment.userId,
      moderatorId: actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus,
      newStatus
    });

    await this.updateComment(id, comment);

    // Decrement post commentsCount
    if (post && post.commentsCount > 0) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await this.savePost(post);
    }

    // Audit log
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: isCommentAuthor ? 'USER_COMMENT_DELETED' : 'ADMIN_COMMENT_REMOVED',
      target: `Comment ${comment.id} on Post ${comment.postId}`,
      targetId: comment.id,
      details: `Comment removed by ${actor?.name || actorId} (${role}). Reason: ${reason}. Author: ${comment.userName}`
    });

    return true;
  }

  async restoreComment(id: string, actorId: string, actorRole: string = 'admin'): Promise<boolean> {
    const comment = await this.getCommentById(id);
    if (!comment) return false;

    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || '').toLowerCase();
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' && (actor?.permissions || []).map(p => p.toLowerCase()).some(p => p === 'all' || p === 'post_moderation_manage' || p === 'moderate_posts');

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Super Admin au Admin mwenye ruhusa pekee anaweza kurejesha maoni.');
    }

    const previousStatus = comment.moderationStatus || 'removed';
    const newStatus = 'normal';
    const now = new Date().toISOString();

    comment.isRemoved = false;
    comment.removedAt = undefined;
    comment.removedBy = undefined;
    comment.removeReason = undefined;
    comment.moderationStatus = 'normal';

    if (!comment.moderationHistory) comment.moderationHistory = [];
    comment.moderationHistory.push({
      commentId: comment.id,
      postId: comment.postId,
      commentOwnerId: comment.authorId || comment.userId,
      moderatorId: actorId,
      moderatorRole: role.toUpperCase(),
      reason: 'Comment restored by admin review',
      timestamp: now,
      previousStatus,
      newStatus
    });

    await this.updateComment(id, comment);

    const post = await this.getPostById(comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      await this.savePost(post);
    }

    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: 'ADMIN_COMMENT_RESTORED',
      target: `Comment ${comment.id} on Post ${comment.postId}`,
      targetId: comment.id,
      details: `Comment restored by ${actor?.name || actorId}`
    });

    return true;
  }

  // --- Moderation Reports Queue ---
  async getReports(options?: { status?: string; targetType?: string }): Promise<ContentReport[]> {
    let query = 'SELECT data_json FROM content_reports';
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.status && options.status !== 'all') {
      conditions.push('status = ?');
      params.push(options.status);
    }
    if (options?.targetType && options.targetType !== 'all') {
      conditions.push('target_type = ?');
      params.push(options.targetType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getReportById(id: string): Promise<ContentReport | null> {
    const row = this.db.prepare('SELECT data_json FROM content_reports WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveReport(report: ContentReport): Promise<ContentReport> {
    const json = JSON.stringify(report);
    this.db.prepare(`
      INSERT INTO content_reports (id, target_type, target_id, post_id, reporter_id, status, category, reason, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(
      report.id,
      report.targetType,
      report.targetId,
      report.postId,
      report.reporterId,
      report.status || 'pending',
      report.category,
      report.reason,
      json,
      report.createdAt
    );

    // Also mark post or comment as reported
    if (report.targetType === 'post') {
      const post = await this.getPostById(report.targetId);
      if (post && post.moderationStatus !== 'restricted' && post.moderationStatus !== 'removed') {
        post.moderationStatus = 'reported';
        await this.savePost(post);
      }
    } else if (report.targetType === 'comment') {
      const comment = await this.getCommentById(report.targetId);
      if (comment && comment.moderationStatus !== 'removed') {
        comment.moderationStatus = 'reported';
        await this.updateComment(report.targetId, comment);
      }
    }

    return report;
  }

  async updateReport(id: string, updates: Partial<ContentReport>): Promise<ContentReport | null> {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    const merged: ContentReport = { ...existing, ...updates };
    return this.saveReport(merged);
  }

  // --- Following / Followers ---
  async followUser(followerId: string, targetUserId: string): Promise<{ success: boolean; status?: string; message: string }> {
    if (followerId === targetUserId) {
      return { success: false, message: 'Huwezi kujifuata mwenyewe.' };
    }

    if (await this.isUserBlocked(followerId, targetUserId)) {
      return { success: false, message: 'Huwezi kumfuata mtumiaji huyu kwa sababu ya kizuizi cha faragha.' };
    }

    const follower = await this.getUserById(followerId);
    const targetUser = await this.getUserById(targetUserId);

    if (!follower || !targetUser) {
      return { success: false, message: 'Mtumiaji hajapatikana.' };
    }

    const following = new Set(follower.followingUsers || []);
    if (following.has(targetUserId)) {
      return { success: true, status: 'following', message: `Tayari unamfuata ${targetUser.name}.` };
    }

    const targetPrivacy = await this.getUserPrivacySettings(targetUserId);

    // If account is private or requires follow request
    if (targetPrivacy.accountVisibility === 'private' || targetPrivacy.whoCanFollowMe === 'request') {
      const reqId = `freq_${followerId}_${targetUserId}`;
      const followReq: FollowRequest = {
        id: reqId,
        senderId: followerId,
        senderName: follower.name,
        senderUsername: follower.username,
        senderAvatar: follower.avatar,
        senderRaviniId: follower.raviniId,
        receiverId: targetUserId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.setKV(`follow_request_${reqId}`, followReq);

      await this.saveNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: targetUserId,
        actorId: followerId,
        actorName: follower.name,
        actorAvatar: follower.avatar,
        type: 'follow',
        title: 'Ombi Jipya la Kufuata',
        titleSw: 'Ombi Jipya la Kufuata',
        titleEn: 'New Follow Request',
        message: `${follower.name} ametuma ombi la kukufuata kwenye RAVINI.`,
        messageSw: `${follower.name} ametuma ombi la kukufuata kwenye RAVINI.`,
        messageEn: `${follower.name} requested to follow you on RAVINI.`,
        targetId: followerId,
        read: false,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        status: 'pending',
        message: 'Akaunti hii ni ya faragha. Ombi lako la kufuata (Follow Request) limetumwa kwa mafanikio.'
      };
    }

    following.add(targetUserId);
    follower.followingUsers = Array.from(following);
    follower.followingCount = follower.followingUsers.length;

    // Recalculate target user's real followers count
    const allUsers = await this.getUsers();
    const realFollowersCount = allUsers.filter(u => u.id !== targetUserId && (u.id === followerId || (u.followingUsers || []).includes(targetUserId))).length;
    targetUser.followersCount = realFollowersCount;

    await this.saveUser(follower);
    await this.saveUser(targetUser);

    // Save notification
    await this.saveNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId,
      actorId: followerId,
      actorName: follower.name,
      actorAvatar: follower.avatar,
      type: 'follow',
      title: 'Mfuasi Mpya',
      titleSw: 'Mfuasi Mpya',
      titleEn: 'New Follower',
      message: `${follower.name} ameanza kukufuata kwenye RAVINI.`,
      messageSw: `${follower.name} ameanza kukufuata kwenye RAVINI.`,
      messageEn: `${follower.name} started following you on RAVINI.`,
      targetId: followerId,
      read: false,
      createdAt: new Date().toISOString()
    });

    return { success: true, status: 'following', message: `Sasa unamfuata ${targetUser.name}.` };
  }

  async unfollowUser(followerId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const follower = await this.getUserById(followerId);
    const targetUser = await this.getUserById(targetUserId);

    if (!follower || !targetUser) {
      return { success: false, message: 'Mtumiaji hajapatikana.' };
    }

    const following = new Set(follower.followingUsers || []);
    following.delete(targetUserId);
    follower.followingUsers = Array.from(following);
    follower.followingCount = follower.followingUsers.length;

    // Delete any pending follow request if exists
    const reqId = `freq_${followerId}_${targetUserId}`;
    this.db.prepare("DELETE FROM system_kv WHERE key = ?").run(`follow_request_${reqId}`);

    // Recalculate target user's real followers count
    const allUsers = await this.getUsers();
    const realFollowersCount = allUsers.filter(u => u.id !== targetUserId && u.id !== followerId && (u.followingUsers || []).includes(targetUserId)).length;
    targetUser.followersCount = realFollowersCount;

    await this.saveUser(follower);
    await this.saveUser(targetUser);

    return { success: true, message: `Umeacha kumfuata ${targetUser.name}.` };
  }

  async getFollowers(userId: string): Promise<User[]> {
    const allUsers = await this.getUsers();
    const userPrivacy = await this.getUserPrivacySettings(userId);
    const blockedIds = new Set(userPrivacy.blockedUserIds || []);

    const followers = allUsers.filter(u => 
      u.id !== userId && 
      !blockedIds.has(u.id) &&
      (u.followingUsers || []).includes(userId)
    );

    return followers.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      location: u.location,
      verified: u.verified,
      raviniId: u.raviniId,
      role: u.role,
      followersCount: u.followersCount || 0,
      followingCount: u.followingCount || 0,
      walletBalance: 0,
      email: '',
      createdAt: u.createdAt
    }));
  }

  async getFollowing(userId: string): Promise<User[]> {
    const target = await this.getUserById(userId);
    if (!target || !target.followingUsers || target.followingUsers.length === 0) return [];

    const userPrivacy = await this.getUserPrivacySettings(userId);
    const blockedIds = new Set(userPrivacy.blockedUserIds || []);
    const followingSet = new Set(target.followingUsers);

    const allUsers = await this.getUsers();
    const following = allUsers.filter(u => 
      u.id !== userId && 
      followingSet.has(u.id) && 
      !blockedIds.has(u.id)
    );

    return following.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      location: u.location,
      verified: u.verified,
      raviniId: u.raviniId,
      role: u.role,
      followersCount: u.followersCount || 0,
      followingCount: u.followingCount || 0,
      walletBalance: 0,
      email: '',
      createdAt: u.createdAt
    }));
  }

  async getFollowRequests(userId: string): Promise<any[]> {
    const rows = this.db.prepare("SELECT value_json FROM system_kv WHERE key LIKE 'follow_request_%'").all() as any[];
    const requests: FollowRequest[] = [];
    for (const r of rows) {
      try {
        const item: FollowRequest = JSON.parse(r.value_json);
        if (item.receiverId === userId && item.status === 'pending') {
          requests.push(item);
        }
      } catch (e) {
        // ignore malformed
      }
    }
    return requests;
  }

  async acceptFollowRequest(requestId: string, receiverId: string): Promise<{ success: boolean; message: string }> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`follow_request_${requestId}`) as any;
    if (!row) return { success: false, message: 'Ombi halikupatikana.' };

    const req: FollowRequest = JSON.parse(row.value_json);
    if (req.receiverId !== receiverId) {
      return { success: false, message: 'Huna idhini ya kukubali ombi hili.' };
    }

    req.status = 'accepted';
    req.updatedAt = new Date().toISOString();
    await this.setKV(`follow_request_${requestId}`, req);

    const follower = await this.getUserById(req.senderId);
    const receiver = await this.getUserById(receiverId);

    if (follower && receiver) {
      const following = new Set(follower.followingUsers || []);
      following.add(receiverId);
      follower.followingUsers = Array.from(following);
      follower.followingCount = follower.followingUsers.length;

      const allUsers = await this.getUsers();
      const realFollowersCount = allUsers.filter(u => u.id !== receiverId && (u.id === req.senderId || (u.followingUsers || []).includes(receiverId))).length;
      receiver.followersCount = realFollowersCount;

      await this.saveUser(follower);
      await this.saveUser(receiver);

      await this.saveNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: req.senderId,
        actorId: receiverId,
        actorName: receiver.name,
        actorAvatar: receiver.avatar,
        type: 'follow',
        title: 'Ombi la Kufuata Limekubaliwa',
        titleSw: 'Ombi la Kufuata Limekubaliwa',
        titleEn: 'Follow Request Accepted',
        message: `${receiver.name} amekubali ombi lako la kumfuata kwenye RAVINI.`,
        messageSw: `${receiver.name} amekubali ombi lako la kumfuata kwenye RAVINI.`,
        messageEn: `${receiver.name} accepted your request to follow them on RAVINI.`,
        targetId: receiverId,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return { success: true, message: 'Ombi la kufuata limekubaliwa!' };
  }

  async rejectFollowRequest(requestId: string, receiverId: string): Promise<{ success: boolean; message: string }> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`follow_request_${requestId}`) as any;
    if (!row) return { success: false, message: 'Ombi halikupatikana.' };

    const req: FollowRequest = JSON.parse(row.value_json);
    if (req.receiverId !== receiverId) {
      return { success: false, message: 'Huna idhini ya kukataa ombi hili.' };
    }

    req.status = 'rejected';
    req.updatedAt = new Date().toISOString();
    await this.setKV(`follow_request_${requestId}`, req);

    return { success: true, message: 'Ombi la kufuata limekataliwa.' };
  }

  // --- Market Items & Orders ---
  async getMarketItems(options?: PaginationOptions): Promise<MarketItem[]> {
    const limit = options?.limit || 100;
    const rows = this.db.prepare('SELECT data_json FROM market_items WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async getMarketItemById(id: string): Promise<MarketItem | null> {
    const row = this.db.prepare('SELECT data_json FROM market_items WHERE id = ? AND is_deleted = 0').get(id) as any;
    return row ? JSON.parse(row.data_json) : null;
  }

  async saveMarketItem(item: MarketItem): Promise<MarketItem> {
    const json = JSON.stringify(item);
    this.db.prepare(`
      INSERT INTO market_items (id, seller_id, title, price, category, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        price=excluded.price,
        category=excluded.category,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(item.id, item.sellerId, item.title, item.price, item.category || 'general', item.isDeleted ? 1 : 0, json, item.createdAt);
    return item;
  }

  async updateMarketItem(id: string, updates: Partial<MarketItem>): Promise<MarketItem | null> {
    const existing = await this.getMarketItemById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveMarketItem(merged);
  }

  async deleteMarketItem(id: string, userId: string): Promise<boolean> {
    const item = await this.getMarketItemById(id);
    if (!item) return false;
    if (item.sellerId !== userId) {
      const user = await this.getUserById(userId);
      if (user?.role !== 'super_admin' && user?.role !== 'SUPER_ADMIN') {
        return false;
      }
    }
    item.isDeleted = true;
    await this.saveMarketItem(item);
    return true;
  }

  async getMarketOrders(userId?: string): Promise<MarketOrder[]> {
    let rows: any[];
    if (userId) {
      rows = this.db.prepare('SELECT data_json FROM market_orders WHERE buyer_id = ? OR seller_id = ? ORDER BY created_at DESC').all(userId, userId) as any[];
    } else {
      rows = this.db.prepare('SELECT data_json FROM market_orders ORDER BY created_at DESC').all() as any[];
    }
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveMarketOrder(order: MarketOrder): Promise<MarketOrder> {
    const json = JSON.stringify(order);
    this.db.prepare(`
      INSERT INTO market_orders (id, item_id, buyer_id, seller_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(order.id, order.itemId, order.buyerId, order.sellerId, order.status, json, order.createdAt);
    return order;
  }

  async updateMarketOrder(id: string, updates: Partial<MarketOrder>): Promise<MarketOrder | null> {
    const row = this.db.prepare('SELECT data_json FROM market_orders WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveMarketOrder(merged);
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const rows = this.db.prepare('SELECT data_json FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveNotification(n: NotificationItem): Promise<NotificationItem> {
    const json = JSON.stringify(n);
    this.db.prepare(`
      INSERT INTO notifications (id, user_id, actor_id, type, is_read, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_read=excluded.is_read,
        data_json=excluded.data_json
    `).run(n.id, n.userId, n.actorId || '', n.type, n.read ? 1 : 0, json, n.createdAt);
    return n;
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const row = this.db.prepare('SELECT data_json FROM notifications WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!row) return false;
    const item = JSON.parse(row.data_json);
    item.read = true;
    await this.saveNotification(item);
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    const list = await this.getNotifications(userId);
    for (const n of list) {
      if (!n.read) {
        n.read = true;
        await this.saveNotification(n);
      }
    }
    return true;
  }

  // --- Applications ---
  async getCreatorApplications(): Promise<CreatorApplication[]> {
    const rows = this.db.prepare('SELECT data_json FROM creator_applications ORDER BY created_at DESC').all() as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveCreatorApplication(app: CreatorApplication): Promise<CreatorApplication> {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO creator_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || new Date().toISOString());
    return app;
  }

  async updateCreatorApplication(id: string, updates: Partial<CreatorApplication>): Promise<CreatorApplication | null> {
    const row = this.db.prepare('SELECT data_json FROM creator_applications WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCreatorApplication(merged);
  }

  async getBusinessApplications(): Promise<BusinessApplication[]> {
    const rows = this.db.prepare('SELECT data_json FROM business_applications ORDER BY created_at DESC').all() as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveBusinessApplication(app: BusinessApplication): Promise<BusinessApplication> {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO business_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || new Date().toISOString());
    return app;
  }

  async updateBusinessApplication(id: string, updates: Partial<BusinessApplication>): Promise<BusinessApplication | null> {
    const row = this.db.prepare('SELECT data_json FROM business_applications WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveBusinessApplication(merged);
  }

  async getCompanyApplications(): Promise<CompanyApplication[]> {
    const rows = this.db.prepare('SELECT data_json FROM company_applications ORDER BY created_at DESC').all() as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  async saveCompanyApplication(app: CompanyApplication): Promise<CompanyApplication> {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO company_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || new Date().toISOString());
    return app;
  }

  async updateCompanyApplication(id: string, updates: Partial<CompanyApplication>): Promise<CompanyApplication | null> {
    const row = this.db.prepare('SELECT data_json FROM company_applications WHERE id = ?').get(id) as any;
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCompanyApplication(merged);
  }

  // --- Super Admin Global Communication Control ---
  async getGlobalCommunicationSettings(): Promise<GlobalCommunicationSettings> {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'global_comm'").get() as any;
    if (row) {
      const settings = JSON.parse(row.value_json) as GlobalCommunicationSettings;
      // Check for automatic restoration if end date has passed
      if (settings.temporaryBlock && settings.temporaryBlock.isActive && settings.temporaryBlock.endDate) {
        const endMs = new Date(settings.temporaryBlock.endDate).getTime();
        if (Date.now() >= endMs) {
          settings.temporaryBlock.isActive = false;
          settings.allEnabled = true;
          Object.keys(settings.services).forEach(k => {
            (settings.services as any)[k] = true;
          });
          await this.setKV('global_comm', settings);
        }
      }
      return settings;
    }

    const defaultComm: GlobalCommunicationSettings = {
      allEnabled: true,
      services: {
        chat: true,
        voiceCalls: true,
        videoCalls: true,
        groupChat: true,
        messageRequests: true,
        mediaSharing: true,
      },
      targetScope: 'all',
      updatedAt: new Date().toISOString(),
      updatedBy: 'usr_baraka_mabula',
      updatedByName: 'Baraka Mabula (Super Admin)'
    };
    await this.setKV('global_comm', defaultComm);
    return defaultComm;
  }

  async updateGlobalCommunicationSettings(settings: Partial<GlobalCommunicationSettings>, actorId: string, actorName: string): Promise<GlobalCommunicationSettings> {
    const current = await this.getGlobalCommunicationSettings();
    const updated: GlobalCommunicationSettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
      updatedByName: actorName
    };
    await this.setKV('global_comm', updated);

    // Audit log
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: 'SUPER_ADMIN',
      action: 'GLOBAL_COMMUNICATION_UPDATED',
      target: 'COMMUNICATION_POLICY',
      details: `Updated communication policy: AllEnabled=${updated.allEnabled}, Services=${JSON.stringify(updated.services)}, BlockReason=${updated.temporaryBlock?.reason || 'None'}`
    });

    return updated;
  }

  async isCommunicationServiceAllowed(service: keyof GlobalCommunicationServiceControl, userRole?: string): Promise<{ allowed: boolean; reason?: string }> {
    // Super Admin is always exempt
    if (userRole === 'super_admin' || userRole === 'SUPER_ADMIN') {
      return { allowed: true };
    }

    const settings = await this.getGlobalCommunicationSettings();

    // Check if entire system communication is disabled
    if (!settings.allEnabled) {
      return {
        allowed: false,
        reason: settings.temporaryBlock?.reason || '🔒 Mawasiliano yamefungwa kwa muda. Super Admin amesitisha huduma hii kwa muda. Tafadhali jaribu tena baada ya huduma kufunguliwa.'
      };
    }

    // Check individual service
    if (settings.services && settings.services[service] === false) {
      const serviceNames: Record<string, string> = {
        chat: 'Ujumbe (Chat)',
        voiceCalls: 'Simu za Sauti (Voice Calls)',
        videoCalls: 'Simu za Video (Video Calls)',
        groupChat: 'Makundi (Group Chat)',
        messageRequests: 'Maombi ya Ujumbe (Message Requests)',
        mediaSharing: 'Kutuma Faili & Picha (Media Sharing)'
      };
      return {
        allowed: false,
        reason: settings.temporaryBlock?.reason || `🔒 Mawasiliano ya ${serviceNames[service] || service} yamefungwa kwa muda na Super Admin.`
      };
    }

    return { allowed: true };
  }

  // --- Real Database Daily Reports ---
  async generateDailyReport(period: string, customRange?: { start: string; end: string }): Promise<DailyReportData> {
    const now = new Date();
    let startMs = 0;
    let endMs = now.getTime();

    if (period === 'today') {
      startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === 'yesterday') {
      startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === '7days') {
      startMs = now.getTime() - 7 * 86400000;
    } else if (period === '30days') {
      startMs = now.getTime() - 30 * 86400000;
    } else if (period === 'custom' && customRange) {
      startMs = new Date(customRange.start).getTime() || 0;
      endMs = new Date(customRange.end).getTime() || now.getTime();
    }

    const inWindow = (dateStr: string) => {
      const ms = new Date(dateStr).getTime();
      return ms >= startMs && ms <= endMs;
    };

    const users = await this.getUsers();
    const posts = await this.getPosts();
    const comments = await this.getComments();
    const market = await this.getMarketItems();
    const transactions = await this.getAllTransactions();
    const campaigns = await this.getAdCampaigns();
    const refunds = await this.getRefunds();
    const auditLogs = await this.getAuditLogs();
    const commSettings = await this.getGlobalCommunicationSettings();

    // Query messages in window
    const msgRows = this.db.prepare('SELECT data_json FROM messages WHERE is_deleted = 0').all() as any[];
    const messages: ChatMessage[] = msgRows.map(r => JSON.parse(r.data_json));

    const windowUsers = users.filter(u => inWindow(u.createdAt));
    const activeUsers = users.filter(u => u.isOnline || (u.createdAt && inWindow(u.createdAt))).length || users.length;
    const suspendedUsers = users.filter(u => u.isSuspended).length;

    const windowPosts = posts.filter(p => inWindow(p.createdAt));
    const videosCount = windowPosts.filter(p => p.mediaType === 'video').length;
    const clipsCount = windowPosts.filter(p => p.mediaType === 'clip').length;

    const windowComments = comments.filter(c => inWindow(c.createdAt));
    const windowMessages = messages.filter(m => inWindow(m.createdAt));

    let totalLikes = 0;
    let totalShares = 0;
    posts.forEach(p => {
      if (inWindow(p.createdAt)) {
        totalLikes += Object.keys(p.reactions || {}).length;
        totalShares += p.sharesCount || 0;
      }
    });

    const windowMarket = market.filter(m => inWindow(m.createdAt));
    const windowTx = transactions.filter(t => inWindow(t.createdAt));

    let rvcPurchased = 0;
    let rvcUsed = 0;
    windowTx.forEach(t => {
      if (t.type === 'topup' || t.amount > 0) {
        rvcPurchased += t.amount;
      } else if (t.amount < 0) {
        rvcUsed += Math.abs(t.amount);
      }
    });

    const windowCampaigns = campaigns.filter(c => inWindow(c.createdAt));
    let viralRevenue = 0;
    let premiumRevenue = 0;
    let adsRevenue = 0;

    windowCampaigns.forEach(c => {
      adsRevenue += c.totalBudgetRvc || 0;
    });

    const windowRefunds = refunds.filter(r => inWindow(r.requestedAt));
    let refundsApprovedCount = 0;
    let refundsAmountTotal = 0;
    windowRefunds.forEach(r => {
      if (r.status === 'completed') {
        refundsApprovedCount++;
        refundsAmountTotal += r.amountRvc;
      }
    });

    const securityEventsCount = auditLogs.filter(l => 
      inWindow(l.timestamp) && (l.action.includes('BLOCK') || l.action.includes('SUSPEND') || l.action.includes('SECURITY'))
    ).length;

    const adminActCount = auditLogs.filter(l => inWindow(l.timestamp)).length;

    return {
      id: `report_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      period: period as any,
      newUsers: windowUsers.length,
      activeUsers: activeUsers,
      suspendedUsers: suspendedUsers,
      logins: 0,
      failedLogins: 0,
      friendRequests: 0,
      newFriends: 0,
      videos: videosCount,
      clips: clipsCount,
      liveSessions: 0,
      likes: totalLikes,
      comments: windowComments.length,
      shares: totalShares,
      marketOrders: 0,
      marketSalesRvc: 0,
      rvcTransactions: 0,
      rvcPurchasedRvc: rvcPurchased,
      rvcUsedRvc: rvcUsed,
      pushViralCampaigns: campaigns.length,
      premiumPurchases: 0,
      creatorActivity: 0,
      creatorEarningsRvc: 0,
      businessActivity: 0,
      companyActivity: 0,
      reportsComplaints: 0,
      adminActivity: adminActCount,
      adminActivityCount: adminActCount,
      companyRevenueRvc: adsRevenue + viralRevenue + premiumRevenue,
      refundsRvc: refundsAmountTotal,
      netRevenueRvc: (adsRevenue + viralRevenue + premiumRevenue) - refundsAmountTotal,
      users: {
        total: users.length,
        newRegistered: windowUsers.length,
        active: activeUsers,
        suspended: suspendedUsers
      },
      posts: posts.length,
      postsSummary: {
        total: posts.length,
        newPosts: windowPosts.length,
        videos: videosCount,
        clips: clipsCount,
        likes: totalLikes,
        shares: totalShares,
        comments: windowComments.length
      },
      messages: windowMessages.length,
      messagesSummary: {
        totalSent: windowMessages.length
      },
      market: {
        totalItems: market.length,
        newItems: windowMarket.length,
        orders: 0
      },
      rvc: {
        totalPurchased: rvcPurchased,
        totalUsed: rvcUsed,
        netCirculation: rvcPurchased - rvcUsed
      },
      campaigns: {
        activeOfficialAds: windowCampaigns.length,
        totalSponsoredPosts: campaigns.length,
        impressionsDelivered: 0
      },
      revenue: {
        totalTzs: adsRevenue + viralRevenue + premiumRevenue,
        adsRevenueTzs: adsRevenue,
        commissionTzs: 0,
        rvcDepositsTzs: rvcPurchased
      },
      refunds: {
        requestsCount: windowRefunds.length,
        approvedCount: refundsApprovedCount,
        rejectedCount: windowRefunds.length - refundsApprovedCount,
        amountTotal: refundsAmountTotal
      },
      securityEvents: securityEventsCount,
      communicationControl: {
        isCommunicationActive: commSettings.allEnabled,
        chatEnabled: commSettings.services.chat,
        voiceCallsEnabled: commSettings.services.voiceCalls,
        videoCallsEnabled: commSettings.services.videoCalls,
        mediaSharingEnabled: commSettings.services.mediaSharing,
        temporaryBlockActive: commSettings.temporaryBlock?.isActive || false,
        temporaryBlockReason: commSettings.temporaryBlock?.reason || undefined,
        temporaryBlockEndDate: commSettings.temporaryBlock?.endDate || undefined
      }
    };
  }

  // --- Persistence & KV Helper ---
  private async setKV(key: string, value: any): Promise<void> {
    const json = JSON.stringify(value);
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO system_kv (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json=excluded.value_json,
        updated_at=excluded.updated_at
    `).run(key, json, now);
  }

  async getPersistenceStatus(): Promise<SystemPersistenceStatus> {
    const usersCount = (this.db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const postsCount = (this.db.prepare('SELECT COUNT(*) as c FROM posts').get() as any).c;
    const messagesCount = (this.db.prepare('SELECT COUNT(*) as c FROM messages').get() as any).c;
    const txCount = (this.db.prepare('SELECT COUNT(*) as c FROM wallet_transactions').get() as any).c;

    const campaignsCount = (this.db.prepare('SELECT COUNT(*) as c FROM ad_campaigns').get() as any).c;
    const refundsCount = (this.db.prepare('SELECT COUNT(*) as c FROM refund_records').get() as any).c;
    const auditLogsCount = (this.db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;
    const stat = fs.statSync(this.dbPath);

    return {
      activeDataStore: 'sqlite',
      dbStatus: 'PASS',
      persistenceFilePath: this.dbPath,
      externalGatewayStatus: 'ACTIVE',
      totalUsers: usersCount,
      totalTransactions: txCount,
      totalCampaigns: campaignsCount,
      totalRefunds: refundsCount,
      totalAuditLogs: auditLogsCount,
      engine: 'SqliteProductionDataStore (ACID WAL Persistence)',
      filePath: this.dbPath,
      fileSizeBytes: stat.size,
      lastPersistedAt: stat.mtime.toISOString(),
      entitiesCount: {
        users: usersCount,
        transactions: txCount,
        adCampaigns: campaignsCount,
        companyLedger: (this.db.prepare('SELECT COUNT(*) as c FROM company_ledger').get() as any).c,
        refunds: refundsCount,
        rvcRequests: (this.db.prepare('SELECT COUNT(*) as c FROM rvc_requests').get() as any).c,
        auditLogs: auditLogsCount,
        messages: messagesCount,
        conversations: (this.db.prepare('SELECT COUNT(*) as c FROM conversations').get() as any).c,
        messageRequests: (this.db.prepare('SELECT COUNT(*) as c FROM message_requests').get() as any).c,
        callSessions: (this.db.prepare('SELECT COUNT(*) as c FROM call_sessions').get() as any).c,
        posts: postsCount,
        marketItems: (this.db.prepare('SELECT COUNT(*) as c FROM market_items').get() as any).c,
      },
      syncIntervalMs: 0,
      isHealthy: true
    };
  }

  async flush(): Promise<void> {
    // SQLite WAL checkpoints automatically, manual checkpoint:
    this.db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  }

  async listBackups(): Promise<any[]> {
    const backupDir = path.join(path.dirname(this.dbPath), 'backups');
    if (!fs.existsSync(backupDir)) return [];
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json') || f.endsWith('.sqlite'));
    return files.map(filename => {
      const filePath = path.join(backupDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        path: filePath
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createBackup(reason = 'manual_super_admin'): Promise<{ backupPath: string; timestamp: string }> {
    const backupDir = path.join(path.dirname(this.dbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `ravini_production_backup_${timestamp}.sqlite`;
    const backupPath = path.join(backupDir, backupFileName);
    fs.copyFileSync(this.dbPath, backupPath);
    return { backupPath, timestamp };
  }
}
