import { AppError } from '../utils/AppError.js';

const unavailableErrors = new Set([
  'MongoNetworkError',
  'MongoServerSelectionError',
  'MongooseServerSelectionError',
  'MongoNotConnectedError',
  'MongoTopologyClosedError',
]);

/** Never serialize raw database/provider errors, even when they carry a status. */
export function classifyError(error) {
  if (error instanceof AppError) return error;
  if (
    ['ZodError', 'ValidationError', 'CastError'].includes(error?.name) ||
    ['entity.parse.failed', 'entity.too.large'].includes(error?.type)
  )
    return new AppError(400, 'VALIDATION_ERROR', 'Check your request fields and try again.');
  if (unavailableErrors.has(error?.name))
    return new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'The case database is temporarily unavailable. Please try again shortly.',
    );
  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const safeError = classifyError(error);
  if (safeError.status >= 500) {
    // Log only allowlisted diagnostic fields. Never log input, tokens or raw errors.
    req.app.locals.logger.error({
      event: 'request_failed',
      requestId: req.requestId,
      code: safeError.code,
      status: safeError.status,
    });
  }
  res
    .status(safeError.status)
    .json({ error: { code: safeError.code, message: safeError.message } });
}
