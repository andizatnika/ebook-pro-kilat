# Subscription System Implementation Guide

## Overview
Sistem subscription yang telah disetup untuk Pro Ebook Kilat memungkinkan monetisasi aplikasi dengan multiple tier plans, payment tracking, dan automatic expiration management.

## Database Schema

### Tables Created

#### 1. **subscriptions**
Menyimpan subscription data untuk setiap user.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, indexed)
- plan_type: VARCHAR (free, basic, pro, enterprise)
- status: VARCHAR (active, expired, cancelled, paused)
- start_date: TIMESTAMP
- end_date: TIMESTAMP (indexed)
- duration_days: INTEGER
- price_paid: DECIMAL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. **subscription_plans**
Master data untuk 4 tier plans yang tersedia.
```sql
- id: UUID (primary key)
- plan_name: VARCHAR (unique)
- display_name: VARCHAR
- description: TEXT
- price_per_month: DECIMAL (in IDR)
- max_projects: INTEGER
- max_images_per_chapter: INTEGER
- max_chapters: INTEGER
- storage_gb: INTEGER
- priority_support: BOOLEAN
- features: JSONB (key-value untuk feature flags)
- is_active: BOOLEAN
```

**Default Plans:**
1. **Free** - Rp 0/bulan
   - 2 projects
   - 5 images per chapter
   - 10 chapters max
   - 1 GB storage

2. **Basic** - Rp 49,000/bulan
   - 5 projects
   - 20 images per chapter
   - 50 chapters max
   - 10 GB storage

3. **Pro** - Rp 99,000/bulan
   - Unlimited projects
   - 50 images per chapter
   - 200 chapters max
   - 100 GB storage
   - Priority support

4. **Enterprise** - Rp 299,000/bulan
   - Unlimited everything
   - Priority support
   - Custom features

#### 3. **payment_history**
Mencatat setiap transaksi payment.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, indexed)
- subscription_id: UUID (references subscriptions)
- amount: DECIMAL
- payment_method: VARCHAR (card, transfer, ewallet)
- transaction_id: VARCHAR
- status: VARCHAR (pending, success, failed)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. **webhook_logs**
Log untuk payment gateway webhooks (untuk Midtrans integration).
```sql
- id: UUID (primary key)
- user_id: UUID (nullable)
- event_type: VARCHAR
- payload: JSONB
- status: VARCHAR (processed, pending, error)
- error_message: TEXT (nullable)
- created_at: TIMESTAMP
```

## Services Available

### subscriptionService.ts

#### Core Functions

**1. getSubscriptionStatus(userId: string)**
- Mengembalikan subscription status real-time
- Returns: `{ is_active, plan_type, days_remaining, end_date }`
- Fungsi akan otomatis return free tier jika user belum punya subscription

**2. getSubscription(userId: string)**
- Get full subscription record dari database
- Returns: Subscription object

**3. createSubscription(userId, planType, durationDays, pricePaid)**
- Buat subscription baru atau update yang existing
- Automatically sets start_date dan end_date
- Returns: `{ success, subscription?, error? }`

**4. upgradeSubscription(userId, newPlanType, durationDays, pricePaid)**
- Upgrade ke plan yang lebih tinggi
- Sets status ke 'active'
- Returns: `{ success, subscription?, error? }`

**5. cancelSubscription(userId)**
- Soft delete - sets status ke 'cancelled'
- User bisa tetap menggunakan sampai end_date
- Returns: `{ success, error? }`

**6. renewSubscription(userId, durationDays, pricePaid)**
- Extend subscription yang sudah exist
- Automatically adds duration_days ke end_date
- Returns: `{ success, subscription?, error? }`

**7. getSubscriptionPlans()**
- Get semua active plans
- Returns: `SubscriptionPlan[]`

**8. checkPlanFeature(userId, featureName)**
- Check apakah user bisa access feature tertentu
- Useful untuk feature gating
- Returns: `boolean`

## UI Components

### 1. SubscriptionStatusCard.tsx
Menampilkan subscription status dan plan selection.

**Props:**
- `userId: string` - User ID
- `onUpgrade?: (plan) => void` - Callback saat plan dipilih

**Features:**
- Show current plan dengan color coding
- Show days remaining sampai expiry
- Warning jika tinggal 7 hari atau kurang
- Plan selection grid dengan pricing dan features
- Responsive design

### 2. SubscriptionUpgradeModal.tsx
Modal untuk proses upgrade dengan 2 steps.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `userId: string`
- `plan: SubscriptionPlan`
- `onSuccess?: () => void`

**Step 1 - Plan:**
- Display plan details
- Duration selection (1, 3, 6 bulan)
- Price summary dengan perhitungan
- Discount info untuk 3/6 bulan

**Step 2 - Payment:**
- Payment method selection (Card, Transfer, E-wallet)
- Confirmation dengan total amount
- Loading state saat processing

## Integration Steps

### 1. Update App.tsx
```tsx
import SubscriptionStatusCard from './components/SubscriptionStatusCard';
import SubscriptionUpgradeModal from './components/SubscriptionUpgradeModal';
import { getSubscriptionStatus } from './services/subscriptionService';

// Add state untuk subscription modal
const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
const [selectedPlan, setSelectedPlan] = useState(null);

// Check subscription status saat user login
useEffect(() => {
  if (user?.id) {
    getSubscriptionStatus(user.id);
  }
}, [user?.id]);

// Add ke UI
{user && (
  <>
    <SubscriptionStatusCard 
      userId={user.id}
      onUpgrade={(plan) => {
        setSelectedPlan(plan);
        setShowSubscriptionModal(true);
      }}
    />
    <SubscriptionUpgradeModal 
      isOpen={showSubscriptionModal}
      onClose={() => setShowSubscriptionModal(false)}
      userId={user.id}
      plan={selectedPlan}
      onSuccess={() => {
        // Refresh subscription status
        getSubscriptionStatus(user.id);
      }}
    />
  </>
)}
```

### 2. Add Feature Gating
```tsx
import { checkPlanFeature, getSubscription } from './services/subscriptionService';

// Dalam WriterWorkspace.tsx
const handleGenerateImage = async () => {
  const canGenerate = await checkPlanFeature(userId, 'image_generation');
  if (!canGenerate) {
    alert('Feature ini hanya tersedia untuk subscriber');
    return;
  }
  // ... generate image logic
};
```

### 3. Add Quota Checking
```tsx
// Dalam WriterWorkspace.tsx
const checkQuota = async () => {
  const subscription = await getSubscription(userId);
  const plan = await getSubscriptionPlan(subscription.plan_type);
  
  const currentImages = selectedChapter?.images?.length || 0;
  if (currentImages >= plan.max_images_per_chapter) {
    alert(`Quota gambar per chapter sudah habis (${plan.max_images_per_chapter})`);
    return false;
  }
  return true;
};
```

## Database Migration

### Run SQL Migration
1. Buka Supabase Dashboard
2. Go to SQL Editor
3. Copy-paste SUBSCRIPTION_MIGRATION.sql
4. Execute query

### Important RLS Policies
- Users hanya bisa melihat subscription mereka sendiri
- Users hanya bisa update subscription status melalui functions
- Admin bisa manage payment_history dan webhook_logs

## Payment Gateway Integration (Midtrans - Recommended)

### Install Package
```bash
npm install midtrans-client
```

### Create Midtrans Service
```typescript
// services/midtransService.ts
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.REACT_APP_MIDTRANS_SERVER_KEY,
  clientKey: process.env.REACT_APP_MIDTRANS_CLIENT_KEY,
});

export const generatePaymentToken = async (userId: string, amount: number) => {
  // Generate Snap token untuk payment
};

export const handlePaymentNotification = async (notification: any) => {
  // Process webhook dari Midtrans
  // Update payment_history status
  // Trigger subscription creation/upgrade
};
```

## Key Features

### Auto-Expiration
Setiap jam, function `auto_expire_subscriptions()` dijalankan untuk:
- Set status 'expired' untuk subscription yang sudah past end_date
- Bisa trigger notification ke user

### Subscription Status Check
Query `check_subscription_status()` mengembalikan:
- Apakah subscription aktif
- Plan type
- Days remaining
- End date

### Feature Flags
Setiap plan punya JSONB `features` field:
```json
{
  "image_generation": true,
  "priority_support": true,
  "custom_export": true,
  "bulk_generation": false
}
```

## Testing

### Test Subscription Creation
```typescript
const result = await createSubscription(
  'test-user-id',
  'pro',
  30,  // 30 days
  99000  // price
);
console.log(result);
```

### Test Feature Gating
```typescript
const canUseFeature = await checkPlanFeature('test-user-id', 'image_generation');
console.log(canUseFeature); // true/false
```

### Test Status Check
```typescript
const status = await getSubscriptionStatus('test-user-id');
console.log(status); // { is_active: true, plan_type: 'pro', ... }
```

## Next Steps

1. **Setup Midtrans Account**
   - Register di https://midtrans.com
   - Get Server Key dan Client Key
   - Add ke .env

2. **Create Payment Webhook Handler**
   - API endpoint untuk receive webhook dari Midtrans
   - Parse notification dan update payment_history
   - Trigger subscription creation/upgrade

3. **Implement Email Notifications**
   - Welcome email saat subscription dibuat
   - Reminder email 7 hari sebelum expiry
   - Renewal confirmation

4. **Create Admin Dashboard**
   - View all subscriptions
   - View payment history
   - Manual subscription management
   - Analytics dan reports

5. **Add Usage Analytics**
   - Track image generation per user
   - Track storage usage
   - Alert jika approaching quota

## Security Considerations

1. **API Key Protection**
   - Sensitive data encrypted di database
   - RLS policies enforce user isolation
   - Payment details never stored in plain text

2. **Webhook Validation**
   - Validate signature dari payment gateway
   - Idempotency checks untuk prevent duplicate processing
   - Log semua webhook activity

3. **Rate Limiting**
   - Limit API calls based on plan
   - Prevent abuse dari free tier users

## Pricing Strategy

Current pricing dalam IDR (Indonesian Rupiah):
- **Free**: Rp 0
- **Basic**: Rp 49,000/bulan (≈ USD 3.3)
- **Pro**: Rp 99,000/bulan (≈ USD 6.7)
- **Enterprise**: Rp 299,000/bulan (≈ USD 20)

Recommendation untuk marketing:
- Offer 7-day free trial untuk Basic/Pro
- Bundle pricing (save 10% for 6 months)
- Annual billing discount (save 15%)
