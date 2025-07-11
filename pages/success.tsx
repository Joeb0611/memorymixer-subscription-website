import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Success() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const { session_id } = router.query
    if (session_id && typeof session_id === 'string') {
      setSessionId(session_id)
    }
  }, [router.query])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Subscription Activated!
        </h1>

        <p className="text-gray-600 mb-6">
          Welcome to MemoryMixer Premium! Your subscription has been successfully activated.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Session ID:</span>
            <span className="font-mono text-xs text-gray-800">
              {sessionId ? `${sessionId.substring(0, 20)}...` : 'Loading...'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              // Open the app with a deep link
              window.location.href = 'memorymixer://subscription-updated'
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Return to App
          </button>

          <button
            onClick={() => router.push('/manage')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Manage Subscription
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          You should receive a confirmation email shortly. If you have any questions, contact our support team.
        </p>
      </div>
    </div>
  )
}