import { PrismaClient } from "@prisma/client";

export async function ensureDefaultPlansExist(prisma: PrismaClient) {
  const requiredPlans = [
    {
      id: "free",
      slug: "free",
      name: "Free Preview Tier",
      price: 0,
      stripePriceId: "price_free_monthly",
      stripeYearlyPriceId: "price_free_yearly",
      features: {
        chatLimit: 1000, // as requested: 1000 credits
        imageLimit: 20,
        videoLimit: 3,
        pdfLimit: 5,
        storageGB: 1,
        apiAccess: false,
        prioritySupport: false,
        starterNotes: "Free Preview Tier assigned on signup"
      },
    },
    {
      id: "starter",
      slug: "starter",
      name: "Starter SaaS Plan",
      price: 900, // $9.00 in cents
      stripePriceId: "price_starter_monthly",
      stripeYearlyPriceId: "price_starter_yearly",
      features: {
        chatLimit: 5000, // 5000 credits
        imageLimit: 50,
        videoLimit: 10,
        pdfLimit: 20,
        storageGB: 5,
        apiAccess: false,
        prioritySupport: false,
        starterNotes: "Ideal for fresh builders"
      },
    },
    {
      id: "pro",
      slug: "pro",
      name: "Professional Plan",
      price: 2900, // $29.00 in cents
      stripePriceId: "price_pro_monthly",
      stripeYearlyPriceId: "price_pro_yearly",
      features: {
        chatLimit: 25000, // 25000 credits
        imageLimit: 250,
        videoLimit: 50,
        pdfLimit: 150,
        storageGB: 50,
        apiAccess: true,
        prioritySupport: true,
        starterNotes: "Expert intelligence limits"
      },
    },
    {
      id: "business",
      slug: "business",
      name: "Business Automated Tier",
      price: 7900, // $79.00 in cents
      stripePriceId: "price_business_monthly",
      stripeYearlyPriceId: "price_business_yearly",
      features: {
        chatLimit: 100000, // 100000 credits
        imageLimit: 1000,
        videoLimit: 200,
        pdfLimit: 5000,
        storageGB: 200,
        apiAccess: true,
        prioritySupport: true,
        starterNotes: "Designed for full automated studio workspaces"
      },
    },
    {
      id: "enterprise",
      slug: "enterprise",
      name: "Enterprise Architecture Tier",
      price: 29900, // $299.00 in cents
      stripePriceId: "price_enterprise_monthly",
      stripeYearlyPriceId: "price_enterprise_yearly",
      features: {
        chatLimit: 999999, // Unlimited scale
        imageLimit: 99999,
        videoLimit: 99999,
        pdfLimit: 99999,
        storageGB: 5000,
        apiAccess: true,
        prioritySupport: true,
        starterNotes: "Full workspace scaling with dedicated SSO"
      },
    },
  ];

  for (const p of requiredPlans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        price: p.price,
        stripePriceId: p.stripePriceId,
        stripeYearlyPriceId: p.stripeYearlyPriceId,
        isActive: true,
        features: p.features as any,
      },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        stripePriceId: p.stripePriceId,
        stripeYearlyPriceId: p.stripeYearlyPriceId,
        isActive: true,
        features: p.features as any,
      },
    });
  }
}
