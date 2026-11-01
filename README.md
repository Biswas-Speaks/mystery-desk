# AI Mystery Room

A fictional detective game built with React, Vite, Tailwind, Express, MongoDB Atlas, and server-only Groq. The product contract is [SPEC.md](SPEC.md).

## Quick start

Requires Node 20.19+ or 22.12+, npm, MongoDB Atlas, and a Groq API key.

```sh
npm install
npm run setup:env
# Fill in config/server/.env with Atlas credentials and your Groq key.
npm run dev
```

Open http://127.0.0.1:5173. API health: http://127.0.0.1:5000/api/health. In PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

Environment files are isolated in `config/client/` and `config/server/`, outside application source. Only `.env.example` files belong in version control. Existing environment variables take precedence. Set `SERVER_ENV_FILE` to use a server environment file outside the repository; production should inject secrets through its host. Only public variables prefixed with `VITE_` may reach the browser. See [configuration](docs/configuration.md).

## Structure

```text
client/src/
  app/                 Routing and application composition
  pages/               Route components, named *Page.jsx
  components/          Reusable UI and error boundary
  features/cases/      Case hooks, API methods, reducer and provider
  services/            HTTP client, normalized errors, session token storage
  styles/              Shared styling and responsive rules
server/src/
  config/              Validated environment and database connection
  routes/              Endpoint registration and middleware
  controllers/         HTTP validation and response handling
  services/            Gameplay, generation and scoring
  repositories/        MongoDB queries and conditional writes
  serializers/         Explicit public response allowlists
  models/              Mongoose persistence schema
  schemas/             Zod request and generation schemas
  middleware/          Authentication, request context, limits and safe errors
  utils/               Token hashing and application errors
shared/                Public difficulty rules used by both applications
config/                Environment examples and ignored local runtime files
tests/unit/            Dependency-free state, security and error tests
server/tests/          Groq mocks and disposable MongoDB integration tests
e2e/                   Browser journeys using API-contract mocks
docs/                  Architecture, configuration and development guide
scripts/               Local environment setup
```

MongoDB remains authoritative for progress, scoring and completion. React Context and a reducer share case state across pages; tokens remain exclusively in sessionStorage. Cases expire after seven days. A lost token cannot be recovered.

## Commands

| Command                    | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`              | Start API and Vite together                                      |
| `npm run setup:env`        | Create local environment files without overwriting existing ones |
| `npm run test:unit`        | Run state, error and security tests without dependencies         |
| `npm run test:integration` | Vitest, mocked Groq and disposable MongoDB tests                 |
| `npm test`                 | Unit tests followed by integration tests                         |
| `npm run test:e2e`         | Playwright desktop and mobile journeys                           |
| `npm run lint`             | ESLint, including React hook rules                               |
| `npm run format:check`     | Check consistent formatting                                      |
| `npm run format`           | Format source and documentation                                  |
| `npm run build`            | Build the production frontend                                    |

For browser tests, first run `npx playwright install chromium`. Integration tests may download a MongoDB binary on first run; they never connect to production Atlas.

## Documentation and verification

- [Architecture and data flow](docs/architecture.md)
- [Environment and deployment](docs/configuration.md)
- [Development conventions and error handling](docs/development.md)

All 12 dependency-free tests and 24 integration/generation/environment tests pass. Project ESLint and the production frontend build pass. Browser tests could not launch because Playwright's Chromium executable is not installed; run `npx playwright install chromium` before running them. No live-provider test or production deployment is claimed.
