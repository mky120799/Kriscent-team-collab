import type { Response, NextFunction } from "express";
import { type AuthRequest } from "./auth.middleware.js";
export declare const authorizeRoles: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=rbac.middleware.d.ts.map