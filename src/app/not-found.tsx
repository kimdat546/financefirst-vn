import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">404</h2>
        <p className="text-xl text-gray-600 mb-6">
          Không tìm thấy trang
        </p>
        <p className="text-gray-500 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  )
}
