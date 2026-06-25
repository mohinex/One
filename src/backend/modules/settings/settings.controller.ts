import { Response, NextFunction } from "express";
import { getPrisma } from "../../config/db.ts";
import { encrypt, maskSecret } from "../../utils/crypto.ts";
import { AppError } from "../../utils/errors.ts";

const ALLOWED_KEYS = [
  "system.maintenanceMode",
  "system.registrationEnabled",
  "ai.openaiApiKey",
  "ai.anthropicApiKey",
  "billing.stripeWebhookSecret",
];

const SECRET_KEYS = [
  "ai.openaiApiKey",
  "ai.anthropicApiKey",
  "billing.stripeWebhookSecret",
];

export async function listSettings(req: any, res: Response, next: NextFunction) {
  try {
    const prisma = getPrisma();
    const settings = await prisma.siteSetting.findMany();

    const formatted = settings.map((item) => {
      const isSecret = SECRET_KEYS.includes(item.key);
      const val = isSecret && item.value ? maskSecret(item.value) : item.value;
      return {
        id: item.id,
        key: item.key,
        value: val,
        type: isSecret ? "secret" : "text",
        updatedAt: item.updatedAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: any, res: Response, next: NextFunction) {
  try {
    const settingsArray = req.body; // Array of { key, value }
    if (!Array.isArray(settingsArray)) {
      throw new AppError("Invalid settings body layout. Root must be an Array.", 400, "BAD_REQUEST");
    }

    const prisma = getPrisma();

    // Verify all keys are legitimate
    for (const item of settingsArray) {
      if (!ALLOWED_KEYS.includes(item.key)) {
        throw new AppError(`Setting configuration key "${item.key}" is unauthorized for editing.`, 400, "INVALID_KEY");
      }
    }

    // Process updates in transaction
    const results = await prisma.$transaction(
      settingsArray.map((item) => {
        const isSecret = SECRET_KEYS.includes(item.key);
        // Under PATCH, encrypt secret keys via AES-256 before storing
        const finalValue = isSecret && item.value && !item.value.includes("...") 
          ? encrypt(item.value) 
          : item.value;

        return prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: finalValue },
          create: {
            key: item.key,
            value: finalValue,
            label: item.key,
          },
        });
      })
    );

    res.json({
      success: true,
      message: "System control settings updated successfully.",
      data: results.map((r) => ({
        key: r.key,
        updated: true,
      })),
    });
  } catch (error) {
    next(error);
  }
}
