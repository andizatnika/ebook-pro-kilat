import { supabase } from './supabaseClient';

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  display_name: string;
  description: string;
  price_per_month: number;
  price_per_year?: number;
  max_projects: number;
  max_images_per_chapter: number;
  max_chapters: number;
  storage_gb: number;
  priority_support: boolean;
  features: Record<string, boolean>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: 'active' | 'expired' | 'cancelled' | 'paused';
  start_date: string;
  end_date: string;
  duration_days: number;
  price_paid: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  is_active: boolean;
  plan_type: string;
  days_remaining: number;
  end_date: string;
}

/**
 * Get user's current subscription status
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase.rpc('check_subscription_status', {
      user_id: userId
    });

    if (error) {
      console.log('Error fetching subscription status:', error.message);
      // Return free tier as default
      return {
        is_active: true,
        plan_type: 'free',
        days_remaining: -1,
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return null;
  }
};

/**
 * Get subscription details
 */
export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('No subscription found for user:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

/**
 * Create new subscription (usually called after payment)
 */
export const createSubscription = async (
  userId: string,
  planType: string,
  durationDays: number,
  pricePaid: number = 0
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> => {
  if (!userId || !planType) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan_type: planType,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          duration_days: durationDays,
          price_paid: pricePaid,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return { success: true, subscription: data };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    };
  }
};

/**
 * Upgrade subscription
 */
export const upgradeSubscription = async (
  userId: string,
  newPlanType: string,
  durationDays: number,
  pricePaid: number
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> => {
  if (!userId || !newPlanType) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_type: newPlanType,
        status: 'active',
        end_date: endDate.toISOString(),
        duration_days: durationDays,
        price_paid: pricePaid,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, subscription: data };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upgrade subscription'
    };
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!userId) {
    return { success: false, error: 'User ID required' };
  }

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    };
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (
  userId: string,
  durationDays: number = 30,
  pricePaid: number = 0
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> => {
  if (!userId) {
    return { success: false, error: 'User ID required' };
  }

  try {
    // Get current subscription first
    const currentSubscription = await getSubscription(userId);
    if (!currentSubscription) {
      return { success: false, error: 'No subscription found' };
    }

    const newEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        end_date: newEndDate.toISOString(),
        duration_days: durationDays,
        price_paid: pricePaid,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, subscription: data };
  } catch (error) {
    console.error('Error renewing subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to renew subscription'
    };
  }
};

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_per_month', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
};

/**
 * Get specific subscription plan
 */
export const getSubscriptionPlan = async (planName: string): Promise<SubscriptionPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_name', planName)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
};

/**
 * Create payment record
 */
export const createPayment = async (
  userId: string,
  subscriptionId: string,
  amount: number,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !amount) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const { error } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount,
        payment_method: paymentMethod,
        status: 'pending'
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment'
    };
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  paymentId: string,
  status: 'success' | 'failed' | 'pending',
  transactionId?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!paymentId) {
    return { success: false, error: 'Payment ID required' };
  }

  try {
    const { error } = await supabase
      .from('payment_history')
      .update({
        status,
        transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment'
    };
  }
};

/**
 * Check if user can perform action based on subscription plan
 */
export const checkPlanFeature = async (
  userId: string,
  featureName: string
): Promise<boolean> => {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription) {
      // Default to free tier
      return featureName === 'basic_generation';
    }

    const plan = await getSubscriptionPlan(subscription.plan_type);
    if (!plan) return false;

    return plan.features[featureName] === true;
  } catch (error) {
    console.error('Error checking plan feature:', error);
    return false;
  }
};

/**
 * Get payment history for user
 */
export const getPaymentHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};
