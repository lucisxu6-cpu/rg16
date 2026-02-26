import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "RG16 · 荣格八维认知功能测评（含 16-type 标签）",
  description:
    "用荣格八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）推断功能栈与 16-type，免费查看基础结果与人群占比，按需解锁更深入的现实映射报告。",
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
              <div className="tagline">Jung 8 functions · social-context report</div>
            </div>
            <Link className="btn btnSmall" href="/test">
              开始做题
              <span aria-hidden>→</span>
            </Link>
          </div>
          {children}
          <div className="footer animIn stagger4">
            <div>
              免责声明: 本测评为自我探索工具, 不构成医疗/心理诊断建议。4 字母类型为由功能栈推导的标签, 核心输出是八维与功能栈, 仍存在不确定性。
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
