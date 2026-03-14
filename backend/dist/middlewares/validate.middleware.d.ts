import type { Request, Response, NextFunction } from "express";
import type { Schema } from "joi";
export declare const validate: (schema: Schema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validate.middleware.d.ts.map