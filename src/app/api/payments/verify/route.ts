import { NextResponse } from "next/server";
import { z } from "zod";

import { grantEntitlementsForSku } from "@/lib/entitlements";
import { parseAlipayPassbackParams, queryAlipayTradeByOutTradeNo } from "@/lib/payments/alipay";
import { extractAssessmentIdFromOutTradeNo, yuanStringToFen } from "@/lib/payments/common";
import { parseWechatAttach, queryWechatTradeByOutTradeNo } from "@/lib/payments/wechatpay";
import { getSkuConfig } from "@/lib/sku";
import { getAssessment, upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

const VerifySchema = z.object({
  assessmentId: z.string().min(8),
  provider: z.enum(["alipay", "wechat"]),
  outTradeNo: z.string().min(10),
  skuId: z.string().min(3).optional(),
});

function resolveAssessmentId(args: {
  requestedAssessmentId: string;
  outTradeNo: string;
  providerAssessmentId?: string;
}) {
  const fromOrderNo = extractAssessmentIdFromOutTradeNo(args.outTradeNo);
  const derived = args.providerAssessmentId || fromOrderNo || args.requestedAssessmentId;
  if (derived !== args.requestedAssessmentId) {
    throw new Error("assessmentId mismatch with payment order");
  }
  return derived;
}

export async function POST(req: Request) {
  try {
    const input = VerifySchema.parse(await req.json());

    const assessment = await getAssessment(input.assessmentId);
    if (!assessment) return new NextResponse("Unknown assessmentId", { status: 404 });

    if (input.provider === "alipay") {
      const res = await queryAlipayTradeByOutTradeNo(input.outTradeNo);
      if (res.code !== "10000") {
        const msg = res.sub_msg || res.msg || "Alipay query failed";
        return new NextResponse(msg, { status: 402 });
      }

      const paid = res.trade_status === "TRADE_SUCCESS" || res.trade_status === "TRADE_FINISHED";
      if (!paid) return new NextResponse(`Not paid: ${res.trade_status || "UNKNOWN"}`, { status: 402 });

      const passback = parseAlipayPassbackParams(res.passback_params);
      const assessmentId = resolveAssessmentId({
        requestedAssessmentId: input.assessmentId,
        outTradeNo: input.outTradeNo,
        providerAssessmentId: passback?.assessmentId,
      });

      const skuId = passback?.skuId || input.skuId || "deep_report_v1";
      const sku = getSkuConfig(skuId);
      if (!sku) return new NextResponse("Unknown skuId", { status: 400 });

      const t = new Date().toISOString();
      await upsertOrder({
        stripeCheckoutSessionId: `alipay:${input.outTradeNo}`,
        createdAt: t,
        updatedAt: t,
        assessmentId,
        sku: sku.id,
        status: res.trade_status || "paid",
        amount: yuanStringToFen(res.total_amount) || sku.unitAmount,
        currency: "cny",
        rawJson: res as unknown as object,
      });

      const granted = await grantEntitlementsForSku({ assessmentId, skuId: sku.id });
      return NextResponse.json({ granted, provider: "alipay", outTradeNo: input.outTradeNo });
    }

    const res = await queryWechatTradeByOutTradeNo(input.outTradeNo);
    if (res.trade_state !== "SUCCESS") {
      return new NextResponse(`Not paid: ${res.trade_state || "UNKNOWN"}`, { status: 402 });
    }

    const attach = parseWechatAttach(res.attach);
    const assessmentId = resolveAssessmentId({
      requestedAssessmentId: input.assessmentId,
      outTradeNo: input.outTradeNo,
      providerAssessmentId: attach?.assessmentId,
    });

    const skuId = attach?.skuId || input.skuId || "deep_report_v1";
    const sku = getSkuConfig(skuId);
    if (!sku) return new NextResponse("Unknown skuId", { status: 400 });

    const t = new Date().toISOString();
    await upsertOrder({
      stripeCheckoutSessionId: `wechat:${input.outTradeNo}`,
      createdAt: t,
      updatedAt: t,
      assessmentId,
      sku: sku.id,
      status: res.trade_state || "paid",
      amount: res.amount?.total ?? sku.unitAmount,
      currency: (res.amount?.currency || "CNY").toLowerCase(),
      rawJson: res as unknown as object,
    });

    const granted = await grantEntitlementsForSku({ assessmentId, skuId: sku.id });
    return NextResponse.json({ granted, provider: "wechat", outTradeNo: input.outTradeNo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
