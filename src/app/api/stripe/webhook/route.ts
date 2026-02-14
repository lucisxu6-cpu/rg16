import { NextResponse } from "next/server";

import { grantEntitlementsForSku } from "@/lib/entitlements";
import { getSkuConfig } from "@/lib/sku";
import { stripeOrThrow } from "@/lib/stripe";
import { upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new NextResponse("Missing stripe signature/secret", { status: 400 });

  const stripe = stripeOrThrow();
  const rawBody = await req.text();

  let event: unknown;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (_err) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = event as any;

  try {
    if (e.type === "checkout.session.completed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = e.data.object as any;

      const paid = session.payment_status === "paid";
      if (!paid) return NextResponse.json({ received: true });

      const assessmentId = session.metadata?.assessmentId;
      const skuId = session.metadata?.skuId;
      if (!assessmentId || !skuId) return new NextResponse("Missing metadata", { status: 400 });

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

      await grantEntitlementsForSku({ assessmentId, skuId });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return new NextResponse(msg, { status: 500 });
  }
}
