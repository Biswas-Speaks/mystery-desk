import { rateLimit } from 'express-rate-limit';
const message = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.' },
};
export const createGeneralRateLimiter = () =>
  rateLimit({
    windowMs: 60000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message,
  });
export const createGenerationRateLimiter = () =>
  rateLimit({
    windowMs: 3600000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message,
  });
