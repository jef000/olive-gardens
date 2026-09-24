import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().min(1, 'Database name is required'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z.string().min(1, 'Database password is required'),
  DB_MAX_CONNECTIONS: z.string().default('20'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters')
    .refine(
      (value) =>
        process.env.NODE_ENV === 'test' ||
        !/(change-this|your-super-secret|placeholder|example|changeme)/i.test(value),
      'JWT_SECRET still contains an example placeholder. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    ),
  JWT_EXPIRY: z.string().default('1h'),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  BCRYPT_ROUNDS: z.string().default('12'),

  // Set to the number of trusted proxy hops (e.g. "1") only when the API sits
  // behind a reverse proxy/CDN that overwrites X-Forwarded-For. False = ignore
  // forwarding headers entirely.
  TRUST_PROXY: z.string().default('false'),
  
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.string().transform(val => parseInt(val, 10)).default('587'),
  EMAIL_SECURE: z.string().transform(val => val === 'true').default('false'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@olivegarden.com'),
  
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  RESET_TOKEN_EXPIRY: z.string().default('3600000'),

  REDIS_URL: z.string().optional(),
  REDIS_MODE: z.enum(['redis', 'memory']).optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  
  database: {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    maxConnections: parseInt(env.DB_MAX_CONNECTIONS, 10),
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiry: env.JWT_EXPIRY,
  },
  
  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  },
  
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  bcrypt: {
    rounds: parseInt(env.BCRYPT_ROUNDS, 10),
  },
  
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    user: env.EMAIL_USER,
    password: env.EMAIL_PASSWORD,
    from: env.EMAIL_FROM,
  },
  
  frontend: {
    url: env.FRONTEND_URL,
  },
  
  resetToken: {
    expiry: parseInt(env.RESET_TOKEN_EXPIRY, 10),
  },
  
  redis: {
    url: env.REDIS_URL || '',
  },

  trustProxy: env.TRUST_PROXY === 'true' ? true : /^\d+$/.test(env.TRUST_PROXY) ? parseInt(env.TRUST_PROXY, 10) : false,

  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const;

export default config;
