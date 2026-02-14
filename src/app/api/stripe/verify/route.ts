import { NextResponse } from "next/server";
import { z } from "zod";

import { grantEntitlementsForSku } from "@/lib/entitlements";
import { getSkuConfig } from "@/lib/sku";
import { stripeOrThrow } from "@/lib/stripe";
import { upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

const VerifySchema = z.object({
  assessmentId: z.string().min(8),
  sessionId: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = VerifySchema.parse(json);

    const stripe = stripeOrThrow();
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);

    const paid = session.payment_status === "paid";
    if (!paid) return new NextResponse("Not paid", { status: 402 });

    const skuId = session.metadata?.skuId || "deep_report_v1";
    const assessmentId = session.metadata?.assessmentId || input.assessmentId;

    const sku = getSkuConfig(skuId);
    if (!sku) return new NextResponse("Unknown skuId", { status: 400 });

    const t = new Date().toISOString();
    await upsertOrder({
      stripeCheckoutSessionId: session.id,
      createdAt: t,
      updatedAt: t,
      assessmentId,
      sku: sku.id,
      status: session.payment_status ?? "paid",
      amount: session.amount_total ?? sku.unitAmount,
      currency: session.currency ?? sku.currency,
      rawJson: session as unknown as object,
    });

    const granted = await grantEntitlementsForSku({ assessmentId, skuId: sku.id });

    return NextResponse.json({ granted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
