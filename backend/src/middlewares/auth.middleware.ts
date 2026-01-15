import type { Request, Response, NextFunction } from "express";
import User, { type IUser } from "../models/User.model.js";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
