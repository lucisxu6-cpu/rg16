import { NextResponse } from "next/server";
import { z } from "zod";

import { getSkuConfig } from "@/lib/sku";
import { stripeOrThrow } from "@/lib/stripe";
import { getAssessment, upsertOrder } from "@/lib/store";

export const runtime = "nodejs";

const CheckoutSchema = z.object({
  assessmentId: z.string().min(8),
  skuId: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CheckoutSchema.parse(json);

    const assessment = await getAssessment(input.assessmentId);
    if (!assessment) return new NextResponse("Unknown assessmentId", { status: 404 });

    const sku = getSkuConfig(input.skuId);
    if (!sku) return new NextResponse("Unknown skuId", { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = stripeOrThrow();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: sku.currency,
            unit_amount: sku.unitAmount,
            product_data: { name: sku.nameZh },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/r/${input.assessmentId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/r/${input.assessmentId}`,
      client_reference_id: input.assessmentId,
      metadata: { assessmentId: input.assessmentId, skuId: sku.id },
    });

    if (!session.url) return new NextResponse("Stripe session has no url", { status: 500 });

    const t = new Date().toISOString();
    await upsertOrder({
      stripeCheckoutSessionId: session.id,
      createdAt: t,
      updatedAt: t,
      assessmentId: input.assessmentId,
      sku: sku.id,
      status: session.payment_status ?? "created",
      amount: session.amount_total ?? sku.unitAmount,
      currency: session.currency ?? sku.currency,
      rawJson: session as unknown as object,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return new NextResponse(msg, { status: 400 });
  }
}
