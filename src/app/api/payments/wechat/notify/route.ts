import { NextResponse } from "next/server";

import { grantEntitlementsForSku } from "@/lib/entitlements";
import { decryptWechatNotifyResource, parseWechatAttach, type WechatTrade, verifyWechatNotifySignature } from "@/lib/payments/wechatpay";
import { extractAssessmentIdFromOutTradeNo } from "@/lib/payments/common";
import { getSkuConfig } from "@/lib/sku";
import { upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

type WechatNotifyEnvelope = {
  id?: string;
  event_type?: string;
  resource?: {
    algorithm: string;
    ciphertext: string;
    nonce: string;
    associated_data?: string;
  };
};

function ackSuccess() {
  return NextResponse.json({ code: "SUCCESS", message: "成功" });
}

function ackFail(message: string, status = 400) {
  return NextResponse.json({ code: "FAIL", message }, { status });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const verified = verifyWechatNotifySignature(req.headers, rawBody);
    if (!verified) return ackFail("invalid signature", 401);

    const envelope = JSON.parse(rawBody) as WechatNotifyEnvelope;
    if (!envelope.resource) return ackFail("missing resource");

    // Ignore unrelated events while still ACKing to stop retries.
    if (envelope.event_type && envelope.event_type !== "TRANSACTION.SUCCESS") {
      return ackSuccess();
    }

    const plain = decryptWechatNotifyResource(envelope.resource);
    const trade = JSON.parse(plain) as WechatTrade;

    if (!trade.out_trade_no) return ackFail("missing out_trade_no");
    if (trade.trade_state !== "SUCCESS") return ackSuccess();

    const attach = parseWechatAttach(trade.attach);
    const assessmentId = attach?.assessmentId || extractAssessmentIdFromOutTradeNo(trade.out_trade_no);
    if (!assessmentId) return ackFail("missing assessmentId");

    const skuId = attach?.skuId || "deep_report_v1";
    const sku = getSkuConfig(skuId);
    if (!sku) return ackFail("unknown sku", 400);

    const t = new Date().toISOString();
    await upsertOrder({
      stripeCheckoutSessionId: `wechat:${trade.out_trade_no}`,
      createdAt: t,
      updatedAt: t,
      assessmentId,
      sku: sku.id,
      status: trade.trade_state,
      amount: trade.amount?.total ?? sku.unitAmount,
      currency: (trade.amount?.currency || "CNY").toLowerCase(),
      rawJson: trade as unknown as object,
    });

    await grantEntitlementsForSku({ assessmentId, skuId: sku.id });

    return ackSuccess();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "notify error";
    return ackFail(msg, 500);
  }
}
