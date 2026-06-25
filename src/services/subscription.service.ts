import { api } from "../lib/api";

export interface PlanFeature {
  chatLimit: number;
  imageLimit: number;
  videoLimit: number;
  pdfLimit: number;
  storageGB: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  starterNotes?: string;
}

export interface BillingPlan {
  id: string;
  slug: string;
  name: string;
  price: number; // in cents
  stripePriceId?: string;
  stripeYearlyPriceId?: string;
  isActive: boolean;
  features: PlanFeature;
}

export interface UserUsageResponse {
  chatCount: number;
  chatLimit: number;
  chatPercent: number;
  imageCount: number;
  imageLimit: number;
  imagePercent: number;
  videoCount: number;
  videoLimit: number;
  videoPercent: number;
  storageUsedBytes: string;
  storageLimitBytes: number;
  storagePercent: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  periodEnd: string;
}

export interface CreditPurchaseResponse {
  creditsPurchased: number;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
}

class SubscriptionService {
  /**
   * Retrieves the comprehensive list of 5 active, premium tiered SaaS plans.
   */
  async getPlans(): Promise<BillingPlan[]> {
    const res = await api.get("/billing/plans");
    return res.data.data;
  }

  /**
   * Fetch user's active billing usage dashboard metrics and statistics.
   */
  async getUserUsage(): Promise<UserUsageResponse> {
    const res = await api.get("/users/usage");
    return res.data.data;
  }

  /**
   * Upgrades user workspace instantly using direct operational mechanics (or Stripe Simulation fallback).
   */
  async upgradePlan(planId: string, billingCycle: "monthly" | "yearly" = "monthly"): Promise<{ plan: string }> {
    const res = await api.post("/billing/direct-update", { planId, billingCycle });
    return res.data;
  }

  /**
   * Downgrades client premium tier. Same endpoint used for instant sync updates.
   */
  async downgradePlan(planId: string, billingCycle: "monthly" | "yearly" = "monthly"): Promise<{ plan: string }> {
    const res = await api.post("/billing/direct-update", { planId, billingCycle });
    return res.data;
  }

  /**
   * Initiates Stripe session checkout URL generation for production-level live credit card payment.
   */
  async createCheckoutSession(planId: string, billingCycle: "monthly" | "yearly" = "monthly"): Promise<{ sessionUrl: string }> {
    const res = await api.post("/billing/checkout", { planId, billingCycle });
    return res.data.data;
  }

  /**
   * Cancel user premium recurring plan subscription securely.
   */
  async cancelSubscription(): Promise<{ status: "CANCELED" }> {
    const res = await api.post("/billing/cancel");
    return res.data.data;
  }

  /**
   * Reactivates a canceled recurring plan before current billing epoch expires.
   */
  async reactivateSubscription(): Promise<{ status: "ACTIVE" }> {
    const res = await api.post("/billing/reactivate");
    return res.data.data;
  }

  /**
   * Purchases extra credits bundle and increments user's capacity limits.
   * Supports multi-channel payments: stripe, paypal, sslcommerz, bkash, nagad, rocket etc.
   */
  async purchaseCredits(
    amount: number,
    credits: number,
    paymentMethod: "stripe" | "paypal" | "sslcommerz" | "bkash" | "nagad" | "rocket" = "stripe"
  ): Promise<CreditPurchaseResponse> {
    const res = await api.post("/billing/purchase-credits", { amount, credits, paymentMethod });
    return res.data.data;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
