import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const error = result.error as ZodError;
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.flatten().fieldErrors,
      });
      return;
    }
    // Replace with parsed + coerced data
    req[target] = result.data as typeof req[typeof target];
    next();
  };
}
