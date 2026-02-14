import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "RG16 · 16-type (MBTI-style) via Big Five",
  description:
    "用 Big Five 五大人格测量，映射得到 MBTI 风格 16-type，并支持付费解锁深度报告。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700;800;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <div className="shell">
          <div className="topbar animIn stagger1">
            <div className="brand">
              <div className="logo">RG16</div>
              <div className="tagline">Big Five grounded · MBTI-style output</div>
            </div>
            <Link className="btn btnSmall" href="/test">
              开始做题
              <span aria-hidden>→</span>
            </Link>
          </div>
          {children}
          <div className="footer animIn stagger4">
            <div>
              免责声明: 本测评为自我探索工具, 不构成医疗/心理诊断建议。16-type
              为基于 Big Five 的映射推断, 存在不确定性。
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
