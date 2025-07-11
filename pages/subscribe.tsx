import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '$9.99',
    priceId: 'price_basic_monthly', // Replace with actual Stripe Price ID
    features: [
      'Up to 5 events per month',
      '2GB storage',
      'Up to 100 guests per event',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$19.99',
    priceId: 'price_pro_monthly', // Replace with actual Stripe Price ID
    features: [
      'Up to 25 events per month',
      '10GB storage',
      'Up to 500 guests per event',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: '$39.99',
    priceId: 'price_premium_monthly', // Replace with actual Stripe Price ID
    features: [
      'Unlimited events',
      '50GB storage',
      'Unlimited guests',
      'Premium analytics',
      '24/7 phone support',
      'White-label solution',
      'API access'
    ]
  }
]

export default function Subscribe() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(planName)

    try {
      // Get user ID from URL params or authentication
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get('userId') // You'll need to pass this from the app

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
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Upgrade your MemoryMixer experience with premium features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                  {plan.price}
                </div>
                <div className="text-gray-500">per month</div>
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
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}