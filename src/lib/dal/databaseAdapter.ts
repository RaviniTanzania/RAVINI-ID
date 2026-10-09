/**
 * RAVINI Database Adapter & Migration Abstraction Layer
 * Supports LocalStorage Engine for Development / Offline and provides
 * a strict migration bridge to PostgreSQL / Cloud SQL / Firestore.
 */

export interface TransactionContext {
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T>(collection: string, id: string, data: T): Promise<void>;
  delete(collection: string, id: string): Promise<boolean>;
  list<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]>;
}

export interface IDatabaseAdapter {
  readonly name: string;
  readonly isCloudAuthoritative: boolean;
  initialize(): Promise<boolean>;
  get<T>(collection: string, id: string): Promise<T | null>;
  list<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]>;
  set<T>(collection: string, id: string, data: T): Promise<void>;
  delete(collection: string, id: string): Promise<boolean>;
  runTransaction<R>(fn: (ctx: TransactionContext) => Promise<R>): Promise<R>;
  checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'blocked'; details: string }>;
}

export class LocalStorageDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'RAVINI LocalStorage Persistence Engine';
  readonly isCloudAuthoritative = false;
  private prefix = 'ravini_dal_';
  private transactionLock = false;

  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private getKey(collection: string, id?: string): string {
    return id ? `${this.prefix}${collection}_${id}` : `${this.prefix}${collection}`;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    try {
      const items = await this.list<T & { id: string }>(collection);
      const found = items.find(item => item.id === id);
      return (found as T) || null;
    } catch (e) {
      console.error(`[DAL] Failed to read ${collection}/${id}:`, e);
      return null;
    }
  }

  async list<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> {
    try {
      const raw = localStorage.getItem(this.getKey(collection));
      if (!raw) return [];
      const items: T[] = JSON.parse(raw);
      return filter ? items.filter(filter) : items;
    } catch (e) {
      console.error(`[DAL] Failed to list ${collection}:`, e);
      return [];
    }
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    try {
      const items = await this.list<any>(collection);
      const index = items.findIndex(item => item.id === id);
      const itemWithId = { ...data, id };
      if (index >= 0) {
        items[index] = itemWithId;
      } else {
        items.unshift(itemWithId);
      }
      localStorage.setItem(this.getKey(collection), JSON.stringify(items));
    } catch (e) {
      console.error(`[DAL] Failed to write ${collection}/${id}:`, e);
      throw e;
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    try {
      const items = await this.list<any>(collection);
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length !== items.length) {
        localStorage.setItem(this.getKey(collection), JSON.stringify(filtered));
        return true;
      }
      return false;
    } catch (e) {
      console.error(`[DAL] Failed to delete ${collection}/${id}:`, e);
      return false;
    }
  }

  async runTransaction<R>(fn: (ctx: TransactionContext) => Promise<R>): Promise<R> {
    // Acquire mutex lock
    while (this.transactionLock) {
      await new Promise(r => setTimeout(r, 15));
    }
    this.transactionLock = true;

    // Snapshot current state for rollback safety
    const stagedWrites: Array<{ collection: string; id: string; data: any; isDelete?: boolean }> = [];
    const readCache: Map<string, any[]> = new Map();

    const getStagedList = (col: string): any[] => {
      if (!readCache.has(col)) {
        const raw = localStorage.getItem(this.getKey(col));
        readCache.set(col, raw ? JSON.parse(raw) : []);
      }
      return readCache.get(col)!;
    };

    const txCtx: TransactionContext = {
      get: async <T>(collection: string, id: string): Promise<T | null> => {
        const list = getStagedList(collection);
        const item = list.find((i: any) => i.id === id);
        return (item as T) || null;
      },
      list: async <T>(collection: string, filter?: (item: T) => boolean): Promise<T[]> => {
        const list = getStagedList(collection);
        return filter ? list.filter(filter) : [...list];
      },
      set: async <T>(collection: string, id: string, data: T): Promise<void> => {
        const list = getStagedList(collection);
        const idx = list.findIndex((i: any) => i.id === id);
        const withId = { ...data, id };
        if (idx >= 0) {
          list[idx] = withId;
        } else {
          list.unshift(withId);
        }
        stagedWrites.push({ collection, id, data: withId });
      },
      delete: async (collection: string, id: string): Promise<boolean> => {
        const list = getStagedList(collection);
        const prevLen = list.length;
        const filtered = list.filter((i: any) => i.id !== id);
        readCache.set(collection, filtered);
        stagedWrites.push({ collection, id, data: null, isDelete: true });
        return filtered.length !== prevLen;
      }
    };

    try {
      const result = await fn(txCtx);
      // Atomic commit of all staged collections
      for (const [col, list] of readCache.entries()) {
        localStorage.setItem(this.getKey(col), JSON.stringify(list));
      }
      return result;
    } catch (err) {
      console.error('[DAL] Transaction rolled back due to error:', err);
      throw err;
    } finally {
      this.transactionLock = false;
    }
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'blocked'; details: string }> {
    try {
      const testKey = '__ravini_dal_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return { 
        status: 'healthy', 
        details: 'Local storage engine operational with atomic transaction support.' 
      };
    } catch (e: any) {
      return { 
        status: 'blocked', 
        details: `Local storage unavailable: ${e?.message || 'Storage quota or security restriction'}` 
      };
    }
  }
}

/**
 * Cloud Database Adapter Stub
 * Identifies if production cloud database credentials (PostgreSQL / Firestore) exist.
 * If not configured, transparently reports BLOCKED to prevent false claims of production safety.
 */
export class CloudDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'RAVINI Cloud Persistence Engine (PostgreSQL / Firestore)';
  readonly isCloudAuthoritative = true;

  async initialize(): Promise<boolean> {
    return false;
  }

  async get<T>(): Promise<T | null> {
    throw new Error('CLOUD_DB_NOT_CONFIGURED: Production cloud database credentials are not configured.');
  }

  async list<T>(): Promise<T[]> {
    throw new Error('CLOUD_DB_NOT_CONFIGURED: Production cloud database credentials are not configured.');
  }

  async set<T>(): Promise<void> {
    throw new Error('CLOUD_DB_NOT_CONFIGURED: Production cloud database credentials are not configured.');
  }

  async delete(): Promise<boolean> {
    throw new Error('CLOUD_DB_NOT_CONFIGURED: Production cloud database credentials are not configured.');
  }

  async runTransaction<R>(): Promise<R> {
    throw new Error('CLOUD_DB_NOT_CONFIGURED: Production cloud database credentials are not configured.');
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'blocked'; details: string }> {
    return {
      status: 'blocked',
      details: 'BLOCKED / NOT CONFIGURED: Cloud database (Firestore / Cloud SQL / PostgreSQL) credentials are not provisioned in this environment.'
    };
  }
}

// Singleton Database Manager
class DatabaseManager {
  private activeAdapter: IDatabaseAdapter = new LocalStorageDatabaseAdapter();
  private cloudAdapter: IDatabaseAdapter = new CloudDatabaseAdapter();

  getAdapter(): IDatabaseAdapter {
    return this.activeAdapter;
  }

  getCloudAdapter(): IDatabaseAdapter {
    return this.cloudAdapter;
  }

  async getMigrationStatus(): Promise<{
    activeEngine: string;
    isCloudReady: boolean;
    cloudStatus: string;
    blockerReason: string;
  }> {
    const cloudHealth = await this.cloudAdapter.checkHealth();
    return {
      activeEngine: this.activeAdapter.name,
      isCloudReady: cloudHealth.status === 'healthy',
      cloudStatus: cloudHealth.status.toUpperCase(),
      blockerReason: cloudHealth.details,
    };
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.getAdapter();
