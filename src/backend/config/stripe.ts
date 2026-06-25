import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required but not configured in environment variables.");
    }
    // Cast any to bypass typescript's strict pin on single fixed version constraints
    stripeInstance = new Stripe(key, {
      apiVersion: undefined as any,
    });
  }
  return stripeInstance;
}
