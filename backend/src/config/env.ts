import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32).optional().default('refresh-secret-placeholder-change-me'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default('10').transform(Number),
  COOKIE_SECRET: z.string().default('cookie-secret-change-me'),
  COOKIE_SECURE: z.string().default('false').transform(v => v === 'true'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  LOG_LEVEL: z.string().default('info'),
});

// Attempt parsing; allow partial env for test environments
let config: z.infer<typeof envSchema>;
try {
  config = envSchema.parse(process.env);
} catch (err) {
  if (process.env.NODE_ENV === 'test') {
    config = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/nivasa_test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret-minimum-32-characters-long',
      ...process.env,
    });
  } else {
    console.error('❌ Invalid environment configuration:', err);
    process.exit(1);
  }
}

export default config;
