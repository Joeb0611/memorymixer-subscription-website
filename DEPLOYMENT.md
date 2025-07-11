# Netlify Deployment Instructions

## 📋 Quick Setup Guide

### 1. Manual Deployment (Drag & Drop)

1. **Build the site** (already done):
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Drag the `out/` folder to the deployment area
   - Or click "Deploy manually" and upload the `out/` folder

### 2. Environment Variables

Add these in Netlify Site Settings → Environment Variables:

```bash
# Stripe Configuration (Test mode first!)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=https://memory-mixer.com
```

### 3. Custom Domain Setup

1. In Netlify: Site Settings → Domain Management
2. Add custom domain: `memory-mixer.com`
3. Update DNS to point to Netlify (if not already done)

### 4. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://memory-mixer.com/.netlify/functions/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Stripe Products & Prices

Run these commands (replace with your actual product IDs):

```bash
# Create products
stripe products create --name="Basic Plan" --description="5 events, 2GB storage"
stripe products create --name="Pro Plan" --description="25 events, 10GB storage"  
stripe products create --name="Premium Plan" --description="Unlimited events, 50GB storage"

# Create prices (update product IDs)
stripe prices create --product=prod_xxx --unit-amount=999 --currency=usd --recurring[interval]=month
stripe prices create --product=prod_xxx --unit-amount=1999 --currency=usd --recurring[interval]=month
stripe prices create --product=prod_xxx --unit-amount=3999 --currency=usd --recurring[interval]=month
```

### 6. Update Price IDs

Update the price IDs in `/pages/subscribe.tsx`:
- Line 11: `priceId: 'price_1234...'` (Basic)
- Line 24: `priceId: 'price_5678...'` (Pro)  
- Line 39: `priceId: 'price_9012...'` (Premium)

## 🧪 Testing

1. **Test Mode**: Use Stripe test keys first
2. **Test Card**: 4242 4242 4242 4242
3. **Test Flow**: 
   - Go to `memory-mixer.com/subscribe?userId=test-user-id`
   - Complete payment
   - Check webhook logs in Netlify Functions
   - Verify Supabase user_profiles table updated

## 🚀 Going Live

1. Switch to Stripe live keys
2. Update webhook URL to live endpoint
3. Test with real payment method
4. Monitor Netlify Function logs

## 📁 File Structure

```
out/                     # Built files (deploy this folder)
netlify/
  functions/
    ├── create-checkout-session.ts
    └── webhook.ts
netlify.toml            # Netlify configuration
```