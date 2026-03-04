/**
 * PGLite-only: Creates organizations, users tables. Run ensureOrganizationIdColumns
 * AFTER ensureMenusTable so all tenant tables exist.
 */
import { getPgliteClient } from "../storage.js";
import { db } from "../storage.js";
import { organizations, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth.js";

export async function ensureAuthTables(): Promise<void> {
  if (process.env.DATABASE_URL) return;
  const client = getPgliteClient();
  if (!client) return;

  try {
    await db.select().from(organizations).limit(1);
  } catch (err: any) {
    if (
      err?.message?.includes('relation "organizations" does not exist') ||
      err?.message?.includes("organizations")
    ) {
      console.log("Running auth migration (organizations, users)...");
      await runAuthMigration(client);
      console.log("Auth migration completed");
    }
  }
}

/** Call after ensureMenusTable so recipes, ingredients, events, menus all exist. */
export async function ensureOrganizationIdColumns(): Promise<void> {
  if (process.env.DATABASE_URL) return;
  const client = getPgliteClient();
  if (!client) return;
  await runOrganizationIdMigration(client);
}

async function runAuthMigration(client: any): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS "organizations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "plan" varchar(20) DEFAULT 'trial',
      "plan_tier" varchar(20) DEFAULT 'starter',
      "trial_ends_at" timestamp,
      "subscription_status" varchar(20) DEFAULT 'trialing',
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text,
      "email" text NOT NULL UNIQUE,
      "password_hash" text NOT NULL,
      "role" varchar(20) NOT NULL DEFAULT 'owner',
      "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  await client.exec(sql);
}

async function runOrganizationIdMigration(client: any): Promise<void> {
  const tables = [
    { name: "recipes", table: "recipes" },
    { name: "ingredients", table: "ingredients" },
    { name: "events", table: "events" },
    { name: "menus", table: "menus" },
  ];

  for (const { name, table } of tables) {
    try {
      await client.exec(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = 'organization_id'
          ) THEN
            ALTER TABLE "${table}" ADD COLUMN "organization_id" uuid;
          END IF;
        END $$;
      `);
    } catch (_err) {
      // ignore
    }
  }

  let devOrgId: string | null = null;
  const orgs = await db.select().from(organizations).where(eq(organizations.name, "Development")).limit(1);
  if (orgs.length > 0) {
    devOrgId = orgs[0].id;
  } else {
    const orgValues: any = {
      name: "Development",
      plan: "trial",
      planTier: "starter",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionStatus: "trialing",
    };
    const [org] = await db.insert(organizations).values(orgValues).returning();
    devOrgId = org?.id ?? null;
  }

  if (!devOrgId) return;

  for (const { table } of tables) {
    try {
      await client.exec(`
        UPDATE "${table}" SET organization_id = '${devOrgId}' WHERE organization_id IS NULL;
      `);
      await client.exec(`
        ALTER TABLE "${table}" ALTER COLUMN organization_id SET NOT NULL;
      `);
    } catch (err: any) {
      if (!err?.message?.includes("already exists") && !err?.message?.includes("duplicate")) {
        console.warn(`Could not set organization_id on ${table}:`, err?.message);
      }
    }
  }

  try {
    await client.exec(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'recipes_organization_id_organizations_id_fk'
        ) THEN
          ALTER TABLE "recipes" ADD CONSTRAINT "recipes_organization_id_organizations_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'ingredients_organization_id_organizations_id_fk'
        ) THEN
          ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_organization_id_organizations_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'events_organization_id_organizations_id_fk'
        ) THEN
          ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'menus_organization_id_organizations_id_fk'
        ) THEN
          ALTER TABLE "menus" ADD CONSTRAINT "menus_organization_id_organizations_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);
  } catch (_err) {
    // FKs may already exist
  }

  const existingUsers = await db.select().from(users).where(eq(users.email, "dev@example.com")).limit(1);
  if (existingUsers.length === 0) {
    const pw = await hashPassword("dev123");
    const userValues: any = {
      name: "Dev User",
      email: "dev@example.com",
      passwordHash: pw,
      role: "owner",
      organizationId: devOrgId,
    };
    await db.insert(users).values(userValues);
    console.log("Created dev user: dev@example.com / dev123");
  }
}
