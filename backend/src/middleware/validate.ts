import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../utils/response';

/**
 * Validation middleware factory using Zod
 * Security: Validates and sanitizes all incoming requests
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        sendError(res, 'Validation failed', 400, JSON.stringify(errors));
        return;
      }
      next(error);
    }
  };
};
