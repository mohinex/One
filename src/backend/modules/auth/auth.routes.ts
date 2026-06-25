import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authLimiter } from "../../middlewares/rateLimiters.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import * as authController from "./auth.controller.ts";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getPrisma } from "../../config/db.ts";
import jwt from "jsonwebtoken";

const router = Router();

// Zod Input Validations
const registerSchema = {
  body: z.object({
    email: z.string().email("A valid corporate email format is required."),
    password: z
      .string()
      .min(8, "Minimum length of 8 characters.")
      .regex(/(?=.*[0-9])/, "Password must contain at least one digit (0-9).")
      .regex(/(?=.*[!@#$%^&*])/, "Password must contain at least one special character (!@#$%^&*)."),
    name: z.string().min(2, "Name must be between 2 and 50 characters").max(50, "Name must be between 2 and 50 characters"),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Minimum length of 8 characters.")
      .regex(/(?=.*[0-9])/, "Password must contain at least one digit (0-9).")
      .regex(/(?=.*[!@#$%^&*])/, "Password must contain at least one special character (!@#$%^&*)."),
  }),
};

// Passport Google configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "mock-id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "mock-secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

if (GOOGLE_CLIENT_ID !== "mock-id") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${FRONTEND_URL}/api/v1/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const prisma = getPrisma();
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(new Error("No email returned from Google."));
          }

          // Upsert googleId
          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
          if (!user) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              user = await prisma.user.update({
                where: { email },
                data: { googleId: profile.id },
              });
            } else {
              user = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                  data: {
                    email,
                    name: profile.displayName || "Google User",
                    googleId: profile.id,
                    isEmailVerified: true,
                    role: "USER",
                  },
                });
                const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
                await tx.userUsage.create({
                  data: {
                    userId: newUser.id,
                    periodEnd,
                  },
                });
                return newUser;
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// Authentication API router mapping
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/magic-link", authLimiter, authController.requestMagicLink);
router.post("/magic-verify", authController.verifyMagicLink);
router.post("/request-otp", authLimiter, authController.requestOtp);
router.post("/verify-token", authLimiter, authController.verifyToken);
router.post("/oauth/google", authLimiter, authController.oauthGoogle);
router.post("/oauth/microsoft", authLimiter, authController.oauthMicrosoft);
router.post("/oauth/github", authLimiter, authController.oauthGithub);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get("/verify-email", authController.verifyEmail);

// Multi-Factor TOTP setup
router.post("/2fa/setup", authenticate as any, authController.setup2FA as any);
router.post("/2fa/verify", authenticate as any, authController.verify2FA as any);
router.post("/2fa/validate", authController.validate2FA);

// Google Sign-In Initiator
if (GOOGLE_CLIENT_ID !== "mock-id") {
  router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req: any, res) => {
      // Create token
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";
      const accessToken = jwt.sign(
        { sub: req.user.id, role: req.user.role, email: req.user.email },
        ACCESS_SECRET,
        { expiresIn: "15m" }
      );
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    }
  );
}

export default router;
