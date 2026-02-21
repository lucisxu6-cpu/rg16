import { createSign, createVerify } from "node:crypto";

import { readMultilineSecret } from "@/lib/payments/common";

type AlipayConfig = {
  appId: string;
  privateKey: string;
  publicKey: string;
  gateway: string;
};

export type AlipayTradeQueryResponse = {
  code?: string;
  msg?: string;
  sub_code?: string;
  sub_msg?: string;
  out_trade_no?: string;
  trade_no?: string;
  trade_status?: string;
  total_amount?: string;
  passback_params?: string;
};

type AlipayGatewayResponse = {
  alipay_trade_query_response?: AlipayTradeQueryResponse;
  sign?: string;
};

function alipayConfigOrThrow(): AlipayConfig {
  const appId = process.env.ALIPAY_APP_ID?.trim();
  const privateKey = process.env.ALIPAY_PRIVATE_KEY?.trim();
  const publicKey = process.env.ALIPAY_PUBLIC_KEY?.trim();

  if (!appId) throw new Error("Missing ALIPAY_APP_ID");
  if (!privateKey) throw new Error("Missing ALIPAY_PRIVATE_KEY");
  if (!publicKey) throw new Error("Missing ALIPAY_PUBLIC_KEY");

  return {
    appId,
    privateKey: readMultilineSecret(privateKey),
    publicKey: readMultilineSecret(publicKey),
    gateway: (process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do").trim(),
  };
}

function formatAlipayTimestamp(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}

function buildSignContent(params: Record<string, string>) {
  const keys = Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type" && params[k] != null && params[k] !== "")
    .sort();
  return keys.map((k) => `${k}=${params[k]}`).join("&");
}

function signRsa2(content: string, privateKey: string) {
  const signer = createSign("RSA-SHA256");
  signer.update(content, "utf8");
  signer.end();
  return signer.sign(privateKey, "base64");
}

function verifyRsa2(content: string, signature: string, publicKey: string) {
  const verifier = createVerify("RSA-SHA256");
  verifier.update(content, "utf8");
  verifier.end();
  return verifier.verify(publicKey, signature, "base64");
}

function signedParams(args: {
  method: string;
  bizContent: Record<string, unknown>;
  notifyUrl?: string;
  returnUrl?: string;
  passbackParams?: string;
}) {
  const cfg = alipayConfigOrThrow();

  const params: Record<string, string> = {
    app_id: cfg.appId,
    method: args.method,
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: formatAlipayTimestamp(),
    version: "1.0",
    biz_content: JSON.stringify(args.bizContent),
  };

  if (args.notifyUrl) params.notify_url = args.notifyUrl;
  if (args.returnUrl) params.return_url = args.returnUrl;
  if (args.passbackParams) params.passback_params = args.passbackParams;

  const content = buildSignContent(params);
  const signature = signRsa2(content, cfg.privateKey);

  return { cfg, params: { ...params, sign: signature } };
}

export function createAlipayWapPayUrl(args: {
  outTradeNo: string;
  subject: string;
  totalAmountYuan: string;
  notifyUrl: string;
  returnUrl: string;
  passbackParams?: string;
}) {
  const bizContent: Record<string, unknown> = {
    out_trade_no: args.outTradeNo,
    subject: args.subject,
    total_amount: args.totalAmountYuan,
    product_code: "QUICK_WAP_WAY",
  };

  const { cfg, params } = signedParams({
    method: "alipay.trade.wap.pay",
    bizContent,
    notifyUrl: args.notifyUrl,
    returnUrl: args.returnUrl,
    passbackParams: args.passbackParams,
  });

  return `${cfg.gateway}?${new URLSearchParams(params).toString()}`;
}

export async function queryAlipayTradeByOutTradeNo(outTradeNo: string): Promise<AlipayTradeQueryResponse> {
  const { cfg, params } = signedParams({
    method: "alipay.trade.query",
    bizContent: { out_trade_no: outTradeNo },
  });

  const url = `${cfg.gateway}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Alipay query failed: HTTP ${res.status} ${text}`);
  }

  let json: AlipayGatewayResponse;
  try {
    json = JSON.parse(text) as AlipayGatewayResponse;
  } catch {
    throw new Error(`Invalid Alipay response: ${text}`);
  }

  const node = json.alipay_trade_query_response;
  if (!node) throw new Error(`Missing alipay_trade_query_response: ${text}`);
  return node;
}

export function verifyAlipayNotifyPayload(payload: Record<string, string>) {
  const cfg = alipayConfigOrThrow();
  const signature = payload.sign;
  if (!signature) return false;

  const content = buildSignContent(payload);
  return verifyRsa2(content, signature, cfg.publicKey);
}

export function parseAlipayPassbackParams(raw: string | undefined) {
  if (!raw) return null;

  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // ignore decode failures
  }

  for (const item of candidates) {
    try {
      const parsed = JSON.parse(item) as { assessmentId?: unknown; skuId?: unknown; outTradeNo?: unknown };
      const assessmentId = typeof parsed.assessmentId === "string" ? parsed.assessmentId : undefined;
      const skuId = typeof parsed.skuId === "string" ? parsed.skuId : undefined;
      const outTradeNo = typeof parsed.outTradeNo === "string" ? parsed.outTradeNo : undefined;
      if (assessmentId || skuId || outTradeNo) return { assessmentId, skuId, outTradeNo };
    } catch {
      // continue
    }
  }

  return null;
}
