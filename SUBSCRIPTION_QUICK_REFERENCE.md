# Subscription System - Quick Reference Guide

## For Developers Integrating This System

### Quick Copy-Paste Code

#### 1. Check Subscription Status
```typescript
import { getSubscriptionStatus } from './services/subscriptionService';

const checkStatus = async (userId: string) => {
  const status = await getSubscriptionStatus(userId);
  console.log(status);
  // { is_active: true, plan_type: 'pro', days_remaining: 25, end_date: '...' }
};
```

#### 2. Get User's Plan Details
```typescript
import { getSubscription, getSubscriptionPlan } from './services/subscriptionService';

const getPlanDetails = async (userId: string) => {
  const subscription = await getSubscription(userId);
  const plan = await getSubscriptionPlan(subscription?.plan_type || 'free');
  return {
    plan: subscription,
    details: plan
  };
};
```

#### 3. Feature Gating
```typescript
import { checkPlanFeature } from './services/subscriptionService';

const handleImageGeneration = async (userId: string) => {
  const canGenerate = await checkPlanFeature(userId, 'image_generation');
  if (!canGenerate) {
    alert('Upgrade ke Basic plan atau lebih tinggi untuk akses image generation');
    return;
  }
  // Proceed with image generation
};
```

#### 4. Check Quota Usage
```typescript
import { getSubscription, getSubscriptionPlan } from './services/subscriptionService';

const checkQuota = async (userId: string, currentUsage: number) => {
  const subscription = await getSubscription(userId);
  const plan = await getSubscriptionPlan(subscription.plan_type);
  
  if (currentUsage >= plan.max_images_per_chapter) {
    alert(`Sudah mencapai limit ${plan.max_images_per_chapter} gambar per chapter`);
    return false;
  }
  return true;
};
```

#### 5. Show Upgrade Modal
```typescript
import { useState } from 'react';
import SubscriptionUpgradeModal from './components/SubscriptionUpgradeModal';
import { getSubscriptionPlans, SubscriptionPlan } from './services/subscriptionService';

const MyComponent = ({ userId }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const handleUpgradeClick = async (planName: string) => {
    const allPlans = await getSubscriptionPlans();
    const plan = allPlans.find(p => p.plan_name === planName);
    if (plan) {
      setSelectedPlan(plan);
      setShowModal(true);
    }
  };

  return (
    <>
      <button onClick={() => handleUpgradeClick('pro')}>Upgrade to Pro</button>
      {selectedPlan && (
        <SubscriptionUpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId={userId}
          plan={selectedPlan}
          onSuccess={() => {
            // Refresh subscription status
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};
```

#### 6. Integrate Status Card in Dashboard
```typescript
import SubscriptionStatusCard from './components/SubscriptionStatusCard';
import SubscriptionUpgradeModal from './components/SubscriptionUpgradeModal';
import { useState } from 'react';
import { SubscriptionPlan } from './services/subscriptionService';

const Dashboard = ({ userId }: any) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  return (
    <div>
      {/* Other dashboard content */}
      
      <SubscriptionStatusCard 
        userId={userId}
        onUpgrade={(plan) => {
          setSelectedPlan(plan);
          setShowUpgradeModal(true);
        }}
      />

      {selectedPlan && (
        <SubscriptionUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          userId={userId}
          plan={selectedPlan}
          onSuccess={() => {
            // Refresh data
          }}
        />
      )}
    </div>
  );
};
```

#### 7. Helper Functions
```typescript
import { 
  isExpiringWithinDays, 
  isExpired, 
  canUpgradeToPlan,
  planHasFeature,
  getPlanColor
} from './utils/subscriptionHelper';

// Check if expiring soon
const expiringSoon = isExpiringWithinDays(status, 7);
if (expiringSoon) {
  alert('Your subscription expiring soon. Renew now!');
}

// Check if can upgrade
const canUpgrade = canUpgradeToPlan('basic', 'pro');

// Check feature
const hasFeature = planHasFeature('pro', 'bulk_generation');

// Get colors for UI
const colors = getPlanColor('pro');
// { bg: 'bg-purple-50', border: 'border-purple-200', ... }
```

## Common Implementation Patterns

### Pattern 1: Feature Locked Content
```typescript
<div>
  {status?.plan_type === 'free' ? (
    <div className="p-4 bg-gray-100 rounded border border-gray-300">
      <p>This feature is available in Basic plan and above</p>
      <button onClick={() => showUpgradeModal()}>Upgrade Now</button>
    </div>
  ) : (
    <FullFeature />
  )}
</div>
```

### Pattern 2: Usage Alert
```typescript
const handleImageGenerate = async () => {
  const usage = currentChapter.images.length;
  const plan = await getSubscriptionPlan(subscription.plan_type);
  
  if (usage >= plan.max_images_per_chapter * 0.9) {
    // Show warning at 90% usage
    console.warn(`You've used ${usage}/${plan.max_images_per_chapter} images`);
  }
  
  if (usage >= plan.max_images_per_chapter) {
    // Block at 100%
    showUpgradePrompt();
    return;
  }
  
  // Proceed
  generateImage();
};
```

### Pattern 3: Conditional UI Rendering
```typescript
const render Features = (status: SubscriptionStatus | null) => {
  const tier = status?.plan_type || 'free';
  
  return (
    <div className="space-y-4">
      <Feature name="Text Generation" available={true} />
      <Feature 
        name="Image Generation" 
        available={tier !== 'free'} 
        plan="Basic+"
      />
      <Feature 
        name="Bulk Generation" 
        available={tier === 'pro' || tier === 'enterprise'} 
        plan="Pro+"
      />
      <Feature 
        name="API Access" 
        available={tier === 'enterprise'} 
        plan="Enterprise"
      />
    </div>
  );
};
```

## Database Queries (For Admin)

### Get All Subscriptions
```sql
SELECT 
  s.*, 
  u.email,
  sp.display_name as plan_name
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_type = sp.plan_name
ORDER BY s.created_at DESC;
```

### Get Active Subscriptions
```sql
SELECT 
  s.*, 
  u.email,
  sp.display_name
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_type = sp.plan_name
WHERE s.status = 'active' AND s.end_date > NOW();
```

### Get Expiring Soon (7 days)
```sql
SELECT 
  s.*, 
  u.email,
  (s.end_date - NOW()) as time_remaining
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active' 
  AND s.end_date > NOW() 
  AND s.end_date < NOW() + INTERVAL '7 days'
ORDER BY s.end_date ASC;
```

### Get Payment History
```sql
SELECT 
  ph.*,
  u.email,
  s.plan_type
FROM payment_history ph
JOIN auth.users u ON ph.user_id = u.id
LEFT JOIN subscriptions s ON ph.subscription_id = s.id
ORDER BY ph.created_at DESC
LIMIT 100;
```

### Revenue Report
```sql
SELECT 
  DATE_TRUNC('month', ph.created_at) as month,
  SUM(ph.amount) as total_revenue,
  COUNT(*) as payment_count,
  AVG(ph.amount) as avg_payment
FROM payment_history ph
WHERE ph.status = 'success'
GROUP BY DATE_TRUNC('month', ph.created_at)
ORDER BY month DESC;
```

## API Endpoints to Create (Backend)

### Generate Payment Token
```
POST /api/midtrans/generate-token
Body: {
  userId: string,
  planType: string,
  durationMonths: number,
  amount: number,
  userEmail: string,
  userName: string
}
Response: {
  snapToken: string,
  paymentId: string
}
```

### Webhook Handler
```
POST /api/midtrans/webhook
Body: Midtrans notification payload
Response: { status: 'ok' }
```

### Get Transaction Status
```
GET /api/midtrans/transaction/:transactionId
Response: Transaction details from Midtrans
```

## Environment Variables Needed

```env
# Frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
VITE_MIDTRANS_CLIENT_KEY=Mid-client-xxxxx

# Backend (if using Node.js)
MIDTRANS_SERVER_KEY=Mid-server-xxxxx
```

## Testing Checklist

```
Manual Testing:
☐ Load subscription status for free user
☐ Load subscription status for paid user
☐ Open subscription card and see plans
☐ Click upgrade and go through modal
☐ Select different durations
☐ Check price calculation
☐ Try payment with test card
☐ Verify subscription created in DB
☐ Check feature gating works
☐ Test quota limits

Automated Testing:
☐ Unit test getSubscriptionStatus()
☐ Unit test checkPlanFeature()
☐ Integration test payment flow
☐ Integration test subscription creation
```

## Troubleshooting

### Issue: "Cannot find module subscriptionService"
**Solution:** Make sure file exists at `services/subscriptionService.ts`

### Issue: "getSubscriptionStatus returns null"
**Solution:** 
- User may not have subscription - returns null, use free tier
- Check network request in DevTools
- Check Supabase connection

### Issue: "Payment modal doesn't appear"
**Solution:**
- Check Midtrans client key in .env
- Check Midtrans Snap JS loaded
- Check browser console for errors

### Issue: "Subscription not created after payment"
**Solution:**
- Check webhook endpoint is reachable
- Check Midtrans webhook configured
- Check database transaction logs
- Check payment_history status

## Performance Tips

1. **Cache subscription status**
   ```typescript
   const [cachedStatus, setCachedStatus] = useState(null);
   const [cacheTime, setCacheTime] = useState(0);
   
   const getStatus = async (userId) => {
     const now = Date.now();
     if (cachedStatus && now - cacheTime < 60000) { // 1 min cache
       return cachedStatus;
     }
     const status = await getSubscriptionStatus(userId);
     setCachedStatus(status);
     setCacheTime(now);
     return status;
   };
   ```

2. **Lazy load components**
   ```typescript
   const SubscriptionCard = lazy(() => import('./SubscriptionStatusCard'));
   ```

3. **Batch queries**
   ```typescript
   const [sub, plans] = await Promise.all([
     getSubscription(userId),
     getSubscriptionPlans()
   ]);
   ```

## Mobile Responsive

All components are mobile-responsive with:
- Grid layout adapts to screen size
- Touch-friendly buttons (min 44px)
- Readable text sizes
- Proper spacing on small screens

## Accessibility

Components include:
- Proper semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus states visible

## Related Documentation

- [SUBSCRIPTION_SYSTEM_COMPLETE.md](SUBSCRIPTION_SYSTEM_COMPLETE.md) - Full documentation
- [SUBSCRIPTION_IMPLEMENTATION_GUIDE.md](SUBSCRIPTION_IMPLEMENTATION_GUIDE.md) - Implementation details
- [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) - Setup guide
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - What was implemented

---

**Happy coding! 🚀**
