<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uOt4_x0WOr0Y03nlBQrof1u0ZhyIS21R

## 🚀 Quick Start - API Key Setup

⭐ **NEW**: Each user now stores their own API key in the database!

### Setup (5 minutes)
1. Run: [DATABASE_MIGRATION.sql](DATABASE_MIGRATION.sql) in Supabase
2. Run: `npm run dev`
3. Create new account and test SetupApiKeyModal

👉 **See [QUICK_START.md](QUICK_START.md) for detailed instructions**

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase in `services/supabaseClient.ts`

3. Run the app:
   ```bash
   npm run dev
   ```

4. **NEW**: Setup database (see QUICK_START.md)

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - 5-min setup guide
- [API_KEY_SETUP.md](API_KEY_SETUP.md) - Complete guide
- [INDEX.md](INDEX.md) - All documentation
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick lookup

## ✨ Key Features

✅ Per-user API key storage  
✅ Automatic setup modal  
✅ Free tier compatible  
✅ Secure with RLS policies  
✅ Easy updates in Settings

## 🔑 API Key Management

### For New Users
SetupApiKeyModal appears automatically after login - just paste your API key!

### For Existing Users
Settings → API Key tab → Update

See [API_KEY_SETUP.md](API_KEY_SETUP.md) for complete guide.
