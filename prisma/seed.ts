import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding process...");

  // 1. Create default Subscription Plans
  console.log("Seeding platform subscription plan tiers...");
  const plans = [
    {
      id: "free",
      slug: "free",
      name: "Free Preview Tier",
      price: 0,
      stripePriceId: "price_free_monthly",
      stripeYearlyPriceId: "price_free_yearly",
      isActive: true,
      features: {
        chatLimit: 100,
        imageLimit: 20,
        videoLimit: 3,
        pdfLimit: 5,
        storageGB: 1,
        apiAccess: false,
        prioritySupport: false,
      },
    },
    {
      id: "pro",
      slug: "pro",
      name: "Professional Tier",
      price: 2900, // $29.00 in cents
      stripePriceId: "price_pro_monthly",
      stripeYearlyPriceId: "price_pro_yearly",
      isActive: true,
      features: {
        chatLimit: 1000,
        imageLimit: 100,
        videoLimit: 20,
        pdfLimit: 50,
        storageGB: 20,
        apiAccess: true,
        prioritySupport: true,
      },
    },
    {
      id: "enterprise",
      slug: "enterprise",
      name: "Enterprise Architecture Tier",
      price: 14900, // $149.00 in cents
      stripePriceId: "price_enterprise_monthly",
      stripeYearlyPriceId: "price_enterprise_yearly",
      isActive: true,
      features: {
        chatLimit: 99999,
        imageLimit: 99999,
        videoLimit: 99999,
        pdfLimit: 99999,
        storageGB: 1000,
        apiAccess: true,
        prioritySupport: true,
      },
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        price: p.price,
        stripePriceId: p.stripePriceId,
        stripeYearlyPriceId: p.stripeYearlyPriceId,
        isActive: p.isActive,
        features: JSON.stringify(p.features),
      },
      create: {
        ...p,
        features: JSON.stringify(p.features),
      },
    });
  }

  // 2. Create the default Super Admin user account
  console.log("Seeding platform Super Administrator account...");
  const adminEmail = "admin@eurosia.one";
  const rawAdminPassword = "AdminPassword!234"; // conforms to complex parameters
  const saltRounds = 12;
  const hash = await bcrypt.hash(rawAdminPassword, saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hash,
      role: "SUPER_ADMIN",
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: adminEmail,
      name: "Global Platform Administrator",
      passwordHash: hash,
      role: "SUPER_ADMIN",
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Ensure administrators have userUsage assigned
  await prisma.userUsage.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
  });

  // 3. Seed site settings placeholders safely
  console.log("Seeding default application controls settings...");
  const defaultSettings = [
    { key: "system.maintenanceMode", value: "false", label: "Maintenance Mode" },
    { key: "system.registrationEnabled", value: "true", label: "Registration Enabled" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 4. Seed default character categories
  console.log("Seeding default character categories...");
  const defaultCategories = [
    { name: "Philosophy", slug: "philosophy", description: "Deep classical thinkers and debate partners" },
    { name: "Narrator & RPG", slug: "rpg", description: "Immersive narrative gaming and roleplay helpers" },
    { name: "Professional & FAANG", slug: "professional", description: "Career evaluators, recruiters, and technical advisors" },
    { name: "General Knowledge", slug: "general", description: "Versatile companions for learning and creative projects" },
  ];

  for (const cat of defaultCategories) {
    await prisma.characterCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  // 5. Seed default global characters
  console.log("Seeding default global characters...");
  const defaultCharacters = [
    {
      id: "char_socrates",
      name: "Socrates",
      profession: "Classical Greek Philosopher",
      category: "Philosophy",
      avatar: "bg-amber-100 text-amber-800 border-amber-250",
      prompt: "You are Socrates, the classical Athenian philosopher. Guide the conversation using Socratic irony. Rather than providing absolute answers, answer questions with deep, critical counter-questions to help the user uncover internal assumptions and logical biases. Speak with a tone of intellectual humility, warmth, and classical gravity.",
      personality: "Philosophical, highly analytical, extremely humble yet challenging, always querying assumptions, respectful.",
      greeting: "Welcome. Let us deliberate upon truth, reality, and wisdom. Speak, my friend: what question weighs most heavily on your mind?",
      instructions: "Never answer directly. Formulate questions that lead users to realize their own logical contradictions.",
      model: "gemini",
      temperature: 0.8,
      tools: JSON.stringify(["web_builder", "syntax_assist"]),
      permissions: JSON.stringify({ rbac: ["USER", "ADMIN", "SUPER_ADMIN"] }),
      isFeatured: true,
    },
    {
      id: "char_dm",
      name: "Dungeon Master",
      profession: "RPG Fantasy Narrator",
      category: "Narrator & RPG",
      avatar: "bg-purple-100 text-purple-800 border-purple-250",
      prompt: "You are an expert table-top RPG Dungeon Master. Your role is to narrate a rich, immersive fantasy world and guide the player through classic adventures. Describe the environments with sensory detail, and always end your responses by giving the player 3 distinct, formatted choices (e.g., [A] Search the ancient chest, [B] Draw your sword and attack, [C] Scout ahead quietly).",
      personality: "Narrative, dramatic, mysterious, highly engaging, responsive to user agency.",
      greeting: "The cave stands cold and looming. Your torch flickers in the deep draft. What do you do? [A] Draw sword [B] Scout pathways [C] Listen to the shadows.",
      instructions: "Keep descriptions short and high-impact. Always end with [A] / [B] / [C] choices.",
      model: "gemini",
      temperature: 0.9,
      tools: JSON.stringify([]),
      permissions: JSON.stringify({ rbac: ["USER", "ADMIN", "SUPER_ADMIN"] }),
      isFeatured: true,
    },
    {
      id: "char_recruiter",
      name: "HR Tech Recruiter",
      profession: "FAANG Talent Evaluator",
      category: "Professional & FAANG",
      avatar: "bg-blue-100 text-blue-850 border-blue-250",
      prompt: "You are a senior tech recruiter and elite talent evaluator from a FAANG company. Your job is to conduct a hard-hitting systems design and technical interview. Be direct, professional, slightly dry, and focused on finding scalability issues, edge cases, and architectural bottlenecks in the user's suggestions.",
      personality: "Professional, dry, analytical, highly technical, concise, challenging.",
      greeting: "Thanks for jumping into the call! Let's get right into systems design. Explain how you would plan highly available databases across multi-region clusters.",
      instructions: "Give realistic mock interview feedback. Probe on scalability, load balancing, replication lags, and cost trade-offs.",
      model: "gemini",
      temperature: 0.6,
      tools: JSON.stringify(["syntax_assist"]),
      permissions: JSON.stringify({ rbac: ["USER", "ADMIN", "SUPER_ADMIN"] }),
      isFeatured: true,
    }
  ];

  for (const char of defaultCharacters) {
    await prisma.character.upsert({
      where: { id: char.id },
      update: char,
      create: char,
    });

    // Also upsert into Templates
    await prisma.characterTemplate.upsert({
      where: { id: char.id },
      update: {
        name: char.name,
        profession: char.profession,
        category: char.category,
        avatar: char.avatar,
        prompt: char.prompt,
        personality: char.personality,
        greeting: char.greeting,
        instructions: char.instructions,
        model: char.model,
        temperature: char.temperature,
        tools: char.tools,
      },
      create: {
        id: char.id,
        name: char.name,
        profession: char.profession,
        category: char.category,
        avatar: char.avatar,
        prompt: char.prompt,
        personality: char.personality,
        greeting: char.greeting,
        instructions: char.instructions,
        model: char.model,
        temperature: char.temperature,
        tools: char.tools,
      }
    });
  }

  console.log("------------------- SEEDING COMPLETE -------------------");
  console.log("Users Seeded:");
  console.log(`- Role: SUPER_ADMIN | Email: ${adminEmail} | Password: ${rawAdminPassword}`);
  console.log("Plans Seeded: free, pro, enterprise");
  console.log("---------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seeding operation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
