import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, type JWTPayload } from "../lib/auth.js";

export type AuthRequest = Request & {
  auth?: JWTPayload;
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.token;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.auth = payload;
  next();
}
