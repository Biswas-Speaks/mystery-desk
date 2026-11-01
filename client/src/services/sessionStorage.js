// Tokens never enter application state, localStorage, logs, or URLs.
const tokenKey = (caseId) => `mystery:token:${caseId}`;
export class SessionStorageError extends Error {
  constructor() {
    super(
      'Browser session storage is unavailable. Enable it for this site to create or open a private case.',
    );
    this.name = 'SessionStorageError';
    this.code = 'SESSION_STORAGE_UNAVAILABLE';
  }
}
export function assertSessionStorageAvailable() {
  try {
    const key = 'mystery:storage-check';
    sessionStorage.setItem(key, '1');
    sessionStorage.removeItem(key);
  } catch {
    throw new SessionStorageError();
  }
}
export function readCaseToken(caseId) {
  try {
    return sessionStorage.getItem(tokenKey(caseId));
  } catch {
    throw new SessionStorageError();
  }
}
export function saveCaseToken(caseId, token) {
  try {
    sessionStorage.setItem(tokenKey(caseId), token);
  } catch {
    throw new SessionStorageError();
  }
}
