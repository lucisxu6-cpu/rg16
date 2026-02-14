import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function stripeOrThrow() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  if (stripeSingleton) return stripeSingleton;

  // Keep default apiVersion from Stripe SDK; pin later if you need strict compatibility.
  stripeSingleton = new Stripe(key, {});

  return stripeSingleton;
}
