import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng ký - FinanceFirst VN',
  description: 'Tạo tài khoản FinanceFirst VN miễn phí',
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  )
}
