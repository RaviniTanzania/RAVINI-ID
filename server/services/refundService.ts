import { getDataStore } from '../db/fileDataStore';
import { walletService } from './walletService';
import { RefundRecord, User } from '../../src/types';

export class RefundService {
  private dataStore = getDataStore();

  async getRefunds() {
    return this.dataStore.getRefunds();
  }

  async requestRefund(
    user: User,
    params: {
      transactionId: string;
      service: string;
      amountRvc: number;
      reason: string;
    }
  ): Promise<{ success: boolean; message: string; refund?: RefundRecord }> {
    await this.dataStore.initialize();

    if (params.amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha rejesho lazima kiwe zaidi ya 0 RVC.' };
    }

    // Check if a refund has already been requested or completed for this transaction
    const existingRefunds = await this.dataStore.getRefunds();
    const duplicate = existingRefunds.find(
      r => r.transactionId === params.transactionId && (r.status === 'pending' || r.status === 'approved' || r.status === 'completed')
    );

    if (duplicate) {
      return {
        success: false,
        message: `Ombi la rejesho kwa muamala huu lilishawasilishwa awali (Hali: ${duplicate.status}).`
      };
    }

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const refund: RefundRecord = {
      id: refundId,
      transactionId: params.transactionId,
      userId: user.id,
      userRaviniId: user.raviniId || user.username,
      userName: user.name,
      service: params.service,
      amountRvc: params.amountRvc,
      reason: params.reason,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    await this.dataStore.saveRefund(refund);

    await this.dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'REFUND_REQUESTED',
      target: `Refund ${refund.id}`,
      targetId: refund.id,
      details: `User requested refund of ${params.amountRvc} RVC for ${params.service} (${params.transactionId}). Reason: ${params.reason}.`
    });

    return {
      success: true,
      message: 'Ombi lako la rejesho limewasilishwa kwenye dawati la fedha la RAVINI kwa ukaguzi.',
      refund
    };
  }

  async executeRefund(
    refundId: string,
    admin: User,
    adminNote?: string
  ): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const refund = await this.dataStore.getRefundById(refundId);
    if (!refund) return { success: false, message: 'Ombi la rejesho halikupatikana.' };

    if (refund.status === 'completed') {
      return { success: false, message: 'Rejesho hili lilishalipwa tayari (Double refund prevented).' };
    }

    if (refund.status === 'rejected') {
      return { success: false, message: 'Ombi hili lilishakataliwa.' };
    }

    // Execute credit reversal via walletService
    const creditResult = await walletService.creditRefund({
      userId: refund.userId,
      amountRvc: refund.amountRvc,
      description: `Rejesho la fedha: ${refund.reason}`,
      reference: `REF-${refund.id.slice(-6)}`,
      relatedId: refund.transactionId,
      idempotencyKey: `exec_ref_${refund.id}`,
      adminId: admin.id,
      adminName: admin.name
    });

    if (!creditResult.success) {
      return { success: false, message: creditResult.message };
    }

    // Mark refund completed
    await this.dataStore.updateRefund(refundId, {
      status: 'completed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.name,
      adminNote: adminNote || 'Refund approved and disbursed by admin'
    });

    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'EXECUTE_REFUND',
      target: `Refund ${refund.id}`,
      targetId: refund.id,
      details: `Disbursed refund ${refund.id} of ${refund.amountRvc} RVC to ${refund.userName} (${refund.userId}). Note: ${adminNote || 'Approved'}.`
    });

    return {
      success: true,
      message: `Rejesho la RVC ${refund.amountRvc.toLocaleString()} limekamilika na kuwekwa kwenye pochi ya mtumiaji.`
    };
  }

  async rejectRefund(
    refundId: string,
    admin: User,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const refund = await this.dataStore.getRefundById(refundId);
    if (!refund) return { success: false, message: 'Ombi la rejesho halikupatikana.' };

    if (refund.status === 'completed') {
      return { success: false, message: 'Rejesho hili limeshakamilika, haliwezi kukataliwa tena.' };
    }

    await this.dataStore.updateRefund(refundId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.name,
      adminNote: reason
    });

    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'REJECT_REFUND',
      target: `Refund ${refund.id}`,
      targetId: refund.id,
      details: `Rejected refund ${refund.id} for user ${refund.userName}. Reason: ${reason}.`
    });

    return { success: true, message: 'Ombi la rejesho limekataliwa.' };
  }
}

export const refundService = new RefundService();
