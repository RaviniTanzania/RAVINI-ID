import { User, AdCampaign, AdType, AdPlacement, AdTargeting, WalletTransaction } from '../../types';
import { db } from './databaseAdapter';
import { PricingService } from './pricingService';
import { LedgerService } from './ledgerService';
import { AuditService } from './auditService';
import { TransactionVerificationResult } from './types';

const ADS_COLLECTION = 'system_ad_campaigns';

export class AdsManager {
  /**
   * Authoritative creation and budget reservation of an ad campaign.
   */
  static async createCampaign(params: {
    user: User;
    title: string;
    adType: AdType;
    placement: AdPlacement;
    headline: string;
    body: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    ctaText: string;
    targetUrl: string;
    targeting: AdTargeting;
    durationDays: number;
    budgetRvc: number;
    dailyBudgetRvc?: number;
    companyName?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; campaign?: AdCampaign; errorCode?: string }> {
    const { user, title, adType, placement, headline, body, mediaUrl, mediaType, ctaText, targetUrl, targeting, durationDays, budgetRvc, companyName, idempotencyKey } = params;

    // 1. Validate Authoritative Pricing & Minimum Budget
    const pricing = await PricingService.getPricing();
    const minBudget = pricing.adPricing.minimumBudgetRvc || 1000;

    if (budgetRvc < minBudget) {
      return {
        success: false,
        message: `Bajeti ya chini inayoruhusiwa kwa kampeni za RAVINI Ads ni RVC ${minBudget.toLocaleString()}.`,
        errorCode: 'MINIMUM_BUDGET_UNMET'
      };
    }

    // 2. Idempotency Check to prevent double deduction
    if (idempotencyKey) {
      const existingCampaigns = await db.list<AdCampaign>(ADS_COLLECTION, c => c.idempotencyKey === idempotencyKey);
      if (existingCampaigns.length > 0) {
        return {
          success: true,
          message: 'Kampeni hii ilishapokelewa na bajeti imehifadhiwa.',
          campaign: existingCampaigns[0]
        };
      }
    }

    // 3. Atomically check balance and reserve budget into escrow
    try {
      return await db.runTransaction(async (ctx) => {
        const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
        const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
        const liveUser = users.find(u => u.id === user.id);

        if (!liveUser) {
          return { success: false, message: 'Akaunti ya mtangazaji haikupatikana.', errorCode: 'UNAUTHORIZED' };
        }

        const currentBalance = liveUser.walletBalance || 0;
        if (currentBalance < budgetRvc) {
          return {
            success: false,
            message: `Salio lako la RVC (${currentBalance.toLocaleString()} RVC) halitoshi kulipia bajeti ya kampeni hii (${budgetRvc.toLocaleString()} RVC). Tafadhali weka salio kwanza.`,
            errorCode: 'INSUFFICIENT_BALANCE'
          };
        }

        // Deduct from advertiser's customer wallet
        liveUser.walletBalance = currentBalance - budgetRvc;
        localStorage.setItem('ravini_users_permanent_v3', JSON.stringify(users));

        const now = new Date().toISOString();
        const campaignId = `camp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const dailyBudget = params.dailyBudgetRvc || Math.round(budgetRvc / Math.max(1, durationDays));

        // Create wallet transaction record
        const walletTx: WalletTransaction = {
          id: `tx_${Date.now()}_ad_pay`,
          userId: liveUser.id,
          type: 'debit',
          amount: -budgetRvc,
          description: `Malipo ya Tangazo la RAVINI Ads (${title})`,
          createdAt: now,
          status: 'completed',
          reference: `AD-${campaignId}`
        };

        const rawTx = localStorage.getItem('ravini_transactions_permanent_v3');
        const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
        txList.unshift(walletTx);
        localStorage.setItem('ravini_transactions_permanent_v3', JSON.stringify(txList.slice(0, 1000)));

        // Record in Double-Entry Ledger (Transfer to Escrow Pending Approval)
        const ledgerEntry = await LedgerService.recordTransfer({
          sourceAccount: 'customer_wallet',
          destinationAccount: 'escrow_pending',
          amount: budgetRvc,
          service: 'ads',
          userId: liveUser.id,
          userRaviniId: liveUser.raviniId,
          userName: liveUser.name,
          referenceId: campaignId,
          idempotencyKey,
          notes: `Ad campaign budget hold for "${title}"`
        });

        // Construct Authoritative Campaign
        const newCampaign: AdCampaign = {
          id: campaignId,
          userId: liveUser.id,
          userName: liveUser.name,
          userAvatar: liveUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          userRaviniId: liveUser.raviniId || liveUser.id,
          userRole: liveUser.role,
          companyName: companyName || (liveUser.role === 'company' ? liveUser.name : 'RAVINI Advertiser'),
          title: title.trim(),
          adType,
          placement,
          headline: headline.trim(),
          body: body.trim(),
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
          mediaType: mediaType || 'image',
          ctaText: ctaText.trim() || 'Jifunze Zaidi',
          targetUrl: targetUrl.trim() || 'https://ravini.tz',
          targeting,
          durationDays,
          budgetRvc,
          dailyBudgetRvc: dailyBudget,
          spentRvc: 0,
          status: 'pending_approval',
          isPaid: true,
          paymentTransactionId: ledgerEntry.id,
          idempotencyKey,
          createdAt: now,
          impressions: 0,
          views: 0,
          clicks: 0,
          shares: 0,
          engagement: 0,
        };

        // Persist campaign in DAL
        await ctx.set(ADS_COLLECTION, newCampaign.id, newCampaign);

        // Sync legacy storage key
        const rawC = localStorage.getItem('ravini_ad_campaigns_v1');
        const legacyCampaigns: AdCampaign[] = rawC ? JSON.parse(rawC) : [];
        legacyCampaigns.unshift(newCampaign);
        localStorage.setItem('ravini_ad_campaigns_v1', JSON.stringify(legacyCampaigns));

        // Immutable Audit Record
        await AuditService.record({
          actor: liveUser,
          action: 'CAMPAIGN_CREATED',
          target: newCampaign.title,
          targetId: newCampaign.id,
          details: `Kampeni mpya ya tangazo imeundwa na kuwekewa bajeti ya RVC ${budgetRvc.toLocaleString()} (Hold kwenye Escrow).`,
          beforeValue: { walletBalance: currentBalance },
          afterValue: { walletBalance: liveUser.walletBalance, campaignId: newCampaign.id }
        });

        return {
          success: true,
          message: 'Kampeni yako imetumwa kikamilifu na inasubiri ukaguzi na idhini ya Wasimamizi.',
          campaign: newCampaign
        };
      });
    } catch (err: any) {
      console.error('[AdsManager] Create campaign error:', err);
      return { success: false, message: `Hitilafu ya uhifadhi wa tangazo: ${err?.message || 'Imeshindwa'}`, errorCode: 'INVALID_PARAMS' };
    }
  }

  /**
   * Approves a campaign. Moves reserved funds from escrow to company revenue.
   */
  static async approveCampaign(adminActor: User, campaignId: string): Promise<{ success: boolean; message: string }> {
    const isSuper = adminActor.role === 'super_admin';
    const hasPerm = Array.isArray(adminActor.permissions) && (
      adminActor.permissions.includes('ADS_MANAGE' as any) ||
      adminActor.permissions.includes('SUPER_ADMIN' as any)
    );

    if (!isSuper && !hasPerm) {
      return { success: false, message: 'Huna mamlaka ya kuidhinisha matangazo (ADS_MANAGE required).' };
    }

    const campaign = await db.get<AdCampaign>(ADS_COLLECTION, campaignId);
    if (!campaign) {
      return { success: false, message: 'Kampeni ya tangazo haikupatikana.' };
    }
    if (campaign.status !== 'pending_approval') {
      return { success: false, message: `Kampeni hii haiwezi kuidhinishwa kwa kuwa ipo kwenye hali ya: ${campaign.status}` };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + campaign.durationDays * 24 * 60 * 60 * 1000);

    campaign.status = 'active';
    campaign.startedAt = now.toISOString();
    campaign.expiresAt = expiresAt.toISOString();

    await db.set(ADS_COLLECTION, campaign.id, campaign);

    // Sync legacy storage
    const rawC = localStorage.getItem('ravini_ad_campaigns_v1');
    const list: AdCampaign[] = rawC ? JSON.parse(rawC) : [];
    const idx = list.findIndex(c => c.id === campaignId);
    if (idx >= 0) {
      list[idx] = campaign;
      localStorage.setItem('ravini_ad_campaigns_v1', JSON.stringify(list));
    }

    // Move from Escrow to Company Revenue
    await LedgerService.recordTransfer({
      sourceAccount: 'escrow_pending',
      destinationAccount: 'company_revenue',
      amount: campaign.budgetRvc,
      service: 'ads',
      userId: campaign.userId,
      userRaviniId: campaign.userRaviniId,
      userName: campaign.userName,
      referenceId: campaign.id,
      notes: `Campaign approved by ${adminActor.name}. Revenue recognized.`
    });

    // Audit Log
    await AuditService.record({
      actor: adminActor,
      action: 'CAMPAIGN_APPROVED',
      target: campaign.title,
      targetId: campaign.id,
      details: `Kampeni "${campaign.title}" imeidhinishwa na kuanza kurushwa mtandaoni. Bajeti: RVC ${campaign.budgetRvc.toLocaleString()}`
    });

    return { success: true, message: `Kampeni ya "${campaign.title}" imeidhinishwa na imeanza kurushwa rasmi!` };
  }

  /**
   * Cancels an ad campaign and issues an authoritative refund for the unspent budget.
   */
  static async cancelCampaignWithRefund(actor: User, campaignId: string, reason?: string): Promise<{ success: boolean; message: string; refundedRvc?: number }> {
    const campaign = await db.get<AdCampaign>(ADS_COLLECTION, campaignId);
    if (!campaign) {
      return { success: false, message: 'Kampeni haikupatikana.' };
    }

    const isOwner = campaign.userId === actor.id;
    const isSuper = actor.role === 'super_admin';
    const hasPerm = Array.isArray(actor.permissions) && actor.permissions.includes('ADS_MANAGE' as any);

    if (!isOwner && !isSuper && !hasPerm) {
      return { success: false, message: 'Huna mamlaka ya kusitisha kampeni hii.' };
    }

    if (campaign.status === 'completed' || campaign.status === 'cancelled' || campaign.status === 'rejected') {
      return { success: false, message: `Kampeni hii haiwezi kusitishwa kwa sababu ipo kwenye hali ya: ${campaign.status}` };
    }

    // Calculate unspent budget
    const unspentBudget = Math.max(0, campaign.budgetRvc - (campaign.spentRvc || 0));
    const wasPending = campaign.status === 'pending_approval';

    campaign.status = 'cancelled';
    await db.set(ADS_COLLECTION, campaign.id, campaign);

    // Sync legacy storage
    const rawC = localStorage.getItem('ravini_ad_campaigns_v1');
    const list: AdCampaign[] = rawC ? JSON.parse(rawC) : [];
    const idx = list.findIndex(c => c.id === campaignId);
    if (idx >= 0) {
      list[idx] = campaign;
      localStorage.setItem('ravini_ad_campaigns_v1', JSON.stringify(list));
    }

    // If unspent budget exists, atomically refund to user wallet
    if (unspentBudget > 0) {
      const rawUsers = localStorage.getItem('ravini_users_permanent_v3');
      const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
      const advertiser = users.find(u => u.id === campaign.userId);

      if (advertiser) {
        const prevBal = advertiser.walletBalance || 0;
        advertiser.walletBalance = prevBal + unspentBudget;
        localStorage.setItem('ravini_users_permanent_v3', JSON.stringify(users));

        const now = new Date().toISOString();
        const refundTxId = `tx_${Date.now()}_ad_refund`;

        // Create wallet credit transaction
        const refundTx: WalletTransaction = {
          id: refundTxId,
          userId: advertiser.id,
          type: 'credit',
          amount: unspentBudget,
          description: `Marejesho ya salio la tangazo lililositishwa: "${campaign.title}"`,
          createdAt: now,
          status: 'completed',
          reference: `REF-CAMP-${campaign.id}`
        };

        const rawTx = localStorage.getItem('ravini_transactions_permanent_v3');
        const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
        txList.unshift(refundTx);
        localStorage.setItem('ravini_transactions_permanent_v3', JSON.stringify(txList.slice(0, 1000)));

        // Ledger reversal from Escrow or Company Revenue back to Customer
        await LedgerService.recordTransfer({
          sourceAccount: wasPending ? 'escrow_pending' : 'company_revenue',
          destinationAccount: 'customer_wallet',
          amount: unspentBudget,
          service: 'refund',
          userId: advertiser.id,
          userRaviniId: advertiser.raviniId,
          userName: advertiser.name,
          referenceId: campaign.id,
          notes: `Automatic refund of unspent ad budget. Reason: ${reason || 'Campaign cancelled by user/admin'}`
        });

        // Audit Log
        await AuditService.record({
          actor,
          action: 'CAMPAIGN_CANCELLED_REFUNDED',
          target: campaign.title,
          targetId: campaign.id,
          details: `Kampeni ilisitishwa. Salio lisilotumika la RVC ${unspentBudget.toLocaleString()} limerejeshwa kwenye pochi ya ${advertiser.name}. Sababu: ${reason || 'Kusitishwa kwa kampeni'}`
        });
      }
    }

    return {
      success: true,
      message: `Kampeni imesitishwa kikamilifu.${unspentBudget > 0 ? ` Salio la RVC ${unspentBudget.toLocaleString()} limerejeshwa kwenye pochi yako.` : ''}`,
      refundedRvc: unspentBudget
    };
  }
}
