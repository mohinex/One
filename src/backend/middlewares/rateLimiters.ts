import rateLimit from "express-rate-limit";

// Auth Endpoint Limiter: 100 in development, 10 in production
const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 100 : 10,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_AUTH_ATTEMPTS",
      message: "Too many login attempts. Please wait 1 minute and try again.",
      messageBn: "অল্প সময়ে অনেকবার লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Standard API Limiter: 100 requests per minute per user
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: "API_RATE_LIMIT_EXCEEDED",
      message: "You have exceeded your 100 API queries per minute threshold.",
    },
  },
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip; // rate limit by user ID or IP fallback
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Admin Control Panel Limiter: 200 requests per minute per admin
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: {
      code: "ADMIN_RATE_LIMIT_EXCEEDED",
      message: "Admin control panel limit reached: Maximum 200 entries per minute.",
    },
  },
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Media/Multipart Upload Limiter: 10 uploads per minute per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: "UPLOAD_RATE_LIMIT_EXCEEDED",
      message: "Upload threshold reached: Max 10 resource uploads per minute.",
    },
  },
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
