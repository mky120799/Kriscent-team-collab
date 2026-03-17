import session from "express-session";
import MongoStore from "connect-mongo";

import "dotenv/config";

const mongoUrl = process.env.MONGO_URI;
if (!mongoUrl) {
  throw new Error("MONGO_URI is not defined in .env");
}

export const sessionMiddleware = session({
  name: "kriscent.sid",
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl,
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});
