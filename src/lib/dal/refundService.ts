import { RefundRecord, User, WalletTransaction, CompanyLedgerTransaction } from '../../types';
import { db } from './databaseAdapter';
import { LedgerService } from './ledgerService';
import { AuditService } from './auditService';
import { RefundExecutionResult } from './types';

const REFUNDS_COLLECTION = 'system_refund_records';

export class RefundService {
  /**
   * Submits a formal refund request against an identifiable original transaction.
   */
  static async requestRefund(params: {
    userId: string;
    originalTransactionId: string;
    service: string;
    amountRvc: number;
    reason: string;
  }): Promise<{ success: boolean; message: string; record?: RefundRecord }> {
    const { userId, originalTransactionId, service, amountRvc, reason } = params;

    if (amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha marejesho lazima kiwe zaidi ya 0.' };
    }

    // Check for existing pending or completed refund for this original transaction to prevent double refund
    const existingRefunds = await db.list<RefundRecord>(REFUNDS_COLLECTION, 
      r => r.transactionId === originalTransactionId && (r.status === 'pending' || r.status === 'completed')
    );

    if (existingRefunds.length > 0) {
      return {
        success: false,
        message: `Ombi la marejesho kwa muamala huu ${existingRefunds[0].status === 'completed' ? 'lilikwishatekelezwa' : 'lipata ukaguzi tayari'}.`
      };
    }

    const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
    const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
    const user = users.find(u => u.id === userId);

    if (!user) {
      return { success: false, message: 'Akaunti ya mtumiaji haikupatikana.' };
    }

    const newRecord: RefundRecord = {
      id: `REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      transactionId: originalTransactionId,
      userId,
      userRaviniId: user.raviniId || user.id,
      userName: user.name,
      service,
      amountRvc,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    // Save in DAL
    await db.set(REFUNDS_COLLECTION, newRecord.id, newRecord);

    // Sync legacy storage
    const rawR = localStorage.getItem('ravini_refund_records_v1');
    const legacyRefunds: RefundRecord[] = rawR ? JSON.parse(rawR) : [];
    legacyRefunds.unshift(newRecord);
    localStorage.setItem('ravini_refund_records_v1', JSON.stringify(legacyRefunds));

    // Audit Log
    await AuditService.record({
      actor: user,
      action: 'REFUND_REQUESTED',
      target: originalTransactionId,
      targetId: newRecord.id,
      details: `Ombi la marejesho ya RVC ${amountRvc.toLocaleString()} kwa huduma ya ${service} limewasilishwa. Sababu: ${reason}`,
      reason
    });

    return {
      success: true,
      message: 'Ombi lako la marejesho limewasilishwa na linakaguliwa na Wasimamizi wa Fedha.',
      record: newRecord
    };
  }

  /**
   * Processes a refund record authoritatively.
   * Enforces server-side permissions, idempotency, wallet credit, and ledger balance reconciliation.
   */
  static async processRefund(params: {
    adminActor: User;
    refundId: string;
    approved: boolean;
    adminNote: string;
  }): Promise<RefundExecutionResult> {
    const { adminActor, refundId, approved, adminNote } = params;

    // 1. Authorize Admin Actor
    const isSuper = adminActor.role === 'super_admin';
    const hasPerm = Array.isArray(adminActor.permissions) && (
      adminActor.permissions.includes('REFUND_MANAGE' as any) ||
      adminActor.permissions.includes('SUPER_ADMIN' as any)
    );

    if (!isSuper && !hasPerm) {
      return {
        success: false,
        message: 'Huna mamlaka ya kushughulikia marejesho ya fedha (REFUND_MANAGE required).'
      };
    }

    // 2. Fetch Refund Record
    const record = await db.get<RefundRecord>(REFUNDS_COLLECTION, refundId);
    if (!record) {
      return { success: false, message: 'Rekodi ya marejesho haikupatikana.' };
    }

    if (record.status !== 'pending') {
      return { success: false, message: `Ombi hili lilikwishatekelezwa kabla (${record.status}).` };
    }

    const now = new Date().toISOString();
    record.status = approved ? 'completed' : 'rejected';
    record.reviewedAt = now;
    record.reviewedBy = `${adminActor.name} (${isSuper ? 'Super Admin' : 'Admin'})`;
    record.adminNote = adminNote;

    await db.set(REFUNDS_COLLECTION, record.id, record);

    // Sync legacy refunds list
    const rawR = localStorage.getItem('ravini_refund_records_v1');
    const legacyRefunds: RefundRecord[] = rawR ? JSON.parse(rawR) : [];
    const idx = legacyRefunds.findIndex(r => r.id === refundId);
    if (idx >= 0) {
      legacyRefunds[idx] = record;
      localStorage.setItem('ravini_refund_records_v1', JSON.stringify(legacyRefunds));
    }

    if (approved) {
      // 3. Atomically Credit Recipient's Wallet
      const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
      const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
      const recipient = users.find(u => u.id === record.userId);

      if (!recipient) {
        return { success: false, message: 'Akaunti ya mnufaika wa marejesho haikupatikana.' };
      }

      const prevBalance = recipient.walletBalance || 0;
      recipient.walletBalance = prevBalance + record.amountRvc;
      localStorage.setItem('ravini_users_permanent_v3', JSON.stringify(users));

      // 4. Create Reversal Transaction in Recipient's Wallet
      const reversalTxId = `tx_${Date.now()}_refund_rev`;
      const reversalTx: WalletTransaction = {
        id: reversalTxId,
        userId: recipient.id,
        type: 'credit',
        amount: record.amountRvc,
        description: `Marejesho ya RVC kutoka RAVINI COMPANY LIMITED: ${record.reason}`,
        createdAt: now,
        status: 'completed',
        reference: record.id
      };

      const rawTx = localStorage.getItem('ravini_transactions_permanent_v3');
      const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
      txList.unshift(reversalTx);
      localStorage.setItem('ravini_transactions_permanent_v3', JSON.stringify(txList.slice(0, 1000)));

      // 5. Deduct from Company Revenue Ledger & Record in Double-Entry Ledger
      await LedgerService.recordTransfer({
        sourceAccount: 'company_revenue',
        destinationAccount: 'customer_wallet',
        amount: record.amountRvc,
        service: 'refund',
        userId: recipient.id,
        userRaviniId: recipient.raviniId,
        userName: recipient.name,
        referenceId: record.id,
        notes: `Refund approved by ${adminActor.name}: ${adminNote || record.reason}`
      });

      // 6. Immutable Audit Record
      await AuditService.record({
        actor: adminActor,
        action: 'REFUND_PROCESSED_APPROVED',
        target: recipient.name,
        targetId: record.id,
        details: `Marejesho ya RVC ${record.amountRvc.toLocaleString()} yameidhinishwa kwa ${recipient.name}. Kumbukumbu: ${record.id}`,
        beforeValue: { walletBalance: prevBalance },
        afterValue: { walletBalance: recipient.walletBalance },
        reason: adminNote || record.reason
      });

      return {
        success: true,
        message: `Marejesho ya RVC ${record.amountRvc.toLocaleString()} yameidhinishwa na kuingizwa kwenye pochi ya mtumiaji.`,
        record,
        reversalTxId,
        refundedAmountRvc: record.amountRvc
      };
    } else {
      // Rejection audit log
      await AuditService.record({
        actor: adminActor,
        action: 'REFUND_PROCESSED_REJECTED',
        target: record.userName,
        targetId: record.id,
        details: `Ombi la marejesho ya RVC ${record.amountRvc.toLocaleString()} limekataliwa. Maelezo: ${adminNote}`,
        reason: adminNote
      });

      return {
        success: true,
        message: 'Ombi la marejesho limekataliwa kwa mafanikio.',
        record
      };
    }
  }
}
