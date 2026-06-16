// WHAT: Centralised environment variable validation using Zod
// WHY: Ensures all critical config exists at startup, prevents runtime errors from missing env vars, provides typed access to config
// FUTURE: Add support for .env.local, add config hot-reload, add validation for feature flags

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// WHAT: Define strict schema for all environment variables with proper types and defaults
// WHY: Zod provides runtime validation and TypeScript inference from schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  FRONTEND_URL: z.string().url("Invalid FRONTEND_URL"),

  // Database
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(20),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1),

  // Monnify
  MONNIFY_API_KEY: z.string().min(1),
  MONNIFY_SECRET_KEY: z.string().min(1),
  MONNIFY_CONTRACT_CODE: z.string().min(1),
  MONNIFY_BASE_URL: z.string().url("Invalid MONNIFY_BASE_URL"),

  // SMTP
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().email("Invalid EMAIL_FROM"),

  // Platform config
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(10),
  WITHDRAWAL_FEE_KOBO: z.coerce.number().int().min(0).default(5000),

  // NeedFull bank details for manual deposits
  NEEDFULL_BANK_NAME: z.string().min(1),
  NEEDFULL_ACCOUNT_NUMBER: z.string().min(1),
  NEEDFULL_ACCOUNT_NAME: z.string().min(1),
});

// WHAT: Type inference from schema for full TypeScript support
// WHY: Provides autocomplete and type safety when accessing env variables
type Environment = z.infer<typeof envSchema>;

// WHAT: Validate env vars and throw on startup if any are missing or invalid
// WHY: Fail fast at boot time rather than at runtime when a missing var is accessed
let env: Environment;

try {
  env = envSchema.parse(process.env);
  console.log(
    `✓ Environment validated. Running in ${env.NODE_ENV} mode on port ${env.PORT}`,
  );
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n  ");
    console.error(
      "FATAL: Invalid environment configuration:\n  " + missingVars,
    );
  }
  process.exit(1);
}

// WHAT: Export fully typed and validated environment config
// WHY: Single source of truth for all env vars across the application
export default env;
