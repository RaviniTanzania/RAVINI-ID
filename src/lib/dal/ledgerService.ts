import { AuthoritativeLedgerEntry, LedgerAccountType } from './types';
import { db } from './databaseAdapter';
import { CompanyLedgerTransaction } from '../../types';

const LEDGER_COLLECTION = 'system_authoritative_ledger';

export interface LedgerSummaryReport {
  customerWalletTotal: number;
  escrowPendingTotal: number;
  companyRevenueTotal: number;
  creatorEarningsTotal: number;
  sellerFundsTotal: number;
  refundsTotal: number;
  reconciledTotal: number;
  isBalanced: boolean;
  generatedAt: string;
}

export class LedgerService {
  /**
   * Records an authoritative double-entry movement between distinct accounts.
   */
  static async recordTransfer(params: {
    sourceAccount: LedgerAccountType;
    destinationAccount: LedgerAccountType;
    amount: number;
    currency?: 'RVC' | 'TZS';
    service: AuthoritativeLedgerEntry['service'];
    userId: string;
    userRaviniId?: string;
    userName?: string;
    referenceId: string;
    idempotencyKey?: string;
    notes?: string;
  }): Promise<AuthoritativeLedgerEntry> {
    if (params.amount <= 0) {
      throw new Error(`[LedgerService] Transfer amount must be positive. Received: ${params.amount}`);
    }

    const timestamp = new Date().toISOString();
    const id = `LDG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check idempotency if key is supplied
    if (params.idempotencyKey) {
      const existing = await db.list<AuthoritativeLedgerEntry>(LEDGER_COLLECTION, 
        entry => entry.idempotencyKey === params.idempotencyKey
      );
      if (existing.length > 0) {
        return existing[0];
      }
    }

    const entry: AuthoritativeLedgerEntry = {
      id,
      sourceAccount: params.sourceAccount,
      destinationAccount: params.destinationAccount,
      amount: params.amount,
      currency: params.currency || 'RVC',
      service: params.service,
      userId: params.userId,
      userRaviniId: params.userRaviniId,
      userName: params.userName,
      referenceId: params.referenceId,
      idempotencyKey: params.idempotencyKey,
      status: 'completed',
      notes: params.notes,
      timestamp,
    };

    await db.set(LEDGER_COLLECTION, entry.id, entry);

    // Synchronize to company ledger storage if affecting company revenue or refunds
    if (params.destinationAccount === 'company_revenue' || params.sourceAccount === 'company_revenue' || params.service === 'refund') {
      try {
        const raw = localStorage.getItem('ravini_company_ledger_v1');
        const list: CompanyLedgerTransaction[] = raw ? JSON.parse(raw) : [];
        const isRevenueIncome = params.destinationAccount === 'company_revenue';
        
        const serviceMapping: CompanyLedgerTransaction['service'] = 
          params.service === 'market_commission' ? 'market_commission' : 
          params.service === 'refund' ? 'refund' : 
          params.service === 'ads' ? 'ads' : 
          'other';

        const relatedTypeMapping: CompanyLedgerTransaction['relatedType'] = 
          params.service === 'ads' ? 'campaign' : 
          params.service === 'market_commission' ? 'order' : 
          'manual';

        list.unshift({
          id: `TXN-REV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: params.userId,
          userRaviniId: params.userRaviniId || params.userId,
          userName: params.userName || 'Mtumiaji',
          service: serviceMapping,
          amount: isRevenueIncome ? params.amount : -params.amount,
          currency: 'RVC',
          type: isRevenueIncome ? 'income' : 'refund',
          status: 'completed',
          timestamp,
          reference: params.referenceId,
          relatedId: params.referenceId,
          relatedType: relatedTypeMapping,
          refundStatus: params.service === 'refund' ? 'completed' : 'none',
          idempotencyKey: params.idempotencyKey,
        });

        localStorage.setItem('ravini_company_ledger_v1', JSON.stringify(list.slice(0, 1000)));
      } catch (e) {
        console.error('[LedgerService] Mirroring to company ledger failed:', e);
      }
    }

    return entry;
  }

  /**
   * Generates a strict reconciliation audit report across all segregated accounts.
   */
  static async getReconciliationReport(): Promise<LedgerSummaryReport> {
    const all = await db.list<AuthoritativeLedgerEntry>(LEDGER_COLLECTION);
    
    let customerWalletTotal = 0;
    let escrowPendingTotal = 0;
    let companyRevenueTotal = 0;
    let creatorEarningsTotal = 0;
    let sellerFundsTotal = 0;
    let refundsTotal = 0;

    for (const entry of all) {
      if (entry.status !== 'completed') continue;

      // Handle Destination Credit (+)
      switch (entry.destinationAccount) {
        case 'customer_wallet': customerWalletTotal += entry.amount; break;
        case 'escrow_pending': escrowPendingTotal += entry.amount; break;
        case 'company_revenue': companyRevenueTotal += entry.amount; break;
        case 'creator_earnings': creatorEarningsTotal += entry.amount; break;
        case 'seller_funds': sellerFundsTotal += entry.amount; break;
        case 'refunds_pool': refundsTotal += entry.amount; break;
      }

      // Handle Source Debit (-)
      switch (entry.sourceAccount) {
        case 'customer_wallet': customerWalletTotal -= entry.amount; break;
        case 'escrow_pending': escrowPendingTotal -= entry.amount; break;
        case 'company_revenue': companyRevenueTotal -= entry.amount; break;
        case 'creator_earnings': creatorEarningsTotal -= entry.amount; break;
        case 'seller_funds': sellerFundsTotal -= entry.amount; break;
        case 'refunds_pool': refundsTotal -= entry.amount; break;
      }
    }

    // Mathematical balance assertion: sum of all net positions across closed system
    const netSum = customerWalletTotal + escrowPendingTotal + companyRevenueTotal + creatorEarningsTotal + sellerFundsTotal + refundsTotal;

    return {
      customerWalletTotal: Math.max(0, customerWalletTotal),
      escrowPendingTotal: Math.max(0, escrowPendingTotal),
      companyRevenueTotal: Math.max(0, companyRevenueTotal),
      creatorEarningsTotal: Math.max(0, creatorEarningsTotal),
      sellerFundsTotal: Math.max(0, sellerFundsTotal),
      refundsTotal: Math.abs(refundsTotal),
      reconciledTotal: netSum,
      isBalanced: Math.abs(netSum) < 1, // Double-entry zero-sum delta
      generatedAt: new Date().toISOString()
    };
  }
}
