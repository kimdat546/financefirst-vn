'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Đã xảy ra lỗi!</h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Có gì đó không đúng. Vui lòng thử lại.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}
