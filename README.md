# MemoryMixer Subscription Website

This is the subscription management website for MemoryMixer that handles payments via Stripe and updates the Supabase database.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 3. Stripe Setup

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: 
   - Dashboard → Developers → API Keys
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`

3. **Create Products & Prices**:
   ```bash
   # Basic Plan
   stripe products create --name="Basic Plan" --description="5 events, 2GB storage"
   stripe prices create --product=prod_xxx --unit-amount=999 --currency=usd --recurring[interval]=month

   # Pro Plan  
   stripe products create --name="Pro Plan" --description="25 events, 10GB storage"
   stripe prices create --product=prod_xxx --unit-amount=1999 --currency=usd --recurring[interval]=month

   # Premium Plan
   stripe products create --name="Premium Plan" --description="Unlimited events, 50GB storage"
   stripe prices create --product=prod_xxx --unit-amount=3999 --currency=usd --recurring[interval]=month
   ```

4. **Update Price IDs**: Replace the `priceId` values in `pages/subscribe.tsx` with your actual Stripe Price IDs

5. **Setup Webhooks**:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://memory-mixer.com/api/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Supabase Setup

1. **Add Database Columns**: Run this SQL in Supabase:
   ```sql
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
   ```

2. **Get Service Role Key**:
   - Settings → API → service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Deploy to Netlify

1. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: out
   ```

2. **Environment Variables**: Add all environment variables from `.env.local`

3. **Domain Setup**:
   - Point `memory-mixer.com` to this deployment
   - Update app URLs to use `https://memory-mixer.com/subscribe`

### 6. Update Flutter App

Update the subscription service URL:
```dart
// In lib/services/subscription_service.dart
const subscriptionUrl = 'https://memory-mixer.com/subscribe';
```

## Usage

### From Flutter App
When users click "Manage Subscription", they'll be redirected to:
```
https://memory-mixer.com/subscribe?userId=USER_ID
```

### Flow
1. User selects plan → Stripe Checkout
2. Payment succeeds → Webhook updates Supabase
3. User returns to app with updated subscription

## Testing

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any expiry date in the future
- Any CVC

## Security Notes

- ✅ No pricing in Flutter app (App Store compliant)
- ✅ All payments processed on web
- ✅ Webhooks verify Stripe signatures
- ✅ Service role key used for database updates
- ✅ User validation before checkout