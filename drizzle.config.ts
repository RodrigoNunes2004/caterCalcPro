import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  ...(process.env.DATABASE_URL
    ? {
        // Production: Use Neon PostgreSQL
        dbCredentials: {
          url: process.env.DATABASE_URL,
        },
      }
    : {
        // Development: Use PGLite
        driver: "pglite",
        dbCredentials: {
          url: "./dev.db",
        },
      }),
});
