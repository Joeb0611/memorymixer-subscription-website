import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    priceId: null, // No Stripe price needed for free
    features: [
      '5GB storage',
      '2 guests per event (authenticated only)',
      'Unlimited retention',
      'No QR code access',
      'Event packages required for more guests'
    ],
    isFree: true
  },
  {
    id: 'essential',
    name: 'Essential Plan',
    price: '$10',
    priceYearly: '$99',
    priceId: 'price_essential_monthly', // Replace with actual Stripe Price ID
    priceIdYearly: 'price_essential_yearly', // Replace with actual Stripe Price ID
    features: [
      '50GB storage',
      '10 guests per event (authenticated only)',
      'Unlimited retention',
      'Priority support',
      '20-29% discount on event packages',
      'Event packages still required for QR codes'
    ],
    popular: true
  }
]

const eventPackages = [
  {
    id: 'small',
    name: 'Small Event',
    guests: 'Up to 25 guests',
    price: '$15',
    subscriberPrice: '$12',
    discount: '20% off',
    priceId: 'price_event_small', // Replace with actual Stripe Price ID
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery']
  },
  {
    id: 'medium',
    name: 'Medium Event',
    guests: 'Up to 50 guests',
    price: '$25',
    subscriberPrice: '$20',
    discount: '20% off',
    priceId: 'price_event_medium',
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery']
  },
  {
    id: 'large',
    name: 'Large Event',
    guests: 'Up to 100 guests',
    price: '$45',
    subscriberPrice: '$35',
    discount: '22% off',
    priceId: 'price_event_large',
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery']
  },
  {
    id: 'xl',
    name: 'XL Event',
    guests: 'Up to 200 guests',
    price: '$75',
    subscriberPrice: '$55',
    discount: '27% off',
    priceId: 'price_event_xl',
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery']
  },
  {
    id: 'mega',
    name: 'Mega Event',
    guests: '200+ guests',
    price: '$120',
    subscriberPrice: '$85',
    discount: '29% off',
    priceId: 'price_event_mega',
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery']
  }
]

export default function Subscribe() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [activeTab, setActiveTab] = useState<'subscription' | 'events'>('subscription')

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!priceId) {
      alert('Free plan is already active!')
      return
    }

    setLoading(planName)

    try {
      // Get user ID from URL params or authentication
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get('userId')
      const eventId = urlParams.get('eventId') // For event packages

      if (!userId) {
        alert('Please log in from the app first')
        return
      }

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          planName,
          eventId,
          mode: activeTab === 'events' ? 'payment' : 'subscription',
        }),
      })

      const { sessionId } = await response.json()

      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        console.error('Error:', error)
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MemoryMixer Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose your subscription plan and add event packages as needed
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Event Packages
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {activeTab === 'subscription' && (
          <div>
            {/* Billing Period Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    billingPeriod === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    billingPeriod === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Yearly <span className="text-green-600 text-sm">(Save 17%)</span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                    plan.popular ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      {billingPeriod === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.price}
                    </div>
                    <div className="text-gray-500">
                      {plan.isFree ? 'Forever free' : `per ${billingPeriod === 'yearly' ? 'year' : 'month'}`}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(
                      billingPeriod === 'yearly' && plan.priceIdYearly ? plan.priceIdYearly : plan.priceId,
                      plan.id
                    )}
                    disabled={loading === plan.id}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.isFree
                        ? 'bg-gray-100 text-gray-600 cursor-default'
                        : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.id ? 'Loading...' : plan.isFree ? 'Current Plan' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Packages */}
        {activeTab === 'events' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Packages</h2>
              <p className="text-gray-600">One-time purchases that include QR code access for your event</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {eventPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                    <p className="text-gray-600 mb-3">{pkg.guests}</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl font-bold text-blue-600">{pkg.subscriberPrice}</span>
                      <span className="text-lg text-gray-400 line-through">{pkg.price}</span>
                    </div>
                    <p className="text-sm text-green-600 font-medium">{pkg.discount} for subscribers</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(pkg.priceId, pkg.id)}
                    disabled={loading === pkg.id}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === pkg.id ? 'Loading...' : 'Purchase Package'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600">
            {activeTab === 'subscription' 
              ? 'All subscription plans include a 30-day money-back guarantee. Cancel anytime.'
              : 'Event packages are one-time purchases. No recurring charges.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}