# RG16

一个基于 **Big Five（五大人格）测量**、并将结果 **可解释地映射到 16-type（MBTI 风格）** 的 Web 测评系统。

## 核心特性（MVP）

- 免费：做题后得到 16-type（四字母）结果与置信度提示
- 付费（一次性购买）：解锁更深入报告（10 个 aspects、压力/沟通建议、`-A/-T` 后缀与“类型清晰度”等）
- 无登录：结果链接以 `assessmentId` 作为访问凭证（可分享）

## 技术栈

- Next.js（App Router）+ TypeScript
- 文件存储（`.data/rg16-store.json`，MVP）；后续可替换为 Postgres/ORM
- Stripe Checkout（一次性购买）

## 本地运行

1) 安装依赖

```bash
pnpm install
```

2) 环境变量

```bash
cp .env.example .env
```

3) 启动

```bash
pnpm dev
```

## 免责声明

本项目提供的是自我探索工具，不构成医疗/心理诊断建议。16-type（MBTI 风格）结果为基于 Big Five 的映射推断，存在不确定性。
