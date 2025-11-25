// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이지사주 전문 만세력",
  description: "my-manseryeok + 이지사주 사주엔진 결합 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-900 text-slate-50">
        {children}
      </body>
    </html>
  );
}
