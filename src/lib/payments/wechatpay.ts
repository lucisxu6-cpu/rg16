import { createDecipheriv, createSign, createVerify, randomBytes } from "node:crypto";

import { readMultilineSecret } from "@/lib/payments/common";

type WechatConfig = {
  mchId: string;
  appId: string;
  serialNo: string;
  privateKey: string;
  apiV3Key: string;
  platformPublicKey: string;
  platformSerial?: string;
  apiBase: string;
};

type EncryptedResource = {
  algorithm: string;
  ciphertext: string;
  nonce: string;
  associated_data?: string;
};

export type WechatTrade = {
  mchid?: string;
  appid?: string;
  out_trade_no?: string;
  trade_state?: string;
  trade_state_desc?: string;
  transaction_id?: string;
  attach?: string;
  amount?: {
    total?: number;
    payer_total?: number;
    currency?: string;
  };
};

function wechatConfigOrThrow(): WechatConfig {
  const mchId = process.env.WECHATPAY_MCH_ID?.trim();
  const appId = process.env.WECHATPAY_APP_ID?.trim();
  const serialNo = process.env.WECHATPAY_SERIAL_NO?.trim();
  const privateKey = process.env.WECHATPAY_PRIVATE_KEY?.trim();
  const apiV3Key = process.env.WECHATPAY_API_V3_KEY?.trim();
  const platformPublicKey = process.env.WECHATPAY_PLATFORM_PUBLIC_KEY?.trim();

  if (!mchId) throw new Error("Missing WECHATPAY_MCH_ID");
  if (!appId) throw new Error("Missing WECHATPAY_APP_ID");
  if (!serialNo) throw new Error("Missing WECHATPAY_SERIAL_NO");
  if (!privateKey) throw new Error("Missing WECHATPAY_PRIVATE_KEY");
  if (!apiV3Key) throw new Error("Missing WECHATPAY_API_V3_KEY");
  if (!platformPublicKey) throw new Error("Missing WECHATPAY_PLATFORM_PUBLIC_KEY");

  return {
    mchId,
    appId,
    serialNo,
    privateKey: readMultilineSecret(privateKey),
    apiV3Key,
    platformPublicKey: readMultilineSecret(platformPublicKey),
    platformSerial: process.env.WECHATPAY_PLATFORM_SERIAL?.trim() || undefined,
    apiBase: (process.env.WECHATPAY_API_BASE || "https://api.mch.weixin.qq.com").trim().replace(/\/$/, ""),
  };
}

function buildAuthorization(args: {
  method: "GET" | "POST";
  canonicalUrl: string;
  body: string;
  cfg: WechatConfig;
}) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const message = `${args.method}\n${args.canonicalUrl}\n${ts}\n${nonce}\n${args.body}\n`;

  const signer = createSign("RSA-SHA256");
  signer.update(message, "utf8");
  signer.end();
  const signature = signer.sign(args.cfg.privateKey, "base64");

  const auth =
    `WECHATPAY2-SHA256-RSA2048 mchid="${args.cfg.mchId}",` +
    `nonce_str="${nonce}",timestamp="${ts}",serial_no="${args.cfg.serialNo}",signature="${signature}"`;

  return auth;
}

async function wechatRequest<T>(args: {
  method: "GET" | "POST";
  canonicalUrl: string;
  bodyObj?: Record<string, unknown>;
}) {
  const cfg = wechatConfigOrThrow();
  const body = args.bodyObj ? JSON.stringify(args.bodyObj) : "";

  const auth = buildAuthorization({
    method: args.method,
    canonicalUrl: args.canonicalUrl,
    body,
    cfg,
  });

  const res = await fetch(`${cfg.apiBase}${args.canonicalUrl}`, {
    method: args.method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: args.method === "POST" ? body : undefined,
  });

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`WeChat Pay API error ${res.status}: ${txt}`);
  }

  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(`Invalid WeChat Pay response: ${txt}`);
  }
}

export async function createWechatH5PayUrl(args: {
  outTradeNo: string;
  description: string;
  totalFen: number;
  notifyUrl: string;
  clientIp: string;
  redirectUrl: string;
  attach?: string;
}) {
  if (!Number.isInteger(args.totalFen) || args.totalFen <= 0) {
    throw new Error("totalFen must be a positive integer");
  }

  const cfg = wechatConfigOrThrow();
  const payload: Record<string, unknown> = {
    appid: cfg.appId,
    mchid: cfg.mchId,
    description: args.description,
    out_trade_no: args.outTradeNo,
    notify_url: args.notifyUrl,
    amount: {
      total: args.totalFen,
      currency: "CNY",
    },
    scene_info: {
      payer_client_ip: args.clientIp,
      h5_info: {
        type: "Wap",
      },
    },
  };

  if (args.attach) payload.attach = args.attach;

  const resp = await wechatRequest<{ h5_url?: string }>({
    method: "POST",
    canonicalUrl: "/v3/pay/transactions/h5",
    bodyObj: payload,
  });

  const h5Url = resp.h5_url;
  if (!h5Url) throw new Error("WeChat Pay did not return h5_url");

  const joiner = h5Url.includes("?") ? "&" : "?";
  return `${h5Url}${joiner}redirect_url=${encodeURIComponent(args.redirectUrl)}`;
}

export async function queryWechatTradeByOutTradeNo(outTradeNo: string): Promise<WechatTrade> {
  const cfg = wechatConfigOrThrow();
  const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${encodeURIComponent(cfg.mchId)}`;

  return wechatRequest<WechatTrade>({
    method: "GET",
    canonicalUrl: path,
  });
}

export function verifyWechatNotifySignature(headers: Headers, rawBody: string) {
  const cfg = wechatConfigOrThrow();

  const timestamp = headers.get("Wechatpay-Timestamp") || headers.get("wechatpay-timestamp");
  const nonce = headers.get("Wechatpay-Nonce") || headers.get("wechatpay-nonce");
  const signature = headers.get("Wechatpay-Signature") || headers.get("wechatpay-signature");
  const serial = headers.get("Wechatpay-Serial") || headers.get("wechatpay-serial");

  if (!timestamp || !nonce || !signature || !serial) return false;
  if (cfg.platformSerial && cfg.platformSerial !== serial) return false;

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const verifier = createVerify("RSA-SHA256");
  verifier.update(message, "utf8");
  verifier.end();
  return verifier.verify(cfg.platformPublicKey, signature, "base64");
}

export function decryptWechatNotifyResource(resource: EncryptedResource) {
  const cfg = wechatConfigOrThrow();

  if (resource.algorithm !== "AEAD_AES_256_GCM") {
    throw new Error(`Unsupported resource algorithm: ${resource.algorithm}`);
  }

  const key = Buffer.from(cfg.apiV3Key, "utf8");
  if (key.length !== 32) {
    throw new Error("WECHATPAY_API_V3_KEY must be exactly 32 bytes");
  }

  const ciphertext = Buffer.from(resource.ciphertext, "base64");
  if (ciphertext.length < 16) throw new Error("Invalid ciphertext");

  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(resource.nonce, "utf8"));
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, "utf8"));
  }
  decipher.setAuthTag(authTag);

  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return plain;
}

export function parseWechatAttach(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { assessmentId?: unknown; skuId?: unknown; outTradeNo?: unknown };
    return {
      assessmentId: typeof parsed.assessmentId === "string" ? parsed.assessmentId : undefined,
      skuId: typeof parsed.skuId === "string" ? parsed.skuId : undefined,
      outTradeNo: typeof parsed.outTradeNo === "string" ? parsed.outTradeNo : undefined,
    };
  } catch {
    return null;
  }
}
