import { NextResponse } from "next/server";
import { z } from "zod";

import { createAlipayWapPayUrl } from "@/lib/payments/alipay";
import { appBaseUrl, createOutTradeNo, fenToYuanString, getClientIp, type PaymentProvider } from "@/lib/payments/common";
import { createWechatH5PayUrl } from "@/lib/payments/wechatpay";
import { getSkuConfig } from "@/lib/sku";
import { getAssessment, upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

const CheckoutSchema = z.object({
  assessmentId: z.string().min(8),
  skuId: z.string().min(3),
  provider: z.enum(["alipay", "wechat"]),
});

export async function POST(req: Request) {
  try {
    const input = CheckoutSchema.parse(await req.json());

    const assessment = await getAssessment(input.assessmentId);
    if (!assessment) return new NextResponse("Unknown assessmentId", { status: 404 });

    const sku = getSkuConfig(input.skuId);
    if (!sku) return new NextResponse("Unknown skuId", { status: 400 });

    if (sku.currency !== "cny") {
      return new NextResponse("WeChat/Alipay currently require CNY sku currency", { status: 400 });
    }

    const appUrl = appBaseUrl();
    const provider = input.provider as PaymentProvider;
    const outTradeNo = createOutTradeNo(provider, input.assessmentId);

    let redirectUrl = "";

    if (provider === "alipay") {
      const notifyUrl = `${appUrl}/api/payments/alipay/notify`;
      const returnUrl = `${appUrl}/r/${input.assessmentId}?pay_provider=alipay&out_trade_no=${encodeURIComponent(outTradeNo)}`;
      const passbackParams = JSON.stringify({
        assessmentId: input.assessmentId,
        skuId: sku.id,
        outTradeNo,
      });

      redirectUrl = createAlipayWapPayUrl({
        outTradeNo,
        subject: sku.nameZh,
        totalAmountYuan: fenToYuanString(sku.unitAmount),
        notifyUrl,
        returnUrl,
        passbackParams,
      });
    } else {
      const notifyUrl = `${appUrl}/api/payments/wechat/notify`;
      const returnUrl = `${appUrl}/r/${input.assessmentId}?pay_provider=wechat&out_trade_no=${encodeURIComponent(outTradeNo)}`;
      const attach = JSON.stringify({
        assessmentId: input.assessmentId,
        skuId: sku.id,
        outTradeNo,
      });

      redirectUrl = await createWechatH5PayUrl({
        outTradeNo,
        description: sku.nameZh,
        totalFen: sku.unitAmount,
        notifyUrl,
        clientIp: getClientIp(req),
        redirectUrl: returnUrl,
        attach,
      });
    }

    const t = new Date().toISOString();
    await upsertOrder({
      // Keep legacy field name for backward compatibility with the existing file store schema.
      stripeCheckoutSessionId: `${provider}:${outTradeNo}`,
      createdAt: t,
      updatedAt: t,
      assessmentId: input.assessmentId,
      sku: sku.id,
      status: "created",
      amount: sku.unitAmount,
      currency: sku.currency,
      rawJson: {
        provider,
        outTradeNo,
      },
    });

    return NextResponse.json({
      provider,
      outTradeNo,
      redirectUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
