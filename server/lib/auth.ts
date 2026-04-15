import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set in production - auth will fail");
}
const JWT_EXPIRES_IN = "7d";

export type JWTPayload = {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Use Bearer when valid; if a Bearer is sent but expired/invalid (stale localStorage), fall back to the
 * httpOnly `token` cookie so API routes match `fetch(..., { credentials: "include" })` behavior.
 */
export function resolveAuthPayload(input: {
  authorization?: string;
  cookieToken?: unknown;
}): JWTPayload | null {
  const authHeader = input.authorization;
  const cookieTok = input.cookieToken;

  if (authHeader?.startsWith("Bearer ")) {
    const fromBearer = verifyToken(authHeader.slice(7));
    if (fromBearer) return fromBearer;
  }
  if (cookieTok) {
    return verifyToken(String(cookieTok));
  }
  return null;
}
