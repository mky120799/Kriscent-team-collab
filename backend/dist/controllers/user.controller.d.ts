import type { Request, Response, NextFunction } from "express";
export declare const getUsers: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createUser: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUserRole: (req: any, // Using any for AuthRequest compatibility in this context
res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProfile: (req: any, // AuthRequest
res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=user.controller.d.ts.map