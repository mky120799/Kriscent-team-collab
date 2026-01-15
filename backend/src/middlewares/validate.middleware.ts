import type { Request, Response, NextFunction } from "express";
import type { Schema } from "joi";

export const validate =
  (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error && error.details && error.details[0]) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    next();
  };
