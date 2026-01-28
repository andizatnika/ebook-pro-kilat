# Subscription System - Complete Documentation

## System Overview

Sistem subscription yang telah diimplementasikan untuk Pro Ebook Kilat mencakup:
- 4 tier subscription plans (Free, Basic, Pro, Enterprise)
- Complete payment processing dengan Midtrans
- Automatic subscription management dan expiration
- Feature gating berdasarkan plan tier
- Payment history tracking
- Webhook logging untuk audit trail

## Architecture Diagram

```
User Registration/Login
        ↓
    Check Subscription Status
        ↓
    ├─→ Active Subscription → Show current plan + renewal option
    │
    ├─→ Expired/No Subscription → Show upgrade modal with plans
    │
    └─→ Free Tier → Limited features + show upgrade options

    Payment Flow:
    User selects plan → Initiate payment → Midtrans payment gateway
                            ↓
                    User completes payment
                            ↓
                    Webhook notification → Update payment_history
                            ↓
                    Create/Upgrade subscription → Auto-create subscription record
```

## File Structure

```
services/
├── subscriptionService.ts      # Core subscription logic
├── midtransService.ts          # Payment gateway integration
└── supabaseClient.ts           # Supabase connection

components/
├── SubscriptionStatusCard.tsx  # Display subscription status
└── SubscriptionUpgradeModal.tsx # Upgrade/payment flow UI

utils/
└── subscriptionHelper.ts       # Helper functions for subscription

features/
├── settings/
│   └── SettingsModal.tsx       # Add subscription tab
└── dashboard/
    └── Dashboard.tsx           # Show subscription info

Database:
├── subscriptions               # Main subscription data
├── subscription_plans          # Plan definitions
├── payment_history            # Payment records
└── webhook_logs               # Webhook audit trail
```

## Database Schema Details

### subscriptions table
Stores active subscriptions for each user.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  duration_days INTEGER NOT NULL,
  price_paid DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

**Fields:**
- `id`: Unique subscription identifier
- `user_id`: Foreign key to auth.users
- `plan_type`: 'free', 'basic', 'pro', 'enterprise'
- `status`: 'active', 'expired', 'cancelled', 'paused'
- `start_date`: When subscription started
- `end_date`: When subscription will expire
- `duration_days`: Total duration in days
- `price_paid`: Amount paid for this subscription
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### subscription_plans table
Master data untuk subscription plans.

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR NOT NULL,
  description TEXT,
  price_per_month DECIMAL NOT NULL,
  price_per_year DECIMAL,
  max_projects INTEGER NOT NULL,
  max_images_per_chapter INTEGER NOT NULL,
  max_chapters INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  priority_support BOOLEAN DEFAULT FALSE,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Default Plans:**

1. **Free Plan** (Rp 0)
   ```json
   {
     "plan_name": "free",
     "display_name": "Free",
     "price_per_month": 0,
     "max_projects": 2,
     "max_images_per_chapter": 5,
     "max_chapters": 10,
     "storage_gb": 1,
     "features": {
       "basic_generation": true,
       "image_generation": false,
       "priority_support": false
     }
   }
   ```

2. **Basic Plan** (Rp 49,000/bulan)
   ```json
   {
     "plan_name": "basic",
     "display_name": "Basic",
     "price_per_month": 49000,
     "max_projects": 5,
     "max_images_per_chapter": 20,
     "max_chapters": 50,
     "storage_gb": 10,
     "features": {
       "basic_generation": true,
       "image_generation": true,
       "priority_support": false
     }
   }
   ```

3. **Pro Plan** (Rp 99,000/bulan)
   ```json
   {
     "plan_name": "pro",
     "display_name": "Pro",
     "price_per_month": 99000,
     "max_projects": 999,
     "max_images_per_chapter": 50,
     "max_chapters": 200,
     "storage_gb": 100,
     "features": {
       "basic_generation": true,
       "advanced_generation": true,
       "image_generation": true,
       "bulk_generation": true,
       "priority_support": true,
       "custom_export": true
     }
   }
   ```

4. **Enterprise Plan** (Rp 299,000/bulan)
   ```json
   {
     "plan_name": "enterprise",
     "display_name": "Enterprise",
     "price_per_month": 299000,
     "max_projects": 99999,
     "max_images_per_chapter": 999,
     "max_chapters": 9999,
     "storage_gb": 1000,
     "priority_support": true,
     "features": {
       "all_features": true,
       "api_access": true,
       "custom_integrations": true,
       "dedicated_support": true
     }
   }
   ```

### payment_history table
Records semua payment transactions.

```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL NOT NULL,
  payment_method VARCHAR NOT NULL,
  transaction_id VARCHAR UNIQUE,
  status VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_transaction_id ON payment_history(transaction_id);
```

### webhook_logs table
Audit trail untuk webhook dari payment gateway.

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  event_type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Service Functions

### subscriptionService.ts

#### 1. getSubscriptionStatus(userId)
```typescript
// Returns current subscription status
const status = await getSubscriptionStatus(user.id);
// Returns: { is_active: boolean, plan_type: string, days_remaining: number, end_date: string }

// Example:
// { 
//   is_active: true, 
//   plan_type: 'pro', 
//   days_remaining: 25, 
//   end_date: '2024-02-15T10:30:00Z'
// }
```

#### 2. getSubscription(userId)
```typescript
// Get full subscription record
const subscription = await getSubscription(user.id);
// Returns: Subscription object with all details
```

#### 3. createSubscription(userId, planType, durationDays, pricePaid)
```typescript
// Create new subscription for user
const result = await createSubscription(
  user.id,
  'pro',      // plan type
  30,         // duration in days
  99000       // price paid in IDR
);
// Returns: { success: boolean, subscription?: Subscription, error?: string }
```

#### 4. upgradeSubscription(userId, newPlanType, durationDays, pricePaid)
```typescript
// Upgrade to different plan
const result = await upgradeSubscription(
  user.id,
  'enterprise',  // new plan
  30,           // duration
  299000        // price
);
```

#### 5. cancelSubscription(userId)
```typescript
// Soft delete - user keeps access until end_date
const result = await cancelSubscription(user.id);
// Status set to 'cancelled' but subscription still valid until expiry
```

#### 6. renewSubscription(userId, durationDays, pricePaid)
```typescript
// Extend existing subscription
const result = await renewSubscription(
  user.id,
  30,        // add 30 more days
  99000      // payment amount
);
```

#### 7. getSubscriptionPlans()
```typescript
// Get all active plans
const plans = await getSubscriptionPlans();
// Returns: SubscriptionPlan[] array with all 4 plans
```

#### 8. checkPlanFeature(userId, featureName)
```typescript
// Check if user can use a feature
const canGenerate = await checkPlanFeature(user.id, 'image_generation');
if (!canGenerate) {
  // Show upgrade prompt
}
```

### subscriptionHelper.ts

Utility functions untuk subscription logic:

```typescript
// Check if subscription expiring soon
isExpiringWithinDays(status, 7)  // true if expiring in 7 days

// Check if expired
isExpired(status)  // true if no longer active

// Format days remaining
formatDaysRemaining(25)  // "25 days left"

// Plan comparison
canUpgradeToPlan('basic', 'pro')  // true

// Get plan colors for UI
getPlanColor('pro')  // { bg: 'bg-purple-50', border: '...', ... }

// Feature checking
planHasFeature('pro', 'bulk_generation')  // true
```

## UI Components

### SubscriptionStatusCard.tsx

Display subscription status dan plan options.

```tsx
<SubscriptionStatusCard 
  userId={user.id}
  onUpgrade={(plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  }}
/>
```

Features:
- Show current plan dengan badge
- Display days remaining
- Warning jika 7 hari atau kurang
- Plan selection grid dengan pricing
- Responsive design

### SubscriptionUpgradeModal.tsx

2-step modal untuk upgrade/payment.

```tsx
<SubscriptionUpgradeModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  userId={user.id}
  plan={selectedPlan}
  onSuccess={() => {
    // Refresh after payment
    getSubscriptionStatus(user.id);
  }}
/>
```

Step 1 - Plan Selection:
- Display plan details
- Duration selection (1, 3, 6 months)
- Price calculation
- Discount info

Step 2 - Payment:
- Payment method selection
- Confirmation
- Process payment

## Payment Integration (Midtrans)

### Setup

1. **Register Midtrans Account**
   - Go to https://midtrans.com
   - Create business account
   - Complete verification

2. **Get API Keys**
   - Login to Midtrans dashboard
   - Settings → Access Keys
   - Copy Server Key dan Client Key

3. **Add to Environment**
   ```env
   VITE_MIDTRANS_CLIENT_KEY=your_client_key_here
   VITE_MIDTRANS_SERVER_KEY=your_server_key (backend only)
   ```

### Implementation

#### Frontend - Initiate Payment
```typescript
import { initiatePayment, initializeMidtrans } from './services/midtransService';

// Initialize Midtrans (call once when app loads)
await initializeMidtrans();

// When user clicks "Pay Now"
const result = await initiatePayment({
  userId: user.id,
  planType: 'pro',
  durationMonths: 1,
  amount: 99000,
  userEmail: user.email,
  userName: user.user_metadata.name
});

if (result.success) {
  // Payment completed, subscription created
  // Refresh UI
  await getSubscriptionStatus(user.id);
}
```

#### Backend - Generate Payment Token

Create `/api/midtrans/generate-token` endpoint:

```typescript
// Backend endpoint (Node.js/Express example)
import midtransClient from 'midtrans-client';

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

app.post('/api/midtrans/generate-token', async (req, res) => {
  const { userId, planType, durationMonths, amount, userEmail, userName } = req.body;

  try {
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${userId}-${Date.now()}`,
        gross_amount: amount
      },
      customer_details: {
        email: userEmail,
        first_name: userName
      },
      item_details: [{
        id: planType,
        price: amount,
        quantity: 1,
        name: `${planType.toUpperCase()} Plan - ${durationMonths} months`
      }]
    };

    const token = await snap.createTransaction(parameter);
    
    // Create payment record dengan status 'pending'
    // await createPayment(userId, '', amount, 'midtrans')
    
    res.json({
      snapToken: token.token,
      paymentId: token.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Backend - Webhook Handler

Create `/api/midtrans/webhook` endpoint:

```typescript
app.post('/api/midtrans/webhook', async (req, res) => {
  try {
    const { transaction_id, transaction_status } = req.body;

    // Validate signature (important!)
    const isVerified = snap.transaction.notification(req.body);
    if (!isVerified) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process payment berdasarkan transaction_status
    if (transaction_status === 'settlement') {
      // Payment success - create subscription
      // await upgradeSubscription(...)
    } else if (transaction_status === 'expire' || transaction_status === 'deny') {
      // Payment failed
      // update payment_history status
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Feature Gating

### Check Feature Availability

```typescript
import { planHasFeature } from './utils/subscriptionHelper';

// In WriterWorkspace.tsx
const handleGenerateImage = async () => {
  const subscription = await getSubscription(userId);
  
  if (!planHasFeature(subscription.plan_type, 'image_generation')) {
    alert('Image generation hanya tersedia untuk subscriber');
    // Show upgrade modal
    return;
  }
  
  // Proceed with image generation
};
```

### Usage Quota Checking

```typescript
// Check max images per chapter
const currentImages = chapter.images.length;
const subscription = await getSubscription(userId);
const plan = await getSubscriptionPlan(subscription.plan_type);

if (currentImages >= plan.max_images_per_chapter) {
  alert(`Sudah mencapai limit ${plan.max_images_per_chapter} gambar per chapter`);
  return;
}
```

## Monitoring & Analytics

### View Subscription Data

```typescript
// Get all user subscriptions (admin)
const { data: subscriptions } = await supabase
  .from('subscriptions')
  .select('*')
  .order('created_at', { ascending: false });

// Get payment history
const { data: payments } = await supabase
  .from('payment_history')
  .select('*')
  .eq('user_id', userId);

// Get webhook logs
const { data: logs } = await supabase
  .from('webhook_logs')
  .select('*')
  .order('created_at', { ascending: false });
```

### Metrics to Track

1. **Conversion Rate**
   - Free users → Paid users
   - Upgrade rate

2. **Revenue**
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - Payment success rate

3. **Churn Rate**
   - Subscription cancellations
   - Expired subscriptions not renewed

4. **Plan Distribution**
   - Users per plan tier
   - Average subscription value

## Security Considerations

### 1. RLS Policies
All tables have RLS enabled:
```sql
-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users cannot directly update subscriptions
CREATE POLICY "Only system can update subscriptions"
ON subscriptions FOR UPDATE
USING (FALSE);
```

### 2. Webhook Validation
Always validate webhook signature dari Midtrans:
```typescript
const isValid = snap.transaction.notification(payload);
if (!isValid) {
  // Reject webhook
  throw new Error('Invalid signature');
}
```

### 3. Payment Security
- Never expose Server Key di frontend
- Generate Snap token di backend saja
- Validate transaction amount di backend

## Troubleshooting

### Issue: "Snap token not generated"
**Solution:**
- Check Midtrans credentials di .env
- Verify Midtrans Snap JS loaded correctly
- Check browser console untuk errors

### Issue: "Subscription tidak created setelah payment"
**Solution:**
- Check webhook logs untuk error messages
- Verify webhook endpoint is accessible
- Check database transactions

### Issue: "User masih bisa access features after expiry"
**Solution:**
- Run `auto_expire_subscriptions()` function
- Check subscription status caching
- Clear browser cache

## Next Steps

1. **Implement Email Notifications**
   - Welcome email saat subscription created
   - Renewal reminder 7 hari sebelum expiry
   - Expiry notification

2. **Create Admin Dashboard**
   - View all subscriptions
   - View revenue analytics
   - Manual subscription management

3. **Implement Cron Jobs**
   - Auto-expire subscriptions
   - Send renewal reminders
   - Generate revenue reports

4. **Add More Payment Methods**
   - PayPal integration
   - Apple Pay / Google Pay
   - Cryptocurrency

5. **Implement Usage Analytics**
   - Track feature usage per plan
   - Identify underutilized features
   - Optimize plan offerings

## Testing Checklist

- [ ] Create free subscription
- [ ] Upgrade to paid plan
- [ ] Verify payment processing
- [ ] Check subscription status updates
- [ ] Test feature gating
- [ ] Test quota limits
- [ ] Verify auto-expiration
- [ ] Test webhook notifications
- [ ] Check payment history
- [ ] Verify RLS policies
