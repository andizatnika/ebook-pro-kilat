/**
 * Midtrans Payment Service
 * Integration dengan Midtrans untuk payment processing
 * 
 * Setup:
 * 1. Register di https://midtrans.com
 * 2. Get Server Key dan Client Key
 * 3. Add ke .env:
 *    VITE_MIDTRANS_CLIENT_KEY=your_client_key
 *    VITE_MIDTRANS_SERVER_KEY=your_server_key (backend only)
 */

import { supabase } from './supabaseClient';
import { createSubscription, upgradeSubscription, updatePaymentStatus, createPayment } from './subscriptionService';

// Load Midtrans Snap JS
declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: any) => void;
    };
  }
}

const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
const SNAP_SCRIPT_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'; // sandbox
// Production: 'https://app.midtrans.com/snap/snap.js'

/**
 * Initialize Midtrans Snap JS library
 */
export const initializeMidtrans = async (): Promise<boolean> => {
  try {
    if (window.snap) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = SNAP_SCRIPT_URL;
      script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
      script.onload = () => {
        // @ts-ignore
        window.snap = window.snap || {};
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error initializing Midtrans:', error);
    return false;
  }
};

interface PaymentParams {
  userId: string;
  planType: string;
  durationMonths: number;
  amount: number;
  userEmail: string;
  userName: string;
}

/**
 * Initiate payment untuk subscription
 * Note: Token generation harus dilakukan dari backend untuk security
 */
export const initiatePayment = async (params: PaymentParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const { userId, planType, durationMonths, amount, userEmail, userName } = params;

    // Step 1: Get snap token dari backend
    // TODO: Buat backend endpoint untuk generate snap token
    // Backend harus:
    // 1. Validate user session
    // 2. Call Midtrans API untuk generate snap token
    // 3. Create payment_history record dengan status 'pending'
    // 4. Return token ke frontend
    
    // Temporary: di sini kita asumsikan backend handle token generation
    const tokenResponse = await fetch('/api/midtrans/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        planType,
        durationMonths,
        amount,
        userEmail,
        userName
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to generate payment token');
    }

    const { snapToken, paymentId } = await tokenResponse.json();

    // Step 2: Tampilkan Midtrans Snap modal
    if (!window.snap) {
      const initialized = await initializeMidtrans();
      if (!initialized) {
        throw new Error('Failed to initialize Midtrans');
      }
    }

    return new Promise((resolve) => {
      window.snap?.pay(snapToken, {
        onSuccess: (result: any) => {
          handlePaymentSuccess(result, paymentId, userId, planType, durationMonths, amount);
          resolve({ success: true });
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          resolve({ success: false, error: 'Payment pending, please complete payment' });
        },
        onError: (result: any) => {
          console.error('Payment error:', result);
          handlePaymentError(paymentId, result);
          resolve({ success: false, error: 'Payment failed' });
        },
        onClose: () => {
          console.log('Payment modal closed');
          resolve({ success: false, error: 'Payment cancelled' });
        }
      });
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment error'
    };
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (
  result: any,
  paymentId: string,
  userId: string,
  planType: string,
  durationMonths: number,
  amount: number
) => {
  try {
    // Step 1: Update payment status di database
    const updateResult = await updatePaymentStatus(
      paymentId,
      'success',
      result.transaction_id
    );

    if (!updateResult.success) {
      throw new Error('Failed to update payment status');
    }

    // Step 2: Create/Upgrade subscription
    const durationDays = durationMonths * 30;
    const subscriptionResult = await upgradeSubscription(
      userId,
      planType,
      durationDays,
      amount
    );

    if (!subscriptionResult.success) {
      throw new Error('Failed to create subscription');
    }

    // Step 3: Create webhook log untuk audit trail
    await supabase.from('webhook_logs').insert({
      user_id: userId,
      event_type: 'payment_success',
      payload: {
        transaction_id: result.transaction_id,
        plan_type: planType,
        duration_months: durationMonths,
        amount: amount
      },
      status: 'processed'
    });

    console.log('Payment success and subscription created');
  } catch (error) {
    console.error('Error handling payment success:', error);
    // TODO: Send notification to user about the issue
  }
};

/**
 * Handle failed payment
 */
const handlePaymentError = async (paymentId: string, error: any) => {
  try {
    // Update payment status
    await updatePaymentStatus(paymentId, 'failed');

    // Log error
    await supabase.from('webhook_logs').insert({
      event_type: 'payment_failed',
      payload: error,
      status: 'error',
      error_message: JSON.stringify(error)
    });

    console.error('Payment error logged:', error);
  } catch (err) {
    console.error('Error handling payment error:', err);
  }
};

/**
 * Handle webhook dari Midtrans (Backend)
 * 
 * API Endpoint: POST /api/midtrans/webhook
 * 
 * Midtrans akan send notification ke endpoint ini
 * untuk transaction status changes
 */
export const handleMidtransWebhook = async (notification: any) => {
  try {
    const {
      transaction_id,
      status_code,
      gross_amount,
      order_id,
      payment_type,
      transaction_status
    } = notification;

    // Validate webhook signature (recommended)
    // const validSignature = validateWebhookSignature(notification, serverKey);
    // if (!validSignature) throw new Error('Invalid webhook signature');

    // Map Midtrans status ke application status
    let paymentStatus: 'success' | 'failed' | 'pending';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      paymentStatus = 'success';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'failed';
    } else {
      paymentStatus = 'pending';
    }

    // Update payment_history
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_history')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      throw new Error('Payment record not found');
    }

    if (paymentData) {
      await supabase
        .from('payment_history')
        .update({
          status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transaction_id);
    }

    // Log webhook
    await supabase.from('webhook_logs').insert({
      event_type: 'midtrans_webhook',
      payload: notification,
      status: 'processed'
    });

    console.log('Webhook processed:', transaction_id, paymentStatus);
    return { success: true };
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Log error untuk debugging
    await supabase.from('webhook_logs').insert({
      event_type: 'midtrans_webhook_error',
      payload: notification,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    return { success: false, error };
  }
};

/**
 * Get payment status dari Midtrans
 * Useful untuk polling atau manual checking
 */
export const getPaymentStatus = async (transactionId: string): Promise<any> => {
  try {
    // TODO: Call backend endpoint yang akan query Midtrans API
    const response = await fetch(`/api/midtrans/transaction/${transactionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return null;
  }
};

/**
 * Cancel payment/subscription
 */
export const cancelPayment = async (transactionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // TODO: Call backend endpoint untuk cancel transaction di Midtrans
    const response = await fetch(`/api/midtrans/cancel/${transactionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to cancel payment');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cancel failed'
    };
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (
  transactionId: string,
  refundAmount?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // TODO: Call backend endpoint untuk refund di Midtrans
    const response = await fetch(`/api/midtrans/refund/${transactionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refund_amount: refundAmount })
    });

    if (!response.ok) {
      throw new Error('Failed to refund payment');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed'
    };
  }
};

/**
 * Get payment methods accepted
 */
export const getPaymentMethods = () => {
  return [
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: '💳',
      description: 'Visa, Mastercard, JCB'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      description: 'BCA, BNI, Mandiri, etc'
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      icon: '📱',
      description: 'GCash, GrabPay, OVO, Dana'
    },
    {
      id: 'gopay',
      name: 'GoPay',
      icon: '💚',
      description: 'Gojek E-Wallet'
    },
    {
      id: 'installment',
      name: 'Installment',
      icon: '💰',
      description: 'Credit Card Installment'
    }
  ];
};
