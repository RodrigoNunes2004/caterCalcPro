// You are working inside an existing multi-tenant SaaS application called caterCalcPro (Gastro Grid).
// The stack:

Frontend: React + Vite + TypeScript + Tailwind + shadcn
Backend: Express + TypeScript
Database: Drizzle ORM + PostgreSQL (Neon) or PGlite in dev
Auth: JWT (httpOnly cookie + Bearer fallback)
Billing: Stripe subscription + webhook updates organization
All business data scoped by organizationId

// IMPORTANT CONSTRAINTS:

Do NOT break existing routes.
Do NOT refactor working core logic unless explicitly instructed.
Do NOT modify existing database columns destructively.
All new features must respect organizationId tenant isolation.
All new premium features must be gated by planTier.
Maintain backward compatibility.