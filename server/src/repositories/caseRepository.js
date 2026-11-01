import { Case } from '../models/Case.js';
import { fail } from '../utils/AppError.js';

export async function findCase(caseId, { includeSolution = false, includeTokenHash = false } = {}) {
  const query = Case.findOne({ _id: caseId, expiresAt: { $gt: new Date() } });
  if (includeSolution) query.select('+solution');
  if (includeTokenHash) query.select('+accessTokenHash');
  const caseDocument = await query;
  if (!caseDocument) fail(404, 'CASE_NOT_FOUND', 'This case was not found or has expired.');
  return caseDocument;
}

export const insertCase = (data) => Case.create(data);

/** Revision + active status ensure scoring and progress share one atomic snapshot. */
export async function updateActiveCase(caseId, revision, update, { includeSolution = false } = {}) {
  const query = Case.findOneAndUpdate(
    { _id: caseId, status: 'active', revision, expiresAt: { $gt: new Date() } },
    { ...update, $inc: { revision: 1 } },
    { new: true, runValidators: true },
  );
  if (includeSolution) query.select('+solution');
  return query;
}
