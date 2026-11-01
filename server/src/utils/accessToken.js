import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
export const createAccessToken = () => randomBytes(32).toString('hex');
export const hashAccessToken = (token) => createHash('sha256').update(token).digest('hex');
export const verifyAccessToken = (token, hash) =>
  typeof token === 'string' &&
  /^[a-f0-9]{64}$/.test(token) &&
  typeof hash === 'string' &&
  /^[a-f0-9]{64}$/.test(hash) &&
  timingSafeEqual(Buffer.from(hashAccessToken(token), 'hex'), Buffer.from(hash, 'hex'));
