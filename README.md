# RG16

一个基于 **荣格八维（Se/Si/Ne/Ni/Te/Ti/Fe/Fi）** 的 Web 测评系统，输出 16-type 标签与功能栈，并支持付费解锁深度报告。

## 核心思想

RG16 的产品逻辑不是“给用户一个标签”，而是“给用户一个可被表达、可被分享、可被验证的自我叙事”。

1. 人们天然有展示自我竞争力与吸引力的需求，测评是低门槛的自我表达载体。
2. 分享并不是附属动作，而是产品增长主链路：用户愿意晒结果，好友会被激发“我也测一下”的冲动。
3. 结果必须“既好懂又有深度”：免费结果足够有价值，付费结果显著更深，形成自然升级。
4. 每个结论都要有依据（题目证据链、置信度、边界说明），避免空泛标签化。

## 核心特性（MVP）

- 免费：做题后得到 16-type、功能栈、八维强度、置信度与基础解读
- 付费（一次性购买）：解锁逐维现实映射、证据链、层级（低/中/高）判定与升阶建议
- 无登录：结果链接以 `assessmentId` 作为访问凭证（可分享）

## 技术栈

- Next.js（App Router）+ TypeScript
- 文件存储（`.data/rg16-store.json`，MVP）；后续可替换为 Postgres/ORM
- 支付：支付宝 WAP + 微信支付 H5（已接入），Stripe（兼容保留）

## 内容扩展矩阵（分享驱动）

在 MBTI/Jung 之外，优先做“有话题性 + 可分享 + 可行动”的测评：

1. 关系吸引力类：恋爱沟通风格、关系冲突修复倾向、亲密关系依恋策略。
2. 职场竞争力类：决策风格、影响力画像、管理潜力与团队协作位势。
3. 社交定位类：群体角色原型、朋友圈影响半径、表达风格辨识。
4. 执行与成长类：目标执行系统、压力应对模式、学习策略偏好。

每个新测评都建议遵守同一产品模板：

1. 免费给“可分享主结论 + 3 条可执行建议”。
2. 付费给“场景化深度报告 + 证据链 + 升阶路径”。
3. 结果页天然支持一键分享（图片卡片/链接卡片）。

详细策略文档：`/Users/jotdev/rg16/docs/product-expansion-playbook.md`

## 可扩展代码架构

为减少重复开发，测评计算已重构为“版本注册表”：

1. 统一入口：`/Users/jotdev/rg16/src/app/api/assessments/route.ts`
2. 定义注册：`/Users/jotdev/rg16/src/lib/assessments/definitions.ts`
3. 通用类型：`/Users/jotdev/rg16/src/lib/assessments/types.ts`

后续新增测评时，原则上只需新增一个 definition（parse + compute），主路由与存储流程无需改动。

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
