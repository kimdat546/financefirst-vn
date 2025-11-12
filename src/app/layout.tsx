import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceFirst VN - Giáo dục Tài chính",
  description: "Nền tảng giáo dục tài chính hàng đầu tại Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
