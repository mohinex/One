import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ValidationError } from "../utils/errors.ts";

export const validate = (schema: { body?: any; query?: any; params?: any }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as ZodError).issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(new ValidationError("Input validation failed", issues));
      }
      return next(error);
    }
  };
};
