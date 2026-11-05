import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  SESSION_DURATION_MINUTES: z.coerce.number().int().positive().default(30),
  COOKIE_NAME: z.string().default("my_vault_session"),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
  TEST_MODE: z.string().default("false"),
  TEST_API_KEY: z.string().default(""),
  // ── Self-hosted master key ──────────────────────────────
  // The single master key that grants access to the dashboard.
  // When set, the server auto-provisions the vault on startup.
  MASTER_KEY: z.string().min(8, "MASTER_KEY must be at least 8 characters").optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
