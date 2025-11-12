import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bảng điều khiển - FinanceFirst VN',
  description: 'Quản lý tài chính cá nhân của bạn',
}

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const displayName = user.firstName || user.emailAddresses[0].emailAddress.split('@')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">FinanceFirst VN</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào, {displayName}!
          </h2>
          <p className="text-gray-600">
            Chào mừng bạn đến với bảng điều khiển tài chính của mình.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Tổng thu nhập</h3>
              <span className="text-2xl">💵</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">0 ₫</p>
            <p className="text-sm text-gray-500 mt-2">Tháng này</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Tổng chi tiêu</h3>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">0 ₫</p>
            <p className="text-sm text-gray-500 mt-2">Tháng này</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Số dư</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-600">0 ₫</p>
            <p className="text-sm text-gray-500 mt-2">Hiện tại</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-medium">Thêm giao dịch</div>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-medium">Tạo ngân sách</div>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-medium">Xem báo cáo</div>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-medium">Cài đặt</div>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Giao dịch gần đây</h3>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Chưa có giao dịch nào</p>
            <p className="text-sm">Bắt đầu bằng cách thêm giao dịch đầu tiên của bạn</p>
          </div>
        </div>
      </main>
    </div>
  )
}
