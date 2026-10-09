import { User, WalletTransaction, RvcDepositRequest } from '../../types';
import { db } from './databaseAdapter';
import { LedgerService } from './ledgerService';
import { AuditService } from './auditService';
import { TransactionVerificationResult } from './types';

const WALLET_TX_COLLECTION = 'wallet_transactions';
const USERS_COLLECTION = 'system_users';

export class TransactionManager {
  /**
   * Executes an atomic RVC wallet transfer between two verified users.
   */
  static async executeTransfer(params: {
    senderUser: User;
    recipientUserId: string;
    amount: number;
    note?: string;
    idempotencyKey?: string;
  }): Promise<TransactionVerificationResult> {
    const { senderUser, recipientUserId, amount, note, idempotencyKey } = params;

    // 1. Authoritative Parameter Validation
    if (!senderUser || !senderUser.id) {
      return { success: false, message: 'Mtumiaji hajatambuliwa (Unauthorized).', errorCode: 'UNAUTHORIZED' };
    }
    if (senderUser.id === recipientUserId) {
      return { success: false, message: 'Huwezi kujitumia RVC wewe mwenyewe.', errorCode: 'INVALID_PARAMS' };
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Kiasi cha kuhamisha lazima kiwe namba halisi zaidi ya 0.', errorCode: 'INVALID_PARAMS' };
    }

    // 2. Check Idempotency Key to prevent double-spend
    if (idempotencyKey) {
      const existingTx = await db.list<WalletTransaction>(WALLET_TX_COLLECTION, tx => tx.reference === idempotencyKey);
      if (existingTx.length > 0) {
        return {
          success: true,
          message: 'Muamala huu ulikwishatekelezwa kikamilifu.',
          transaction: existingTx[0]
        };
      }
    }

    // 3. Run inside Atomic DB Transaction
    try {
      return await db.runTransaction(async (ctx) => {
        // Fetch fresh sender and recipient from DB
        const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
        const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
        
        const sender = users.find(u => u.id === senderUser.id);
        const recipient = users.find(u => u.id === recipientUserId || u.raviniId === recipientUserId);

        if (!sender) {
          return { success: false, message: 'Akaunti ya mtumaji haikupatikana.', errorCode: 'UNAUTHORIZED' };
        }
        if (!recipient) {
          return { success: false, message: 'Mpokeaji hakupatikana kwenye mfumo wa RAVINI.', errorCode: 'INVALID_PARAMS' };
        }

        // Authoritative Balance Verification
        if ((sender.walletBalance || 0) < amount) {
          return {
            success: false,
            message: `Salio halitoshi. Una RVC ${(sender.walletBalance || 0).toLocaleString()}, unahitaji RVC ${amount.toLocaleString()}.`,
            errorCode: 'INSUFFICIENT_BALANCE'
          };
        }

        // Atomic Balance Update
        const senderPrev = sender.walletBalance;
        const recipientPrev = recipient.walletBalance;

        sender.walletBalance = senderPrev - amount;
        recipient.walletBalance = (recipientPrev || 0) + amount;

        // Persist updated users
        localStorage.setItem('ravini_users_permanent_v3', JSON.stringify(users));

        const now = new Date().toISOString();
        const txRef = idempotencyKey || `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create sender transaction (debit)
        const debitTx: WalletTransaction = {
          id: `tx_${Date.now()}_send`,
          userId: sender.id,
          type: 'transfer',
          amount: -amount,
          description: `Kutuma RVC kwa ${recipient.name}${note ? ` (${note})` : ''}`,
          createdAt: now,
          status: 'completed',
          reference: txRef
        };

        // Create recipient transaction (credit)
        const creditTx: WalletTransaction = {
          id: `tx_${Date.now()}_recv`,
          userId: recipient.id,
          type: 'transfer',
          amount: amount,
          description: `Kupokea RVC kutoka kwa ${sender.name}${note ? ` (${note})` : ''}`,
          createdAt: now,
          status: 'completed',
          reference: txRef
        };

        // Persist transactions in DAL
        await ctx.set(WALLET_TX_COLLECTION, debitTx.id, debitTx);
        await ctx.set(WALLET_TX_COLLECTION, creditTx.id, creditTx);

        // Sync legacy transaction key
        const rawTx = localStorage.getItem('ravini_transactions_permanent_v3');
        const legacyTxList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
        legacyTxList.unshift(creditTx);
        legacyTxList.unshift(debitTx);
        localStorage.setItem('ravini_transactions_permanent_v3', JSON.stringify(legacyTxList.slice(0, 1000)));

        // Record in Double-Entry Ledger
        const ledgerEntry = await LedgerService.recordTransfer({
          sourceAccount: 'customer_wallet',
          destinationAccount: 'customer_wallet',
          amount,
          service: 'payout',
          userId: sender.id,
          userRaviniId: sender.raviniId,
          userName: sender.name,
          referenceId: txRef,
          idempotencyKey,
          notes: `Transfer from ${sender.name} to ${recipient.name}: ${note || 'Direct transfer'}`
        });

        // Immutable Audit Record
        await AuditService.record({
          actor: sender,
          action: 'WALLET_TRANSFER',
          target: recipient.name,
          targetId: recipient.id,
          details: `Uhamisho wa RVC ${amount.toLocaleString()} kutoka ${sender.name} kwenda kwa ${recipient.name}. Kumbukumbu: ${txRef}`,
          beforeValue: { senderBalance: senderPrev, recipientBalance: recipientPrev },
          afterValue: { senderBalance: sender.walletBalance, recipientBalance: recipient.walletBalance }
        });

        return {
          success: true,
          message: `Umefanikiwa kuhamisha RVC ${amount.toLocaleString()} kwa ${recipient.name}.`,
          transaction: debitTx,
          ledgerEntry
        };
      });
    } catch (err: any) {
      console.error('[TransactionManager] Transfer error:', err);
      return { success: false, message: `Hitilafu ya kimuamala: ${err?.message || 'Imeshindikana kukamilisha'}`, errorCode: 'INVALID_PARAMS' };
    }
  }

  /**
   * Evaluates an external instant deposit attempt.
   * STRICT REAL-DATA ENFORCEMENT:
   * External payment gateways (M-Pesa API, Tigo Pesa API, Bank switch) are unconfigured.
   * Returns BLOCKED / NOT CONFIGURED instead of simulating fake balance.
   */
  static attemptExternalTopup(params: {
    userId: string;
    amount: number;
    provider: string;
  }): TransactionVerificationResult {
    // Audit Requirement 10: DO NOT SIMULATE UNCONFIGURED EXTERNAL GATEWAYS
    return {
      success: false,
      errorCode: 'SERVICE_BLOCKED',
      message: `BLOCKED / NOT CONFIGURED: Muunganisho wa moja kwa moja wa lango la malipo ya benki/mitandao (${params.provider} API) haujawezeshwa katika seva hii ya uzalishaji. Tafadhali tumia mfumo rasmi wa "Wasilisha Ombi la RVC" (Manual Deposit Request) kwa kuambatanisha namba ya kumbukumbu ya malipo ili yakaguliwe na kuidhinishwa na Wasimamizi wa Fedha.`
    };
  }

  /**
   * Approves a verified manual deposit request with server-side authorization check.
   */
  static async approveManualDeposit(params: {
    adminActor: User;
    depositRequestId: string;
    adminNotes?: string;
  }): Promise<TransactionVerificationResult> {
    const { adminActor, depositRequestId, adminNotes } = params;

    // 1. Authorize Actor
    const isSuper = adminActor.role === 'super_admin';
    const hasPerm = Array.isArray(adminActor.permissions) && (
      adminActor.permissions.includes('WALLET_MANAGE' as any) || 
      adminActor.permissions.includes('SUPER_ADMIN' as any)
    );

    if (!isSuper && !hasPerm) {
      return {
        success: false,
        message: 'Huna kibali cha kuidhinisha amana za RVC. Ruhusa ya WALLET_MANAGE inahitajika.',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // 2. Fetch Deposit Request
    const rawReqs = localStorage.getItem('ravini_rvc_requests_permanent_v3');
    const requests: RvcDepositRequest[] = rawReqs ? JSON.parse(rawReqs) : [];
    const req = requests.find(r => r.id === depositRequestId);

    if (!req) {
      return { success: false, message: 'Ombi la amana halikupatikana.', errorCode: 'INVALID_PARAMS' };
    }
    if (req.status !== 'pending') {
      return { success: false, message: `Ombi hili lilikwishafanyiwa uamuzi (${req.status}).`, errorCode: 'INVALID_PARAMS' };
    }

    // 3. Atomically Credit Customer Wallet
    const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
    const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return { success: false, message: 'Mtumiaji anayeombewa amana hakupatikana.', errorCode: 'INVALID_PARAMS' };
    }

    const prevBalance = user.walletBalance || 0;
    user.walletBalance = prevBalance + req.amount;
    localStorage.setItem('ravini_users_permanent_v3', JSON.stringify(users));

    // Update Request Status
    req.status = 'approved';
    req.approvedAt = new Date().toISOString();
    req.approvedBy = `${adminActor.name} (${isSuper ? 'Super Admin' : 'Admin'})`;
    localStorage.setItem('ravini_rvc_requests_permanent_v3', JSON.stringify(requests));

    // Create Wallet Credit Transaction
    const creditTx: WalletTransaction = {
      id: `tx_${Date.now()}_dep_app`,
      userId: user.id,
      type: 'topup',
      amount: req.amount,
      description: `Amana ya RVC iliyothibitishwa kupitia ${req.paymentMethod.toUpperCase()} (Ref: ${req.paymentReference})`,
      createdAt: new Date().toISOString(),
      status: 'completed',
      reference: req.id,
    };

    const rawTx = localStorage.getItem('ravini_transactions_permanent_v3');
    const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
    txList.unshift(creditTx);
    localStorage.setItem('ravini_transactions_permanent_v3', JSON.stringify(txList.slice(0, 1000)));

    // Record in Segregated Ledger
    const ledgerEntry = await LedgerService.recordTransfer({
      sourceAccount: 'seller_funds', // Inbound verified liquidity
      destinationAccount: 'customer_wallet',
      amount: req.amount,
      service: 'deposit_fee',
      userId: user.id,
      userRaviniId: user.raviniId,
      userName: user.name,
      referenceId: req.id,
      notes: `Verified deposit approved by ${adminActor.name}. Ref: ${req.paymentReference}`
    });

    // Immutable Audit Log
    await AuditService.record({
      actor: adminActor,
      action: 'WALLET_CREDIT',
      target: user.name,
      targetId: user.id,
      details: `Amana ya RVC ${req.amount.toLocaleString()} imeidhinishwa kwa mtumiaji ${user.name}. Njia: ${req.paymentMethod}, Kumbukumbu: ${req.paymentReference}`,
      beforeValue: { walletBalance: prevBalance },
      afterValue: { walletBalance: user.walletBalance },
      reason: adminNotes || 'Uthibitisho wa stakabadhi ya malipo'
    });

    return {
      success: true,
      message: `Amana ya RVC ${req.amount.toLocaleString()} imeidhinishwa kwa mafanikio kwa ${user.name}.`,
      transaction: creditTx,
      ledgerEntry
    };
  }
}
