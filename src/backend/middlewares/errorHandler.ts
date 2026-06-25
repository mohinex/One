import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.ts";
import logger from "../utils/logger.ts";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred on our systems.";
  let details = err.details || undefined;

  // Parse known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === "ValidationError" || err.name === "ZodError" || err.code === "ZOD_ERROR") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = err.message || "Input validation failed";
    details = err.errors || err.details;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "UNAUTHORIZED_TOKEN";
    message = "Your authentication session is invalid or has expired.";
  } else if (err.type === "StripeCardError" || err.type === "StripeError" || err.code === "StripeError") {
    statusCode = 402;
    code = "PAYMENT_REQUIRED";
    message = err.message || "Your payment transaction was declined by Stripe.";
  } else if (err.code && err.code.startsWith("P20")) {
    // Prisma Engine DB errors mapping
    statusCode = err.code === "P2002" ? 409 : 400;
    code = err.code === "P2002" ? "DUPLICATE_RESOURCE" : "DATABASE_ERROR";
    message = err.code === "P2002" 
      ? "A resource with this unique constraint already exists." 
      : `Database operations constraint failed. (Error Class Code: ${err.code})`;
  }

  // Log everything internally with appropriate severity levels (5xx are actual server errors, 4xx are client issues)
  if (statusCode >= 500) {
    logger.error(err);
  } else if (statusCode === 419 || statusCode === 401 || code === "AUTH_ERROR" || code === "UNAUTHORIZED_TOKEN") {
    // Expected authentication / guest states. Do not log to keep standard output free of false-positive warnings.
  } else {
    logger.warn(`Client Request Issue [${statusCode}] [${code}]: ${err.message || err}`);
  }

  // Consistent payload formatting
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    },
  });
};
