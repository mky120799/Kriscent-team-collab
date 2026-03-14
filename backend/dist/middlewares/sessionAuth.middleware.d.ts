import type { Request, Response, NextFunction } from "express";
export interface SessionUser {
    id: string;
    role: "ADMIN" | "MANAGER" | "MEMBER";
    teamId: string | null;
}
export interface AuthRequest extends Request {
    user?: SessionUser;
}
export declare const sessionAuth: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=sessionAuth.middleware.d.ts.map