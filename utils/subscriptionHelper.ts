/**
 * Subscription Helper Functions
 * Helper functions untuk subscription management yang bisa diintegrasikan ke App.tsx
 */

import { getSubscriptionStatus, getSubscription, SubscriptionStatus } from '../services/subscriptionService';

export interface SubscriptionUIState {
  isLoading: boolean;
  status: SubscriptionStatus | null;
  showUpgradePrompt: boolean;
  upgradeMessage: string;
}

/**
 * Initialize subscription state untuk user yang baru login
 */
export const initializeSubscriptionState = (): SubscriptionUIState => {
  return {
    isLoading: true,
    status: null,
    showUpgradePrompt: false,
    upgradeMessage: ''
  };
};

/**
 * Load subscription status untuk user
 */
export const loadSubscriptionStatus = async (userId: string) => {
  try {
    const status = await getSubscriptionStatus(userId);
    return status;
  } catch (error) {
    console.error('Error loading subscription status:', error);
    return null;
  }
};

/**
 * Check jika subscription akan expire dalam n hari
 */
export const isExpiringWithinDays = (status: SubscriptionStatus | null, days: number = 7): boolean => {
  if (!status || status.days_remaining < 0) return false;
  return status.days_remaining <= days && status.days_remaining > 0;
};

/**
 * Check jika subscription sudah expired
 */
export const isExpired = (status: SubscriptionStatus | null): boolean => {
  if (!status) return false;
  return status.is_active === false;
};

/**
 * Get upgrade message berdasarkan status
 */
export const getUpgradeMessage = (status: SubscriptionStatus | null): string => {
  if (!status) return '';
  
  if (!status.is_active) {
    return 'Subscription Anda sudah habis. Upgrade sekarang untuk lanjut menggunakan aplikasi.';
  }
  
  if (status.days_remaining <= 7 && status.days_remaining > 0) {
    return `Subscription Anda akan berakhir dalam ${status.days_remaining} hari. Perpanjang sekarang.`;
  }
  
  return '';
};

/**
 * Format days remaining untuk UI
 */
export const formatDaysRemaining = (days: number | undefined): string => {
  if (days === undefined || days < 0) return 'Unlimited';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

/**
 * Check jika plan tertentu adalah Enterprise
 */
export const isEnterprisePlan = (planType: string): boolean => {
  return planType === 'enterprise';
};

/**
 * Check jika plan tertentu adalah Free
 */
export const isFreePlan = (planType: string): boolean => {
  return planType === 'free';
};

/**
 * Get plan tier level untuk comparison
 */
export const getPlanTierLevel = (planType: string): number => {
  const tiers: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    enterprise: 3
  };
  return tiers[planType] || 0;
};

/**
 * Check jika current plan bisa upgrade ke target plan
 */
export const canUpgradeToPlan = (currentPlan: string, targetPlan: string): boolean => {
  return getPlanTierLevel(targetPlan) > getPlanTierLevel(currentPlan);
};

/**
 * Get plan color untuk UI
 */
export const getPlanColor = (planType: string): { bg: string; border: string; text: string; badge: string } => {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    free: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-800'
    },
    basic: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    pro: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    },
    enterprise: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800'
    }
  };
  return colors[planType] || colors.free;
};

/**
 * Feature gating helper
 * Gunakan untuk membatasi fitur berdasarkan plan
 */
export const planFeatures: Record<string, string[]> = {
  free: [
    'basic_generation',
    'limited_chapters'
  ],
  basic: [
    'basic_generation',
    'intermediate_generation',
    'image_generation',
    'limited_storage'
  ],
  pro: [
    'basic_generation',
    'intermediate_generation',
    'advanced_generation',
    'image_generation',
    'bulk_generation',
    'priority_support',
    'unlimited_storage',
    'custom_export'
  ],
  enterprise: [
    'all_features',
    'priority_support',
    'api_access',
    'custom_integrations',
    'dedicated_account_manager'
  ]
};

/**
 * Check jika plan memiliki feature tertentu
 */
export const planHasFeature = (planType: string, feature: string): boolean => {
  const features = planFeatures[planType] || [];
  return features.includes(feature) || features.includes('all_features');
};
