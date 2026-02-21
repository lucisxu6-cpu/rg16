# RG16

一个基于 **荣格八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）** 的 Web 测评系统，输出 16-type 标签与功能栈，并支持付费解锁深度报告。

## 核心特性（MVP）

- 免费：做题后得到 16-type、功能栈、八维强度、置信度与基础解读
- 付费（一次性购买）：解锁逐维现实映射、证据链、层级（低/中/高）判定与升阶建议
- 无登录：结果链接以 `assessmentId` 作为访问凭证（可分享）

## 技术栈

- Next.js（App Router）+ TypeScript
- 文件存储（`.data/rg16-store.json`，MVP）；后续可替换为 Postgres/ORM
- 支付：支付宝 WAP + 微信支付 H5（已接入），Stripe（兼容保留）

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

## 支付回调路由

- 支付宝异步通知：`/api/payments/alipay/notify`
- 微信支付异步通知：`/api/payments/wechat/notify`

生产环境请将上述回调 URL 配置到对应商户平台，并保证 `NEXT_PUBLIC_APP_URL` 为公网 HTTPS 域名。

## 公网部署（推荐）

项目已内置 Docker 生产部署文件：

- `Dockerfile`
- `docker-compose.prod.yml`
- `deploy/Caddyfile`
- `deploy/.env.production.example`

详细步骤见：`docs/deploy-public.md`。

快速命令（在 Linux 云服务器）：

```bash
git clone git@github.com:lucisxu6-cpu/rg16.git
cd rg16
cp deploy/.env.production.example .env.production
# 编辑 deploy/Caddyfile（替换域名）和 .env.production（填支付参数）
docker compose -f docker-compose.prod.yml up -d --build
```

## 免责声明

本项目提供的是自我探索工具，不构成医疗/心理诊断建议。结果用于辅助自我理解，不应替代专业评估。
