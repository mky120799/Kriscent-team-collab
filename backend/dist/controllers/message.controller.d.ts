import type { Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth.middleware.js";
export declare const getMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=message.controller.d.ts.map