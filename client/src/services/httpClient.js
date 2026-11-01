import axios from 'axios';
import { readCaseToken, SessionStorageError } from './sessionStorage.js';

/** Safe, consistent errors for request hooks and page recovery UI. */
export class ApiError extends Error {
  constructor(message, { code = 'NETWORK_ERROR', status = 0 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error instanceof SessionStorageError)
    return new ApiError(error.message, { code: error.code });
  if (axios.isCancel(error))
    return new ApiError('The request was cancelled.', { code: 'REQUEST_CANCELLED' });
  const status = error?.response?.status || 0;
  const envelope = error?.response?.data?.error;
  if (typeof envelope?.message === 'string' && typeof envelope?.code === 'string')
    return new ApiError(envelope.message, { status, code: envelope.code });
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT')
    return new ApiError('The request took too long. Check the case before retrying an action.', {
      code: 'REQUEST_TIMEOUT',
    });
  return new ApiError(
    status
      ? 'The server could not complete this request. Please try again.'
      : 'Unable to connect. Check your connection and try again.',
    { status },
  );
}

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 50000,
});
httpClient.interceptors.request.use((config) => {
  const caseId = config.url.match(/^\/cases\/([^/]+)/)?.[1];
  if (caseId) {
    const token = readCaseToken(caseId);
    if (!token)
      throw new ApiError(
        'Open this case in its original browser tab. Its access token is missing.',
        { code: 'CASE_ACCESS_REQUIRED', status: 401 },
      );
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
);
export default httpClient;
