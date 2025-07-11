import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const sig = event.headers['stripe-signature']
  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.log('Webhook signature verification failed:', err.message)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    }
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription') {
        await handleSuccessfulSubscription(session)
      } else if (session.mode === 'payment') {
        await handleSuccessfulEventPurchase(session)
      }
      break

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = stripeEvent.data.object as Stripe.Subscription
      await handleSubscriptionChange(subscription)
      break

    case 'invoice.payment_succeeded':
      const invoice = stripeEvent.data.object as Stripe.Invoice
      await handlePaymentSucceeded(invoice)
      break

    case 'invoice.payment_failed':
      const failedInvoice = stripeEvent.data.object as Stripe.Invoice
      await handlePaymentFailed(failedInvoice)
      break

    default:
      console.log(`Unhandled event type ${stripeEvent.type}`)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  }
}

async function handleSuccessfulSubscription(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planName = session.metadata?.planName

  if (!userId || !planName) {
    console.error('Missing metadata in session:', session.id)
    return
  }

  // Update user's subscription in Supabase
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_plan: planName,
      subscription_status: 'active',
      subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription activated for user ${userId}`)
  }
}

async function handleSuccessfulEventPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planName = session.metadata?.planName
  const eventId = session.metadata?.eventId

  if (!userId || !planName) {
    console.error('Missing metadata in session:', session.id)
    return
  }

  // Record the event package purchase
  const { error: purchaseError } = await supabase
    .from('event_purchases')
    .insert({
      user_id: userId,
      event_id: eventId,
      package_type: planName,
      stripe_payment_intent_id: session.payment_intent,
      amount: session.amount_total,
      currency: session.currency,
      purchased_at: new Date().toISOString(),
    })

  if (purchaseError) {
    console.error('Error recording event purchase:', purchaseError)
  } else {
    console.log(`Event package purchased for user ${userId}, event ${eventId}`)
  }

  // If event exists, update it to enable QR code
  if (eventId) {
    const { error: eventError } = await supabase
      .from('events')
      .update({
        has_qr_code: true,
        qr_code_enabled: true,
      })
      .eq('id', eventId)

    if (eventError) {
      console.error('Error updating event QR code status:', eventError)
    } else {
      console.log(`QR code enabled for event ${eventId}`)
    }
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  const status = subscription.status === 'active' ? 'active' : 'inactive'
  const expiryDate = new Date(subscription.current_period_end * 1000).toISOString()

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: status,
      subscription_expiry: expiryDate,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription status:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`)
}