import { type Request, type Response, type NextFunction } from "express";
import { resolveAuthPayload, type JWTPayload } from "../lib/auth.js";

export type AuthRequest = Request & {
  auth?: JWTPayload;
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const payload = resolveAuthPayload({
    authorization: req.headers.authorization,
    cookieToken: req.cookies?.token,
  });

  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.auth = payload;
  next();
}

/** Sets `req.auth` when a valid token is present; otherwise continues without auth (for public endpoints that still benefit from org context). */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const payload = resolveAuthPayload({
    authorization: req.headers.authorization,
    cookieToken: req.cookies?.token,
  });
  if (payload) req.auth = payload;
  next();
}
