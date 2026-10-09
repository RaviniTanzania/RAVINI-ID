import { PlatformPricingConfig, User } from '../../types';
import { db } from './databaseAdapter';
import { AuditService } from './auditService';

const PRICING_COLLECTION = 'system_platform_pricing';
const PRICING_CONFIG_ID = 'current_platform_pricing';

export const BASE_PLATFORM_PRICING: PlatformPricingConfig = {
  adPricing: {
    sponsoredPostPerDay: 1000,
    sponsoredVideoPerDay: 1800,
    sponsoredClipPerDay: 1400,
    sponsoredProductPerDay: 1200,
    sponsoredBusinessPerDay: 2000,
    bannerPerDay: 2500,
    feedAdPerDay: 1500,
    cpmRate: 100, // per 1,000 impressions
    minimumBudgetRvc: 1000,
  },
  premiumPricing: {
    monthlyRvc: 9900,
    quarterlyRvc: 26900,
    annualRvc: 95000,
  },
  pushViralPackages: [
    {
      id: 'viral_starter',
      name: 'Kianzio (Starter)',
      reachEstimate: 'Watu 5,000+',
      priceRvc: 500,
      durationDays: 3,
      description: 'Tangaza kwa watu 5,000 mtandaoni kote'
    },
    {
      id: 'viral_growth',
      name: 'Ukuaji (Growth)',
      reachEstimate: 'Watu 15,000+',
      priceRvc: 1200,
      durationDays: 7,
      description: 'Tangaza kwa watu 15,000 na kipaumbele cha juu'
    },
    {
      id: 'viral_ultra',
      name: 'Mlipuko (Ultra)',
      reachEstimate: 'Watu 50,000+',
      priceRvc: 3500,
      durationDays: 14,
      description: 'Ufikiaji mkubwa zaidi kwenye ukurasa wa kwanza'
    }
  ],
  marketCommissionRate: 0.05, // 5% platform commission
  updatedAt: '2026-03-01T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Super Admin)',
};

export class PricingService {
  /**
   * Retrieves the authoritative platform pricing.
   */
  static async getPricing(): Promise<PlatformPricingConfig> {
    try {
      const persisted = await db.get<PlatformPricingConfig>(PRICING_COLLECTION, PRICING_CONFIG_ID);
      if (persisted) {
        return persisted;
      }
      // Initialize if empty
      await db.set(PRICING_COLLECTION, PRICING_CONFIG_ID, BASE_PLATFORM_PRICING);
      return BASE_PLATFORM_PRICING;
    } catch {
      return BASE_PLATFORM_PRICING;
    }
  }

  /**
   * Updates platform pricing authoritatively. Requires Super Admin or PRICING_MANAGE permission.
   */
  static async updatePricing(
    actor: User,
    updates: Partial<PlatformPricingConfig>
  ): Promise<{ success: boolean; message: string; config?: PlatformPricingConfig }> {
    // 1. Authorize actor
    const isSuperAdmin = actor.role === 'super_admin';
    const hasPricingPerm = Array.isArray(actor.permissions) && actor.permissions.includes('PRICING_MANAGE' as any);
    
    if (!isSuperAdmin && !hasPricingPerm) {
      return {
        success: false,
        message: 'Huna mamlaka ya kubadilisha bei za mfumo. Ruhusa ya Super Admin au PRICING_MANAGE inahitajika.'
      };
    }

    const current = await this.getPricing();
    const updated: PlatformPricingConfig = {
      ...current,
      ...updates,
      adPricing: {
        ...current.adPricing,
        ...(updates.adPricing || {}),
      },
      premiumPricing: {
        ...current.premiumPricing,
        ...(updates.premiumPricing || {}),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: `${actor.name} (${isSuperAdmin ? 'Super Admin' : 'Admin'})`,
    };

    // 2. Persist in DAL
    await db.set(PRICING_COLLECTION, PRICING_CONFIG_ID, updated);

    // 3. Sync to legacy storage key for backward compatibility
    try {
      localStorage.setItem('ravini_platform_pricing_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('[PricingService] Failed to sync legacy pricing:', e);
    }

    // 4. Audit Log
    await AuditService.record({
      actor,
      action: 'PRICING_UPDATED',
      target: 'PlatformPricingConfig',
      targetId: PRICING_CONFIG_ID,
      details: `Bei na tozo za mfumo zimesasishwa na ${actor.name}. Min bajeti: RVC ${updated.adPricing.minimumBudgetRvc}, Ada ya Soko: ${((updated.marketCommissionRate || 0.05) * 100).toFixed(1)}%`,
      beforeValue: current,
      afterValue: updated,
      reason: 'Sasisho la viwango vya bei na tozo za RAVINI'
    });

    return {
      success: true,
      message: 'Viwango vya bei na tozo za mfumo vimesasishwa kwa mafanikio.',
      config: updated,
    };
  }
}
