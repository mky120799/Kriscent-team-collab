import type { Request, Response, NextFunction } from "express";

// Define the type stored in session
export interface SessionUser {
  id: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  teamId: string | null;
}

// Extend Request type to include user
export interface AuthRequest extends Request {
  user?: SessionUser;
}

export const sessionAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = (req.session as any)?.user as SessionUser | undefined;
  
  if (!user) {
    console.log('not authorised',req.session);
    return res.status(401).json({ message: "Not authenticated" });

  }

  // Attach the logged-in user to req.user
  req.user = (req.session as any).user;
  next();
}