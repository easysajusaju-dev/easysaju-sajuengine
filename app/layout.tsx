export const metadata = {
  title: "이지사주 전문가 콘솔",
  description: "만세력 기반 전문가용 사주 분석",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
