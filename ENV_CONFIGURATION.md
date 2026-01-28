# Environment Configuration for Pro Ebook Kilat

## Supabase Configuration
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get dari: https://app.supabase.com → Settings → API

## Google Gemini API
```env
# Generated dari user di settings modal (stored in localStorage)
# No .env needed - user provides their own API key
```

## Midtrans Payment Gateway

### Sandbox (Testing)
```env
VITE_MIDTRANS_CLIENT_KEY=YOUR_SANDBOX_CLIENT_KEY
VITE_MIDTRANS_SERVER_KEY=YOUR_SANDBOX_SERVER_KEY  # Backend only!
```

### Production
```env
VITE_MIDTRANS_CLIENT_KEY=YOUR_PRODUCTION_CLIENT_KEY
VITE_MIDTRANS_SERVER_KEY=YOUR_PRODUCTION_SERVER_KEY  # Backend only!
```

Get dari: https://dashboard.midtrans.com → Settings → Access Keys

## Environment Setup Guide

### 1. Create .env.local file in project root

```
# Frontend (.env.local)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
VITE_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxx
```

### 2. Backend .env (untuk server)

```
# Backend (.env)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxxxxxxxxxx

MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxx

# Server configuration
PORT=3001
NODE_ENV=production
```

### 3. Important Security Notes

**DO NOT commit these files:**
- .env (backend)
- .env.local (frontend - untuk development only)

**Server Key Security:**
- NEVER expose MIDTRANS_SERVER_KEY di frontend
- Keep di backend saja
- Use di endpoint untuk generate token saja

## Midtrans API Keys Setup

### Step-by-step:

1. **Register Midtrans Account**
   - Go to https://midtrans.com
   - Click "Daftar"
   - Fill business information
   - Email verification

2. **Get API Keys**
   - Dashboard → Konfigurasi → Kunci Akses
   - Copy "Client Key" (untuk frontend)
   - Copy "Server Key" (untuk backend - jangan share)

3. **Sandbox Testing**
   - Use sandbox keys untuk testing
   - Sandbox URL: app.sandbox.midtrans.com
   - Real payment tidak akan diproses

4. **Production Activation**
   - After testing, apply untuk production
   - Midtrans akan review
   - Get production keys
   - Switch URLs

## Testing with Midtrans Sandbox

### Test Card Numbers

```
Visa Debit (Success)
4811111111111114
CVV: 123
Exp: 12/25

Visa Credit (Success)
4111111111111111
CVV: 123
Exp: 12/25

Mastercard (Denied)
5555555555554444
CVV: 123
Exp: 12/25

Mastercard (Pending)
5105105105105100
CVV: 123
Exp: 12/25
```

### Test Bank Transfer

```
BCA Transfer
- Bank code: 014
- Account: 1234567890
```

### Webhook Testing

Midtrans dashboard → Tools → Webhook Testing
- Select event type
- Send test notification
- Your webhook endpoint akan receive it

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env.local
```bash
cp .env.example .env.local
# Edit dengan API keys Anda
```

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Test Payment Flow

1. Go to http://localhost:5173
2. Login dengan test account
3. Click upgrade plan
4. Use test card numbers dari Midtrans
5. Check database untuk payment record

## Production Deployment

### 1. Supabase

```bash
# Run migrations
supabase db push

# Or manual via Supabase Studio
# SQL Editor → Paste SUBSCRIPTION_MIGRATION.sql
```

### 2. Environment Variables

Set di deployment platform (Vercel, Netlify, etc):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MIDTRANS_CLIENT_KEY
```

For backend (jika pakai):
```
SUPABASE_URL
SUPABASE_KEY
MIDTRANS_SERVER_KEY
```

### 3. Configure Webhook

Di Midtrans dashboard:
- Settings → Konfigurasi → Notifikasi
- HTTP POST URL: https://yourdomain.com/api/midtrans/webhook
- Save

### 4. Switch to Production Keys

```env
# Update ke production keys
VITE_MIDTRANS_CLIENT_KEY=Mid-client-prod-xxxxx

# Update Midtrans service URL
SNAP_SCRIPT_URL='https://app.midtrans.com/snap/snap.js'  // dari sandbox
```

## Troubleshooting

### "Midtrans not defined"
- Check VITE_MIDTRANS_CLIENT_KEY di .env.local
- Ensure .env.local file exists
- Run `npm run dev` again

### "Snap token generation failed"
- Verify Server Key di backend
- Check network request di DevTools
- Check backend logs

### "Webhook not received"
- Verify webhook URL di Midtrans dashboard
- Check firewall tidak block
- Check backend logs

### Payment tidak create subscription
- Check webhook endpoint is reachable
- Verify webhook signature validation
- Check database logs

## Environment Variables Checklist

```
Frontend (.env.local):
☐ VITE_SUPABASE_URL
☐ VITE_SUPABASE_ANON_KEY
☐ VITE_MIDTRANS_CLIENT_KEY

Backend (if using):
☐ SUPABASE_URL
☐ SUPABASE_KEY
☐ MIDTRANS_SERVER_KEY
☐ PORT
☐ NODE_ENV

Database (Supabase SQL):
☐ subscriptions table
☐ subscription_plans table
☐ payment_history table
☐ webhook_logs table
☐ RLS policies
☐ Functions (auto_expire_subscriptions, check_subscription_status)
```

## Quick Links

- Supabase: https://app.supabase.com
- Midtrans: https://dashboard.midtrans.com
- Midtrans Docs: https://docs.midtrans.com
- Google Cloud Console: https://console.cloud.google.com
