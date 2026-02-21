# RG16 公网部署指南（Docker + Caddy）

本指南目标：把 RG16 部署到公网 HTTPS 域名，供支付宝/微信支付回调使用。

## 1. 前置条件

1. 1 台 Linux 云服务器（建议 Ubuntu 22.04，2C2G 起步）
2. 1 个已解析到服务器公网 IP 的域名（例如 `rg16.example.com`）
3. 服务器已开放 `80` 和 `443` 端口
4. 支付商户参数已准备（支付宝 + 微信支付 APIv3）

## 2. 服务器安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3. 拉代码并准备配置

```bash
git clone git@github.com:lucisxu6-cpu/rg16.git
cd rg16
cp deploy/.env.production.example .env.production
```

### 3.1 修改域名（Caddy）

编辑 `deploy/Caddyfile`：

```caddyfile
rg16.example.com {
  encode gzip zstd
  reverse_proxy app:3000
}
```

把 `rg16.example.com` 改成你的真实域名。

### 3.2 填写生产环境变量

编辑 `.env.production`，至少填写：

1. `NEXT_PUBLIC_APP_URL=https://你的域名`
2. `DEV_BYPASS_PAYWALL=0`
3. `RG16_STORE_PATH=/app/.data/rg16-store.json`
4. 支付宝参数：`ALIPAY_*`
5. 微信支付参数：`WECHATPAY_*`

说明：

1. 多行 PEM 密钥可用单行 `\n` 写入。
2. `WECHATPAY_API_V3_KEY` 必须是 32 字符。

## 4. 启动生产服务

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy
```

## 5. 验证公网可访问

1. 浏览器访问：`https://你的域名`
2. 打开测评并提交，确认结果页可访问
3. 确认回调 URL 可被公网访问：
   - `https://你的域名/api/payments/alipay/notify`
   - `https://你的域名/api/payments/wechat/notify`

## 6. 商户平台回调配置

1. 支付宝异步通知地址：`https://你的域名/api/payments/alipay/notify`
2. 微信支付回调地址：`https://你的域名/api/payments/wechat/notify`
3. 微信 H5 支付需要配置支付授权目录/域名白名单（以商户平台要求为准）

## 7. 常见问题

1. 证书申请失败：确认域名已正确解析到服务器，且 `80/443` 已放通。
2. 支付回调签名失败：检查公钥/私钥是否完整，是否使用了错误商户号对应的密钥。
3. 微信 H5 拉起失败：检查 `scene_info.h5_info`、域名白名单和客户端访问环境。
4. 数据丢失：确认 `rg16_data` volume 存在且 `RG16_STORE_PATH` 指向 `/app/.data/rg16-store.json`。

## 8. 更新发布

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
