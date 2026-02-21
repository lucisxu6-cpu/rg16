import { NextResponse } from "next/server";

import { grantEntitlementsForSku } from "@/lib/entitlements";
import { parseAlipayPassbackParams, verifyAlipayNotifyPayload } from "@/lib/payments/alipay";
import { extractAssessmentIdFromOutTradeNo, yuanStringToFen } from "@/lib/payments/common";
import { getSkuConfig } from "@/lib/sku";
import { upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

function toRecord(sp: URLSearchParams) {
  const out: Record<string, string> = {};
  for (const [k, v] of sp.entries()) out[k] = v;
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const payload = toRecord(new URLSearchParams(body));

    const verified = verifyAlipayNotifyPayload(payload);
    if (!verified) return new NextResponse("fail", { status: 400 });

    const tradeStatus = payload.trade_status;
    const outTradeNo = payload.out_trade_no;

    if (!outTradeNo) return new NextResponse("fail", { status: 400 });

    // Only success states need entitlement changes. Other states are acknowledged.
    if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
      return new NextResponse("success");
    }

    const passback = parseAlipayPassbackParams(payload.passback_params);
    const assessmentId = passback?.assessmentId || extractAssessmentIdFromOutTradeNo(outTradeNo);
    if (!assessmentId) return new NextResponse("fail", { status: 400 });

    const skuId = passback?.skuId || "deep_report_v1";
    const sku = getSkuConfig(skuId);
    if (!sku) return new NextResponse("fail", { status: 400 });

    const t = new Date().toISOString();
    await upsertOrder({
      stripeCheckoutSessionId: `alipay:${outTradeNo}`,
      createdAt: t,
      updatedAt: t,
      assessmentId,
      sku: sku.id,
      status: tradeStatus,
      amount: yuanStringToFen(payload.total_amount) || sku.unitAmount,
      currency: "cny",
      rawJson: payload as unknown as object,
    });

    await grantEntitlementsForSku({ assessmentId, skuId: sku.id });

    return new NextResponse("success");
  } catch {
    return new NextResponse("fail", { status: 500 });
  }
}
