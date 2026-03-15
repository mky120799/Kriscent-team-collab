import { type Response, type NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth.middleware.js";
export declare const parseCommand: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=assistant.controller.d.ts.map