import { randomBytes } from "node:crypto";

export type PaymentProvider = "alipay" | "wechat";

function compactAssessmentId(assessmentId: string) {
  return assessmentId.replace(/-/g, "").toLowerCase();
}

function expandCompactUuid(compact: string) {
  if (!/^[0-9a-f]{32}$/i.test(compact)) return null;
  const x = compact.toLowerCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export function createOutTradeNo(provider: PaymentProvider, assessmentId: string) {
  const compact = compactAssessmentId(assessmentId);
  if (!/^[0-9a-f]{32}$/i.test(compact)) throw new Error("assessmentId must be UUID-like");

  const providerPrefix = provider === "alipay" ? "ALP" : "WXP";
  const ts = Date.now().toString();
  const nonce = randomBytes(3).toString("hex");
  return `${providerPrefix}_${compact}_${ts}_${nonce}`;
}

export function extractAssessmentIdFromOutTradeNo(outTradeNo: string) {
  const m = outTradeNo.match(/^(?:ALP|WXP)_([0-9a-f]{32})_\d{10,17}_[0-9a-f]{6,12}$/i);
  if (!m) return null;
  return expandCompactUuid(m[1]);
}

export function appBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  return raw.replace(/\/$/, "");
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "127.0.0.1";
}

export function fenToYuanString(fen: number) {
  return (fen / 100).toFixed(2);
}

export function yuanStringToFen(yuan: string | null | undefined) {
  if (!yuan) return 0;
  const n = Number(yuan);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function readMultilineSecret(v: string) {
  return v.includes("\\n") ? v.replace(/\\n/g, "\n") : v;
}
