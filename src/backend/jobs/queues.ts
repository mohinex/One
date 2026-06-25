import { Queue, Worker } from "bullmq";
import { getRedis } from "../config/redis.ts";
import { sendEmail } from "../services/email/email.service.ts";
import { getPrisma } from "../config/db.ts";

let emailQueue: any = null;
let maintenanceQueue: any = null;

export function initQueues() {
  const redis = getRedis();

  // If redis is fake/in-memory, we can compile a fake queue runner
  if (redis.isMock || redis.status !== "ready") {
    console.warn("Utilizing in-memory Queue simulation due to Redis configuration.");
    
    const fakeQueue = {
      add: async (name: string, data: any) => {
        console.log(`[Queue SIMULATOR] Job received: ${name}`, data);
        // Execute immediately in a microtask so it stays fully live
        setTimeout(() => handleJob(name, data).catch(console.error), 100);
        return { id: `fake_job_${Date.now()}` };
      },
    };
    
    emailQueue = fakeQueue;
    maintenanceQueue = fakeQueue;
    return;
  }

  try {
    const connection = redis;

    emailQueue = new Queue("emails", { connection });
    maintenanceQueue = new Queue("maintenance", { connection });

    // Start workers
    new Worker("emails", async (job) => {
      console.log(`[BullMQ] Processing ${job.name} (ID: ${job.id})`);
      await handleJob(job.name, job.data);
    }, { connection });

    new Worker("maintenance", async (job) => {
      console.log(`[BullMQ] Processing Maintenance Job: ${job.name}`);
      await handleJob(job.name, job.data);
    }, { connection });

    console.log("BullMQ Queues and Workers initialized successfully.");
  } catch (err: any) {
    console.error("Failed to start BullMQ queues. Falling back to local handlers:", err.message);
    const mockQ = {
      add: async (name: string, data: any) => {
        setTimeout(() => handleJob(name, data).catch(console.error), 100);
        return { id: `sim_job_${Date.now()}` };
      }
    };
    emailQueue = mockQ;
    maintenanceQueue = mockQ;
  }
}

export function getEmailQueue() {
  if (!emailQueue) initQueues();
  return emailQueue;
}

export function getMaintenanceQueue() {
  if (!maintenanceQueue) initQueues();
  return maintenanceQueue;
}

async function handleJob(name: string, data: any) {
  const prisma = getPrisma();

  switch (name) {
    case "welcome-email":
      await sendEmail({
        to: data.email,
        subject: "Welcome to Eurosia One!",
        template: "welcome",
        context: { name: data.name, verifyUrl: data.verifyUrl },
      });
      break;

    case "verification-email":
      await sendEmail({
        to: data.email,
        subject: "Verify your email address",
        template: "verify-email",
        context: { name: data.name, verifyUrl: data.verifyUrl, token: data.token },
      });
      break;

    case "reset-password-email":
      await sendEmail({
        to: data.email,
        subject: "Reset your Eurosia One password",
        template: "reset-password",
        context: { name: data.name, resetUrl: data.resetUrl },
      });
      break;

    case "subscription-notification":
      await sendEmail({
        to: data.email,
        subject: "Your Subscription Plan Has Been Updated",
        template: "subscription-notification",
        context: {
          name: data.name,
          planName: data.planName,
          status: data.status,
          periodEnd: data.periodEnd,
        },
      });
      break;

    case "magic-link-email":
      await sendEmail({
        to: data.email,
        subject: "Secure Handshake Magic Login Link - Eurosia One",
        template: "magic-link-email",
        context: {
          name: data.name,
          magicVerifyUrl: data.magicVerifyUrl,
        },
      });
      break;

    case "otp-email":
      await sendEmail({
        to: data.email,
        subject: "Secure Authentication Verification OTP Code - Eurosia One",
        template: "otp-email",
        context: {
          name: data.name,
          otp: data.otp,
        },
      });
      break;

    case "reset-user-usage":
      await prisma.userUsage.updateMany({
        data: {
          chatCount: 0,
          imageCount: 0,
          videoCount: 0,
          pdfCount: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          periodStart: new Date(),
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      });
      break;

    case "purge-expired-tokens":
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      break;

    case "deactivate-expired-banners":
      await prisma.banner.updateMany({
        where: {
          endsAt: { lt: new Date() },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      break;

    default:
      console.warn(`Unknown job name in queue processor: ${name}`);
  }
}
