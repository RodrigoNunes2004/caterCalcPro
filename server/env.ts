/**
 * Load first in server entry so process.env is set before storage/routes import chains.
 * Resolves .env from project root (not cwd), so PORT/DATABASE_URL apply when dev is started elsewhere.
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
