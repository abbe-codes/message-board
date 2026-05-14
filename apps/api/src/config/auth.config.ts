import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookie: {
    name: process.env.AUTH_COOKIE_NAME ?? 'sde_challenge_session',
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    secure: process.env.AUTH_COOKIE_SECURE === 'true',
    sameSite: process.env.AUTH_COOKIE_SAME_SITE ?? 'lax',
  },
}));
