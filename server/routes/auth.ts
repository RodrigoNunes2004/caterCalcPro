import { Router, type Request, type Response } from "express";
import { createOrganizationAndOwner, findUserByEmail } from "../lib/authStorage.js";
import { verifyPassword, signToken, verifyToken } from "../lib/auth.js";

const router = Router();

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { companyName, email, password } = req.body;
    if (!companyName?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: "Company name, email, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const result = await createOrganizationAndOwner({
      companyName: companyName.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    if (!result) {
      res.status(400).json({ error: "Email may already be registered" });
      return;
    }
    const token = signToken({
      userId: String(result.user.id),
      organizationId: String(result.organizationId),
      role: String(result.user.role),
      email: String(result.user.email),
    });
    const userResponse = {
      id: String(result.user.id),
      email: String(result.user.email),
      name: result.user.name ?? undefined,
      role: String(result.user.role),
      organizationId: String(result.organizationId),
    };
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({ user: userResponse, token }); // token fallback when cookies fail (e.g. Vercel)
  } catch (err: any) {
    console.error("Register error:", err);
    const msg = err?.message || "";
    const isTableMissing = /relation "organizations" does not exist|relation "users" does not exist/i.test(msg);
    res.status(500).json({
      error: isTableMissing
        ? "Database not migrated. Run: pnpm db:push (or pnpm db:push:force to skip prompts)"
        : "Registration failed",
    });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const found = await findUserByEmail(email.toLowerCase().trim());
    if (!found || !(await verifyPassword(password, String(found.passwordHash)))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({
      userId: String(found.id),
      organizationId: String(found.organizationId),
      role: String(found.role),
      email: String(found.email),
    });
    const userResponse = {
      id: String(found.id),
      email: String(found.email),
      name: found.name ?? undefined,
      role: String(found.role),
      organizationId: String(found.organizationId),
    };
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ user: userResponse, token }); // token fallback when cookies fail (e.g. Vercel)
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const cookies = req.cookies || {};
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookies.token;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Auth check failed" });
  }
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token").json({ ok: true });
});

export default router;
