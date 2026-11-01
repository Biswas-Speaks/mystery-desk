import mongoose from 'mongoose';
import { findCase } from '../repositories/caseRepository.js';
import { verifyAccessToken } from '../utils/accessToken.js';
import { fail } from '../utils/AppError.js';

export async function authenticateCase(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) fail(400, 'VALIDATION_ERROR', 'Invalid case ID.');
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token)
    fail(401, 'CASE_ACCESS_REQUIRED', 'This case needs its original browser-tab access token.');
  const caseDocument = await findCase(req.params.id, { includeTokenHash: true });
  if (!verifyAccessToken(token, caseDocument.accessTokenHash))
    fail(403, 'CASE_ACCESS_DENIED', 'This tab does not have access to this case.');
  req.caseId = caseDocument._id;
  next();
}
