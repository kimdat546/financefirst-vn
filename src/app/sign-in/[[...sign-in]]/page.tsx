import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập - FinanceFirst VN',
  description: 'Đăng nhập vào tài khoản FinanceFirst VN của bạn',
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
