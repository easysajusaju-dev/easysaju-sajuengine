import "./globals.css";

export const metadata = {
  title: "이지사주",
  description: "사주 분석",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
