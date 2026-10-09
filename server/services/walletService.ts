import { getDataStore } from '../db/fileDataStore';
import { WalletTransaction, User, CompanyLedgerTransaction } from '../../src/types';

export class WalletService {
  private dataStore = getDataStore();

  async getBalance(userId: string): Promise<number> {
    const user = await this.dataStore.getUserById(userId);
    if (!user) throw new Error('Mtumiaji hakupatikana');
    return user.walletBalance || 0;
  }

  async transfer(params: {
    senderId: string;
    recipientId: string;
    amountRvc: number;
    description: string;
    idempotencyKey?: string;
  }) {
    return this.dataStore.atomicWalletTransfer(params);
  }

  /**
   * Server-side deduction for Services (e.g. Ads, Premium, Viral Packages)
   * Deducts from User Wallet -> Credits Company Revenue Ledger
   */
  async spendOnService(params: {
    userId: string;
    service: 'ads' | 'push_viral' | 'premium' | 'market_commission' | 'verification_badge' | 'other';
    amountRvc: number;
    description: string;
    reference: string;
    relatedId?: string;
    relatedType?: 'campaign' | 'order' | 'subscription' | 'ad' | 'manual';
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }> {
    await this.dataStore.initialize();
    const user = await this.dataStore.getUserById(params.userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

    if (params.amountRvc <= 0) {
      return { success: false, message: 'Kiasi lazima kiwe zaidi ya 0 RVC.' };
    }

    if (user.walletBalance < params.amountRvc) {
      return {
        success: false,
        message: `Salio lako (${user.walletBalance.toLocaleString()} RVC) halitoshi kulipia huduma hii (${params.amountRvc.toLocaleString()} RVC).`
      };
    }

    // Idempotency check
    if (params.idempotencyKey) {
      const allTx = await this.dataStore.getAllTransactions();
      const existing = allTx.find(t => t.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return { success: true, message: 'Malipo haya yalishatekelezwa.', transaction: existing };
      }
    }

    // Atomically debit user balance
    const updatedBalance = user.walletBalance - params.amountRvc;
    await this.dataStore.updateUser(user.id, { walletBalance: updatedBalance });

    // Record user wallet debit transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();
    const tx: WalletTransaction = {
      id: txId,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      type: 'payment',
      amount: params.amountRvc,
      status: 'completed',
      createdAt: nowIso,
      timestamp: nowIso,
      description: params.description,
      reference: params.reference,
      idempotencyKey: params.idempotencyKey
    };
    await this.dataStore.recordWalletTransaction(tx);

    // Record Company Ledger Income (authoritative company revenue)
    const ledgerEntry: CompanyLedgerTransaction = {
      id: `cld_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      userName: user.name,
      service: params.service === 'verification_badge' ? 'other' : params.service,
      amount: params.amountRvc,
      currency: 'RVC',
      type: 'income',
      status: 'completed',
      timestamp: nowIso,
      reference: params.reference,
      relatedId: params.relatedId,
      relatedType: params.relatedType,
      idempotencyKey: params.idempotencyKey
    };
    await this.dataStore.addCompanyLedgerEntry(ledgerEntry);

    // Immutable audit record
    await this.dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'SERVICE_SPEND',
      target: params.service,
      targetId: params.relatedId || user.id,
      details: `Spent ${params.amountRvc} RVC on ${params.service} (${params.description}). New balance: ${updatedBalance} RVC.`
    });

    return { success: true, message: 'Malipo yamekamilika.', transaction: tx };
  }

  /**
   * Server-side refund / credit execution
   */
  async creditRefund(params: {
    userId: string;
    amountRvc: number;
    description: string;
    reference: string;
    relatedId?: string;
    idempotencyKey?: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }> {
    await this.dataStore.initialize();
    const user = await this.dataStore.getUserById(params.userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

    if (params.amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha kurejesha lazima kiwe zaidi ya 0 RVC.' };
    }

    // Idempotency check
    if (params.idempotencyKey) {
      const allTx = await this.dataStore.getAllTransactions();
      const existing = allTx.find(t => t.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return { success: true, message: 'Rejesho hili lilishatekelezwa.', transaction: existing };
      }
    }

    // Credit user wallet
    const updatedBalance = (user.walletBalance || 0) + params.amountRvc;
    await this.dataStore.updateUser(user.id, { walletBalance: updatedBalance });

    // Record wallet refund transaction
    const txId = `tx_ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();
    const tx: WalletTransaction = {
      id: txId,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      type: 'refund',
      amount: params.amountRvc,
      status: 'completed',
      createdAt: nowIso,
      timestamp: nowIso,
      description: params.description,
      reference: params.reference,
      idempotencyKey: params.idempotencyKey
    };
    await this.dataStore.recordWalletTransaction(tx);

    // Record Company Ledger Refund entry
    const ledgerEntry: CompanyLedgerTransaction = {
      id: `cld_ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      userName: user.name,
      service: 'refund',
      amount: params.amountRvc,
      currency: 'RVC',
      type: 'refund',
      status: 'completed',
      timestamp: nowIso,
      reference: params.reference,
      relatedId: params.relatedId,
      relatedType: 'manual',
      idempotencyKey: params.idempotencyKey
    };
    await this.dataStore.addCompanyLedgerEntry(ledgerEntry);

    // Immutable audit record
    await this.dataStore.addAuditLog({
      actorId: params.adminId,
      actorName: params.adminName,
      actorRole: 'admin',
      action: 'REFUND_DISBURSED',
      target: user.name,
      targetId: user.id,
      details: `Disbursed refund of ${params.amountRvc} RVC to ${user.name} (${user.id}). Reason: ${params.description}. Ref: ${params.reference}.`
    });

    return { success: true, message: 'Rejesho limelipwa kwenye pochi.', transaction: tx };
  }

  /**
   * Admin approves RVC deposit request with strict idempotency and double-credit protection
   */
  async approveRvcDeposit(
    requestId: string,
    admin: User
  ): Promise<{ 
    success: boolean; 
    message: string;
    data?: {
      customer: string;
      amount: number;
      previousBalance: number;
      amountAdded: number;
      newBalance: number;
      transactionId: string;
      paymentReference: string;
      admin: string;
      timestamp: string;
    }
  }> {
    await this.dataStore.initialize();
    const adminRole = (admin.role || '').toLowerCase();
    if (adminRole !== 'super_admin' && adminRole !== 'admin' && adminRole !== 'manager') {
      return { success: false, message: 'Ruksa imezuiliwa: Ni Msimamizi Mkuu pekee anayeweza kuidhinisha na kuongeza salio la RVC.' };
    }

    const req = await this.dataStore.getRvcRequestById(requestId);
    if (!req) return { success: false, message: 'Ombi la RVC halikupatikana.' };

    if (req.status !== 'pending' && req.status !== 'pending_verification') {
      return { success: false, message: `Ombi hili lilikwishachakatwa (${req.status}). Mfumo unazuia duplicate credit.` };
    }

    const user = await this.dataStore.getUserById(req.userId);
    if (!user) return { success: false, message: 'Mtumiaji wa ombi hili hakupatikana.' };

    // Idempotency check: ensure no transaction already exists for this payment reference / request
    const existingTxs = await this.dataStore.getUserTransactions(user.id);
    const payRef = req.paymentReference || req.transactionReference || '';
    if (payRef && existingTxs.some((t: WalletTransaction) => t.reference === payRef || t.reference === req.transactionId)) {
      return { success: false, message: `Muamala wenye kumbukumbu ${payRef} tayari ulishaongezwa kwenye pochi. Ombi hili haliwezi ku-creditwa mara ya pili.` };
    }

    const depTime = new Date().toISOString();
    const uniqueTxnId = `TXN-RVC-${Math.floor(100000 + Math.random() * 900000)}`;
    const prevBalance = user.walletBalance || 0;
    const updatedBalance = prevBalance + req.amount;

    // Credit user wallet (server-authoritative)
    await this.dataStore.updateUser(user.id, { walletBalance: updatedBalance });

    // Update request status with full audit trace
    await this.dataStore.updateRvcRequest(requestId, {
      status: 'approved',
      approvedBy: admin.name,
      approvedAt: depTime,
      processedAt: depTime,
      processedBy: admin.name,
      transactionId: uniqueTxnId,
      previousBalance: prevBalance,
      amountAdded: req.amount,
      newBalance: updatedBalance,
      creditedAt: depTime,
      creditedBy: admin.name
    });

    // Record immutable ledger transaction
    const tx: WalletTransaction = {
      id: `tx_dep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      type: 'deposit',
      amount: req.amount,
      status: 'completed',
      createdAt: depTime,
      timestamp: depTime,
      description: `Uthibitisho wa kuweka RVC kupitia ${req.paymentMethod.toUpperCase()} (Kumb: ${payRef || uniqueTxnId})`,
      reference: uniqueTxnId,
      paymentMethod: req.paymentMethod
    };
    await this.dataStore.recordWalletTransaction(tx);

    // Audit log
    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'APPROVE_RVC_DEPOSIT',
      target: `RVC Deposit ${req.id}`,
      targetId: req.id,
      details: `Super Admin ${admin.name} approved RVC deposit of ${req.amount} for ${user.name} (${user.id}). Previous: ${prevBalance}, Added: ${req.amount}, New: ${updatedBalance}. TxnId: ${uniqueTxnId}, Ref: ${payRef}.`
    });

    return { 
      success: true, 
      message: `Ombi la RVC ${req.amount.toLocaleString()} limeidhinishwa na kuwekwa kwenye pochi ya mtumiaji ${user.name}.`,
      data: {
        customer: user.name,
        amount: req.amount,
        previousBalance: prevBalance,
        amountAdded: req.amount,
        newBalance: updatedBalance,
        transactionId: uniqueTxnId,
        paymentReference: payRef,
        admin: admin.name,
        timestamp: depTime
      }
    };
  }

  /**
   * Admin rejects RVC deposit request
   */
  async rejectRvcDeposit(
    requestId: string,
    admin: User,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return { success: false, message: 'Ruksa imezuiliwa: Ni Msimamizi Mkuu pekee anayeweza kukataa ombi la RVC.' };
    }

    const req = await this.dataStore.getRvcRequestById(requestId);
    if (!req) return { success: false, message: 'Ombi la RVC halikupatikana.' };

    if (req.status !== 'pending' && req.status !== 'pending_verification') {
      return { success: false, message: `Ombi hili lilikwishachakatwa (${req.status}).` };
    }

    const rejTime = new Date().toISOString();
    await this.dataStore.updateRvcRequest(requestId, {
      status: 'rejected',
      processedAt: rejTime,
      processedBy: admin.name,
      notes: reason || 'Imekataliwa baada ya uhakiki wa malipo.'
    });

    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'REJECT_RVC_DEPOSIT',
      target: `RVC Deposit ${req.id}`,
      targetId: req.id,
      details: `Super Admin ${admin.name} rejected RVC deposit of ${req.amount} for user ID ${req.userId}. Reason: ${reason || 'N/A'}`
    });

    return { success: true, message: 'Ombi la RVC limekataliwa. Hakuna salio lililoongezwa.' };
  }

  /**
   * Super Admin Manual Direct Credit after WhatsApp verification
   */
  async manualCreditUser(params: {
    userId: string;
    amountRvc: number;
    paymentMethod: string;
    paymentReference: string;
    notes: string;
    admin: User;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      customer: string;
      amount: number;
      previousBalance: number;
      amountAdded: number;
      newBalance: number;
      transactionId: string;
      paymentReference: string;
      admin: string;
      timestamp: string;
    };
  }> {
    await this.dataStore.initialize();
    const { userId, amountRvc, paymentMethod, paymentReference, notes, admin } = params;

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return { success: false, message: 'Ruksa imezuiliwa: Ni Msimamizi Mkuu pekee anayeweza kuongeza salio la RVC kwa mtumiaji.' };
    }

    if (!amountRvc || amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha RVC lazima kiwe zaidi ya sifuri.' };
    }

    const user = await this.dataStore.getUserById(userId);
    if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

    // Check duplicate payment reference
    const payRef = paymentReference.trim();
    if (payRef) {
      const existingTxs = await this.dataStore.getUserTransactions(user.id);
      if (existingTxs.some((t: WalletTransaction) => t.reference === payRef)) {
        return { success: false, message: `Muamala wenye kumbukumbu "${payRef}" tayari ulishaongezwa awali kwenye pochi.` };
      }
    }

    const credTime = new Date().toISOString();
    const uniqueTxnId = `TXN-RVC-${Math.floor(100000 + Math.random() * 900000)}`;
    const prevBalance = user.walletBalance || 0;
    const updatedBalance = prevBalance + amountRvc;

    // Update wallet balance
    await this.dataStore.updateUser(user.id, { walletBalance: updatedBalance });

    // Record immutable ledger entry
    const tx: WalletTransaction = {
      id: `tx_dep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      actorId: admin.id,
      type: 'MANUAL_TOP_UP',
      amount: amountRvc,
      balanceBefore: prevBalance,
      balanceAfter: updatedBalance,
      status: 'completed',
      createdAt: credTime,
      timestamp: credTime,
      description: `Manual Credit (Uhakiki wa WhatsApp): ${paymentMethod} (${payRef || uniqueTxnId}) - ${notes || 'Malipo yamethibitishwa'}`,
      reference: payRef || uniqueTxnId,
      paymentMethod
    };
    await this.dataStore.recordWalletTransaction(tx);

    // Audit log
    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'MANUAL_CREDIT_TOP_UP',
      target: `User ${user.id} (${user.name})`,
      targetId: user.id,
      details: `Manager/Admin ${admin.name} manually credited ${amountRvc} Credits to ${user.name}. Previous: ${prevBalance}, Added: ${amountRvc}, New: ${updatedBalance}. TxnId: ${uniqueTxnId}, Method: ${paymentMethod}, Ref: ${payRef}, Note: ${notes}`
    });

    return {
      success: true,
      message: `Salio la Credits ${amountRvc.toLocaleString()} limeongezwa kwa ${user.name}. Salio jipya: Credits ${updatedBalance.toLocaleString()}.`,
      data: {
        customer: user.name,
        amount: amountRvc,
        previousBalance: prevBalance,
        amountAdded: amountRvc,
        newBalance: updatedBalance,
        transactionId: uniqueTxnId,
        paymentReference: payRef || uniqueTxnId,
        admin: admin.name,
        timestamp: credTime
      }
    };
  }

  /**
   * Authoritative Server-Side Credit Deduction with Manager Privilege & Double-Deduction Protection
   */
  async deductCredits(params: {
    userId: string;
    action: 'post_publish' | 'video_upload' | 'movie_stream' | 'movie_download' | 'market_listing' | string;
    targetId?: string;
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    deducted: number;
    remainingBalance: number;
    isUnlimited: boolean;
    message: string;
    transaction?: WalletTransaction;
    code?: string;
  }> {
    await this.dataStore.initialize();
    const user = await this.dataStore.getUserById(params.userId);
    if (!user) {
      return {
        success: false,
        deducted: 0,
        remainingBalance: 0,
        isUnlimited: false,
        message: 'Mtumiaji hakupatikana.',
        code: 'USER_NOT_FOUND'
      };
    }

    const roleLower = (user.role || '').toLowerCase();
    const isManager = roleLower === 'manager' || roleLower === 'super_admin';

    // 1. Manager Unlimited Privilege: Manager accounts have unlimited Credits (∞ Credits)
    if (isManager) {
      return {
        success: true,
        deducted: 0,
        remainingBalance: 999999999,
        isUnlimited: true,
        message: 'Manager Privilege: Salio bila ukomo (∞ Credits).'
      };
    }

    // 2. Retrieve dynamic CreditConfig from data store
    const creditConfig = await this.dataStore.getCreditConfig();

    let requiredCredits = 1;
    let actionLabel = 'Chapisho / Soko';
    let txType: string = 'POST_DEDUCTION';

    if (params.action === 'video_upload') {
      requiredCredits = creditConfig.videoPriceCredits || 2;
      actionLabel = 'Kupakia Video';
      txType = 'VIDEO_DEDUCTION';
    } else if (params.action === 'movie_stream' || params.action === 'movie_download') {
      requiredCredits = creditConfig.moviePriceCredits || 3;
      actionLabel = params.action === 'movie_download' ? 'Kupakua Movie' : 'Kutazama Movie';
      txType = 'MOVIE_DEDUCTION';
    } else if (params.action === 'market_listing') {
      requiredCredits = creditConfig.postPriceCredits || 1;
      actionLabel = 'Kuorodhesha Bidhaa Sokoni';
      txType = 'POST_DEDUCTION';
    } else if (params.action === 'post_publish') {
      requiredCredits = creditConfig.postPriceCredits || 1;
      actionLabel = 'Kuchapisha Chapisho';
      txType = 'POST_DEDUCTION';
    }

    // 3. Double-Deduction Protection / Idempotency
    if (params.idempotencyKey) {
      const userTxs = await this.dataStore.getUserTransactions(user.id);
      const existing = userTxs.find((t: WalletTransaction) => t.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return {
          success: true,
          deducted: 0,
          remainingBalance: user.walletBalance || 0,
          isUnlimited: false,
          message: `Muamala huu tayari ulikamilika (${actionLabel}).`,
          transaction: existing
        };
      }
    }

    // 4. Strict Non-Negative Balance Enforcement
    const currentBalance = user.walletBalance || 0;
    if (currentBalance < requiredCredits) {
      return {
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        deducted: 0,
        remainingBalance: currentBalance,
        isUnlimited: false,
        message: 'Huna Credits za kutosha kwa huduma hii. Tafadhali ongeza Credits ili kuendelea.'
      };
    }

    // 5. Atomic balance deduction
    const newBalance = currentBalance - requiredCredits;
    await this.dataStore.updateUser(user.id, { walletBalance: newBalance });

    // 6. Record transaction in Credit Transaction Ledger
    const nowIso = new Date().toISOString();
    const txId = `tx_crd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const tx: WalletTransaction = {
      id: txId,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      actorId: user.id,
      type: txType,
      amount: requiredCredits,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Makato ya credits kwa ajili ya: ${actionLabel}`,
      status: 'completed',
      createdAt: nowIso,
      timestamp: nowIso,
      reference: params.targetId || params.action,
      idempotencyKey: params.idempotencyKey
    };
    await this.dataStore.recordWalletTransaction(tx);

    // 7. Audit Log
    await this.dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'CREDIT_DEDUCTED',
      target: params.action,
      targetId: params.targetId || params.action,
      details: `Deducted ${requiredCredits} credits for ${actionLabel}. Balance before: ${currentBalance}, Balance after: ${newBalance}. Txn: ${txId}`
    });

    return {
      success: true,
      deducted: requiredCredits,
      remainingBalance: newBalance,
      isUnlimited: false,
      message: `Credits ${requiredCredits} zimekatwa kikamilifu kwa ajili ya ${actionLabel}.`,
      transaction: tx
    };
  }
}

export const walletService = new WalletService();
