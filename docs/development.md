# Development guide

## Refactor decisions

The requested cleanup supersedes the original example folder tree in `SPEC.md`; gameplay and API contracts remain unchanged. Environment files now live under root `config/`, route components use a `Page` suffix, database operations have a repository layer, and React Context plus a reducer owns shared case state. No extra state-management dependency is needed for this small anonymous game.

## Naming and boundaries

- React components use PascalCase files and functions. Route components end in `Page.jsx`.
- Hooks start with `use`; non-component modules and functions use descriptive camelCase names.
- Constants use uppercase names. Public shared limits belong in `shared/gameRules.js`.
- Server modules describe their role: `caseController`, `caseService`, `caseRepository`, `caseSerializer`, `generationSchema`.
- Use explicit relative imports with file extensions. Keep HTTP details in controllers, queries in repositories, and gameplay decisions in services.
- Format with Prettier and enforce EditorConfig. Comments explain invariants, authorization and concurrency rather than repeating statements.

## Error handling

Expected server failures throw `AppError(status, code, safeMessage)`. The centralized handler trusts only this class. Zod/body/Mongoose validation maps to 400; recognized database availability failures map to 503; unexpected errors become generic 500 responses. Arbitrary upstream status/message properties are not forwarded.

Every request gets a generated `X-Request-ID`. Error logs contain only allowlisted metadata: event, request ID, code and status. Never log request bodies, headers, tokens, connection strings, generated solutions or raw provider errors. Do not swallow a failure unless a surrounding layer owns its error state or process recovery.

The browser normalizes API envelopes, timeouts, cancellation, offline failures and session-storage failures. Page errors expose retry controls; rendering failures use the application error boundary. Mutation errors live in the shared store. Local form validation remains local. A completed-case conflict redirects to the existing result.

Do not add automatic mutation retries. A timed-out request may already have committed; reconcile via a read. A hint request always consumes the next hint on success.

## Adding a gameplay action

1. Define and validate its request schema and safe response contract in `SPEC.md`.
2. Add the service rule using the repository's conditional update helper; select the solution only if required.
3. Add an explicit serializer and thin controller/route.
4. Add a transport method and shared-store action. Keep tokens out of state.
5. Verify duplicate/concurrent requests, expired cases, missing tokens, safe errors and secret omission. Add a browser journey for meaningful new interactions.

## Checks

Run `npm run test:unit`, `npm run test:integration`, `npm run lint`, `npm run format:check`, `npm run build` and `npm run test:e2e`. Integration tests use MongoMemoryServer and mock Groq completions. Browser tests intercept the API at desktop and mobile widths; they do not prove live Atlas/Groq connectivity. Credentials and production data are never needed for automated tests.

Dependency-free tests cover stale reads, mutation invalidation, immutable updates, case isolation, hint deduplication, completion, safe error mapping/logging, token comparisons, scores and storage failure recovery. They run with Node's built-in test runner even when registry access is unavailable.

The root `package-lock.json` records resolved workspace dependencies. Commit it with dependency changes and use `npm ci` for reproducible installs in CI and deployment.
