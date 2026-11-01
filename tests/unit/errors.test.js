import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyError, errorHandler } from '../../server/src/middleware/errorHandler.js';
import { AppError } from '../../server/src/utils/AppError.js';

test('only intentional application errors expose their message and status', () => {
  assert.deepEqual(
    classifyError(new AppError(409, 'CASE_COMPLETED', 'Case closed.')),
    new AppError(409, 'CASE_COMPLETED', 'Case closed.'),
  );
  const providerError = Object.assign(new Error('secret-provider-key'), {
    status: 401,
    code: 'RAW_PROVIDER_ERROR',
  });
  const safe = classifyError(providerError);
  assert.equal(safe.status, 500);
  assert.equal(safe.code, 'INTERNAL_ERROR');
  assert.doesNotMatch(safe.message, /secret/);
});

test('validation and database availability errors get safe actionable statuses', () => {
  for (const name of ['ZodError', 'CastError', 'ValidationError'])
    assert.equal(classifyError({ name }).status, 400);
  assert.equal(classifyError({ type: 'entity.parse.failed' }).status, 400);
  assert.equal(
    classifyError({ name: 'MongoNetworkError', message: 'mongodb://secret' }).status,
    503,
  );
});

test('error logs and responses omit raw error details', () => {
  let log, response, status;
  const req = {
    requestId: 'request-1',
    app: {
      locals: {
        logger: {
          error: (data) => {
            log = data;
          },
        },
      },
    },
  };
  const res = {
    status: (value) => {
      status = value;
      return res;
    },
    json: (value) => {
      response = value;
    },
  };
  errorHandler(new Error('private-token'), req, res, () => assert.fail('Unexpected delegation'));
  assert.equal(status, 500);
  assert.equal(log.requestId, 'request-1');
  assert.doesNotMatch(JSON.stringify([log, response]), /private-token|stack/);
  const original = new Error('response already started');
  errorHandler(original, req, { headersSent: true }, (error) => assert.equal(error, original));
});
