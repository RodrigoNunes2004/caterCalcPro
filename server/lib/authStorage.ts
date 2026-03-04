import { db } from "../storage.js";
import { organizations, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth.js";
const TRIAL_DAYS = 30;

export interface CreateUserResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
}

export async function createOrganizationAndOwner(params: {
  companyName: string;
  email: string;
  password: string;
}): Promise<{ user: CreateUserResult; organizationId: string } | null> {
  const { companyName, email, password } = params;
  const emailLower = email.toLowerCase().trim();

  const existing = await findUserByEmail(emailLower);
  if (existing) return null;

  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const orgValues = {
    name: companyName,
    plan: "trial",
    planTier: "starter",
    trialEndsAt,
    subscriptionStatus: "trialing",
  };
  const [org] = await db.insert(organizations).values(orgValues as any).returning();

  if (!org) return null;

  const userValues = {
    name: null,
    email: emailLower,
    passwordHash,
    role: "owner",
    organizationId: org.id,
  };
  const [user] = await db.insert(users).values(userValues as any).returning();

  if (!user) return null;

  const u = user as unknown as CreateUserResult;
  return {
    user: { id: u.id, email: u.email, name: u.name, role: u.role, organizationId: u.organizationId },
    organizationId: org.id,
  };
}

export interface FoundUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
  passwordHash: string;
  organization: { id: string; name: string; trialEndsAt: Date | null; subscriptionStatus: string | null };
}

export async function findUserByEmail(email: string): Promise<FoundUser | null> {
  const result = await db
    .select({
      user: users,
      orgId: organizations.id,
      orgName: organizations.name,
      trialEndsAt: organizations.trialEndsAt,
      subscriptionStatus: organizations.subscriptionStatus,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  const u = row.user as unknown as { id: string; email: string; name: string | null; role: string; organizationId: string; passwordHash: string };
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    organizationId: u.organizationId,
    passwordHash: u.passwordHash,
    organization: {
      id: row.orgId as string,
      name: row.orgName as string,
      trialEndsAt: row.trialEndsAt,
      subscriptionStatus: row.subscriptionStatus,
    },
  };
}
