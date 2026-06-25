import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../config/db.ts";
import { getRedis } from "../config/redis.ts";
import { AuthenticationError, ForbiddenError } from "../utils/errors.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    planId?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthenticationError("Authorization Bearer token is missing"));
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";

  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string; role: any; email: string };
    const userId = payload.sub;

    const redis = getRedis();
    const cacheKey = `user:active:${userId}`;

    // Read cached state from Redis (60s cache limit)
    let cachedState = await redis.get(cacheKey);
    let isActive = true;
    let planId = "free";

    if (cachedState) {
      const parsed = JSON.parse(cachedState);
      isActive = parsed.isActive;
      planId = parsed.planId;
    } else {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        return next(new AuthenticationError("Identified user session no longer exists in database."));
      }

      isActive = user.isActive;
      planId = user.subscription?.planId || "free";

      // Cache user status in Redis for 60s
      await redis.set(cacheKey, JSON.stringify({ isActive, planId }), "EX", 60);
    }

    if (!isActive) {
      return next(new ForbiddenError("This account has been banned or deactivated by an administrator."));
    }

    req.user = {
      id: userId,
      email: payload.email,
      role: payload.role,
      planId,
    };

    return next();
  } catch (error) {
    return next(new AuthenticationError("Invalid or expired access session token"));
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    return next(new ForbiddenError("Access restricted to Platform Administrators."));
  }
  return next();
};
