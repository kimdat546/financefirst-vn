import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await currentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Chào mừng đến với FinanceFirst VN
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Nền tảng giáo dục tài chính hàng đầu tại Việt Nam.
          Quản lý chi tiêu, lập ngân sách và đạt được tự do tài chính.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Đăng ký ngay
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            Đăng nhập
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Quản lý chi tiêu</h3>
            <p className="text-gray-600">
              Theo dõi mọi khoản chi tiêu của bạn một cách dễ dàng và hiệu quả
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Lập ngân sách</h3>
            <p className="text-gray-600">
              Tạo và quản lý ngân sách phù hợp với mục tiêu tài chính của bạn
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold mb-2">Phân tích thông minh</h3>
            <p className="text-gray-600">
              Nhận báo cáo chi tiết và lời khuyên tài chính cá nhân hóa
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
