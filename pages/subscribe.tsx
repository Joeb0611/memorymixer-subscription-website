import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'

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
    priceId: 'price_1RkG2YEFAytNXjkFN4BaNZhJ', // Essential Plan Monthly
    priceIdYearly: 'price_1RkG2ZEFAytNXjkFhblMyO2d', // Essential Plan Yearly
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
    priceId: 'price_1RkG2xEFAytNXjkF3ogIxFxl', // Small Event Regular
    subscriberPriceId: 'price_1RkG2zEFAytNXjkFUTOkrKvQ', // Small Event Subscriber
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery', 'Built-in buffer for incognito users']
  },
  {
    id: 'medium',
    name: 'Medium Event',
    guests: 'Up to 50 guests',
    price: '$25',
    subscriberPrice: '$20',
    discount: '20% off',
    priceId: 'price_1RkG30EFAytNXjkFJ1nKK9KV', // Medium Event Regular
    subscriberPriceId: 'price_1RkG31EFAytNXjkFfY3MlG5E', // Medium Event Subscriber
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery', 'Built-in buffer for incognito users']
  },
  {
    id: 'large',
    name: 'Large Event',
    guests: 'Up to 100 guests',
    price: '$45',
    subscriberPrice: '$35',
    discount: '22% off',
    priceId: 'price_1RkG32EFAytNXjkFsFZAagbj', // Large Event Regular
    subscriberPriceId: 'price_1RkG33EFAytNXjkF1kcTaGM4', // Large Event Subscriber
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery', 'Built-in buffer for incognito users']
  },
  {
    id: 'xl',
    name: 'XL Event',
    guests: 'Up to 200 guests',
    price: '$75',
    subscriberPrice: '$55',
    discount: '27% off',
    priceId: 'price_1RkG3CEFAytNXjkFsqlAVtUr', // XL Event Regular
    subscriberPriceId: 'price_1RkG3DEFAytNXjkFgUBwaXlj', // XL Event Subscriber
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery', 'Built-in buffer for incognito users']
  },
  {
    id: 'mega',
    name: 'Mega Event',
    guests: 'Up to 500 guests',
    price: '$120',
    subscriberPrice: '$85',
    discount: '29% off',
    priceId: 'price_1RkG3EEFAytNXjkFte4eUkb5', // Mega Event Regular
    subscriberPriceId: 'price_1RkG3FEFAytNXjkFJyah3j3h', // Mega Event Subscriber
    features: ['QR code access', 'Unlimited photo uploads', 'Event gallery', 'Built-in buffer for incognito users']
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MemoryMixer</h1>
            </Link>
            <nav>
              <Link href="/" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">
                ← Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            MemoryMixer <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600/80 max-w-3xl mx-auto">
            Choose your subscription plan and add event packages as needed. Start free, scale with your events.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-purple-100">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
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
            <div className="flex justify-center mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-purple-100">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    billingPeriod === 'monthly'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    billingPeriod === 'yearly'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Yearly <span className="text-teal-600 text-sm ml-1">(Save 17%)</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl shadow-xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                    plan.popular 
                      ? 'border-2 border-purple-300 transform hover:scale-[1.02]' 
                      : 'border border-gray-200 hover:border-purple-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {billingPeriod === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.price}
                    </div>
                    <div className="text-gray-600/80">
                      {plan.isFree ? 'Forever free' : `per ${billingPeriod === 'yearly' ? 'year' : 'month'}`}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-purple-100 rounded-full p-1 mr-3 mt-0.5">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(
                      billingPeriod === 'yearly' && plan.priceIdYearly ? plan.priceIdYearly : plan.priceId,
                      plan.id
                    )}
                    disabled={loading === plan.id}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      plan.isFree
                        ? 'bg-gray-100 text-gray-600 cursor-default'
                        : plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/25'
                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
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
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Event Packages</h2>
              <p className="text-xl text-gray-600/80 max-w-3xl mx-auto">One-time purchases that include QR code access for your event. Perfect for larger gatherings.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {eventPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl hover:border-purple-200 transition-all duration-300">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600/80 mb-4 text-lg">{pkg.guests}</p>
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{pkg.subscriberPrice}</span>
                      <span className="text-xl text-gray-400 line-through">{pkg.price}</span>
                    </div>
                    <div className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">{pkg.discount} for subscribers</div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-purple-100 rounded-full p-1 mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(pkg.priceId, pkg.id)}
                    disabled={loading === pkg.id}
                    className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === pkg.id ? 'Loading...' : 'Purchase Package'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-16 p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-purple-100">
          <p className="text-gray-700 text-lg font-medium">
            {activeTab === 'subscription' 
              ? '✨ All subscription plans include a 30-day money-back guarantee. Cancel anytime.'
              : '🎉 Event packages are one-time purchases. No recurring charges.'
            }
          </p>
          <p className="text-gray-600/80 mt-2">
            Questions? Contact our support team for personalized help.
          </p>
        </div>
      </div>
    </div>
  )
}