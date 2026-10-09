import { getDataStore } from '../db/fileDataStore';
import { walletService } from './walletService';
import { AdCampaign, User, AdType, AdPlacement, AdTargeting } from '../../src/types';

export class AdsService {
  private dataStore = getDataStore();

  async createCampaign(
    user: User,
    data: {
      title: string;
      adType: AdType;
      placement: AdPlacement;
      headline: string;
      body: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      ctaText: string;
      targetUrl: string;
      relatedPostId?: string;
      relatedProductId?: string;
      relatedBusinessId?: string;
      targeting: AdTargeting;
      durationDays: number;
      companyName?: string;
      idempotencyKey?: string;
    }
  ): Promise<{ success: boolean; message: string; campaign?: AdCampaign }> {
    await this.dataStore.initialize();
    const pricing = await this.dataStore.getPlatformPricing();

    if (data.durationDays < 1) {
      return { success: false, message: 'Muda wa tangazo lazima uwe angalau siku 1.' };
    }

    // Determine authoritative daily rate from backend pricing config
    let dailyRate = pricing.adPricing.feedAdPerDay;
    switch (data.adType) {
      case 'sponsored_post':
        dailyRate = pricing.adPricing.sponsoredPostPerDay;
        break;
      case 'sponsored_video':
        dailyRate = pricing.adPricing.sponsoredVideoPerDay;
        break;
      case 'sponsored_clip':
        dailyRate = pricing.adPricing.sponsoredClipPerDay;
        break;
      case 'sponsored_product':
        dailyRate = pricing.adPricing.sponsoredProductPerDay;
        break;
      case 'sponsored_business':
        dailyRate = pricing.adPricing.sponsoredBusinessPerDay;
        break;
      case 'banner':
        dailyRate = pricing.adPricing.bannerPerDay;
        break;
      case 'feed_ad':
      default:
        dailyRate = pricing.adPricing.feedAdPerDay;
        break;
    }

    // Authoritative total budget calculation
    const calculatedBudget = dailyRate * data.durationDays;
    const minBudget = pricing.adPricing.minimumBudgetRvc || 1000;

    if (calculatedBudget < minBudget) {
      return {
        success: false,
        message: `Kima cha chini cha bajeti ya tangazo ni ${minBudget.toLocaleString()} RVC.`
      };
    }

    // Check user balance on backend
    const currentBalance = await walletService.getBalance(user.id);
    if (currentBalance < calculatedBudget) {
      return {
        success: false,
        message: `Salio lako la RVC (${currentBalance.toLocaleString()}) halitoshi kulipia tangazo hili (${calculatedBudget.toLocaleString()} RVC).`
      };
    }

    const campaignId = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    // Deduct RVC from wallet atomically via walletService
    const spendResult = await walletService.spendOnService({
      userId: user.id,
      service: 'ads',
      amountRvc: calculatedBudget,
      description: `Malipo ya Tangazo la RAVINI Ads (${data.durationDays} siku) - ${data.title}`,
      reference: `AD-${Date.now().toString().slice(-6)}`,
      relatedId: campaignId,
      relatedType: 'campaign',
      idempotencyKey: data.idempotencyKey
    });

    if (!spendResult.success) {
      return { success: false, message: spendResult.message };
    }

    const isOfficialAdmin = user.role === 'super_admin' && data.companyName?.includes('RAVINI');

    const campaign: AdCampaign = {
      id: campaignId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || '',
      userRaviniId: user.raviniId || user.username,
      userRole: user.role,
      companyName: data.companyName || user.name,
      title: data.title,
      adType: data.adType,
      placement: data.placement,
      headline: data.headline || data.title,
      body: data.body,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType || 'image',
      ctaText: data.ctaText || 'Jifunze Zaidi',
      targetUrl: data.targetUrl || 'https://ravini.tz',
      relatedPostId: data.relatedPostId,
      relatedProductId: data.relatedProductId,
      relatedBusinessId: data.relatedBusinessId,
      targeting: data.targeting,
      durationDays: data.durationDays,
      budgetRvc: calculatedBudget,
      dailyBudgetRvc: dailyRate,
      spentRvc: 0,
      remainingBudgetRvc: calculatedBudget,
      status: isOfficialAdmin ? 'active' : 'pending_approval',
      isPaid: true,
      impressions: 0,
      views: 0,
      clicks: 0,
      shares: 0,
      engagement: 0,
      impressionsCount: 0,
      clicksCount: 0,
      ctrPercent: 0,
      createdAt: now,
      startedAt: isOfficialAdmin ? now : undefined,
      startDate: isOfficialAdmin ? now : undefined,
      expiresAt: isOfficialAdmin ? new Date(Date.now() + data.durationDays * 86400000).toISOString() : undefined,
      endDate: isOfficialAdmin ? new Date(Date.now() + data.durationDays * 86400000).toISOString() : undefined,
      idempotencyKey: data.idempotencyKey
    };

    await this.dataStore.saveAdCampaign(campaign);

    await this.dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'CREATE_AD_CAMPAIGN',
      target: campaign.title,
      targetId: campaign.id,
      details: `Created ad campaign: ${campaign.title}. Duration: ${campaign.durationDays} days. Budget: ${campaign.budgetRvc} RVC.`
    });

    return {
      success: true,
      message: isOfficialAdmin 
        ? 'Tangazo la kampuni limewashwa moja kwa moja.' 
        : 'Kampeni yako imepokelewa na kupelekwa kwenye dawati la ukaguzi wa matangazo ya RAVINI.',
      campaign
    };
  }

  async approveCampaign(campaignId: string, admin: User): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const campaign = await this.dataStore.getAdCampaignById(campaignId);
    if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

    if (campaign.status !== 'pending_approval' && campaign.status !== 'draft') {
      return { success: false, message: `Kampeni haiwezi kuidhinishwa katika hali ya sasa (${campaign.status}).` };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + campaign.durationDays * 86400000);

    await this.dataStore.updateAdCampaign(campaignId, {
      status: 'active',
      startedAt: now.toISOString(),
      startDate: now.toISOString(),
      expiresAt: endDate.toISOString(),
      endDate: endDate.toISOString(),
      reviewedAt: now.toISOString(),
      reviewedBy: admin.name
    });

    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'APPROVE_AD_CAMPAIGN',
      target: campaign.title,
      targetId: campaignId,
      details: `Approved ad campaign '${campaign.title}' for user ${campaign.userName} (${campaign.userId}). Active until ${endDate.toISOString()}.`
    });

    return { success: true, message: `Kampeni '${campaign.title}' imeidhinishwa na kuanza kuruka hewani!` };
  }

  async rejectCampaign(campaignId: string, admin: User, reason: string): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const campaign = await this.dataStore.getAdCampaignById(campaignId);
    if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

    await this.dataStore.updateAdCampaign(campaignId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.name,
      rejectionReason: reason
    });

    // Automatic full refund on rejection
    if (campaign.budgetRvc > 0) {
      await walletService.creditRefund({
        userId: campaign.userId,
        amountRvc: campaign.budgetRvc,
        description: `Rejesho la fedha za tangazo lililokataliwa: ${campaign.title}. Sababu: ${reason}`,
        reference: `REF-REJ-${campaign.id.slice(-6)}`,
        relatedId: campaign.id,
        idempotencyKey: `ref_rej_${campaign.id}`,
        adminId: admin.id,
        adminName: admin.name
      });
    }

    await this.dataStore.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'REJECT_AD_CAMPAIGN',
      target: campaign.title,
      targetId: campaignId,
      details: `Rejected ad campaign '${campaign.title}' for user ${campaign.userName}. Reason: ${reason}. Refunded ${campaign.budgetRvc} RVC.`
    });

    return { success: true, message: `Kampeni imekataliwa na kiasi cha RVC ${campaign.budgetRvc.toLocaleString()} kimerejeshwa kwa mtumiaji.` };
  }

  async pauseCampaign(campaignId: string, actor: User): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const campaign = await this.dataStore.getAdCampaignById(campaignId);
    if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

    const isOwner = campaign.userId === actor.id;
    const isAdmin = actor.role === 'super_admin' || (actor.permissions && (actor.permissions.includes('all') || actor.permissions.includes('ADS_MANAGE')));

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Huna idhini ya kusimamisha kampeni hii.' };
    }

    if (campaign.status !== 'active') {
      return { success: false, message: 'Kampeni hii haiko hewani kwa sasa.' };
    }

    await this.dataStore.updateAdCampaign(campaignId, { status: 'paused' });

    await this.dataStore.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PAUSE_AD_CAMPAIGN',
      target: campaign.title,
      targetId: campaignId,
      details: `Paused ad campaign '${campaign.title}'.`
    });

    return { success: true, message: 'Tangazo limesimamishwa kwa muda.' };
  }

  async resumeCampaign(campaignId: string, actor: User): Promise<{ success: boolean; message: string }> {
    await this.dataStore.initialize();
    const campaign = await this.dataStore.getAdCampaignById(campaignId);
    if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

    const isOwner = campaign.userId === actor.id;
    const isAdmin = actor.role === 'super_admin' || (actor.permissions && (actor.permissions.includes('all') || actor.permissions.includes('ADS_MANAGE')));

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Huna idhini ya kuendeleza kampeni hii.' };
    }

    if (campaign.status !== 'paused') {
      return { success: false, message: 'Kampeni hii haijasimamishwa.' };
    }

    await this.dataStore.updateAdCampaign(campaignId, { status: 'active' });

    await this.dataStore.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'RESUME_AD_CAMPAIGN',
      target: campaign.title,
      targetId: campaignId,
      details: `Resumed ad campaign '${campaign.title}'.`
    });

    return { success: true, message: 'Tangazo limeendelea kuruka hewani.' };
  }
}

export const adsService = new AdsService();
