# Configuration and deployment

## Local environment

Run `npm run setup:env`. It copies the committed examples to `config/server/.env` and `config/client/.env`, without replacing existing files. Runtime `.env` files and their variants are ignored. Keep actual credentials out of JavaScript, documentation, logs and test fixtures.

The server reads `SERVER_ENV_FILE` when specified; otherwise it uses `config/server/.env`. Process environment variables take precedence over file values. Missing files are allowed when the host supplies all required variables. Invalid configuration stops startup. Vite reads `config/client/`; its public variables are compiled into the bundle, so changing them requires a rebuild.

| Variable             | Where          | Required/default                                                           |
| -------------------- | -------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI`        | Server         | Required Atlas URI with database name                                      |
| `GROQ_API_KEY`       | Server         | Required provider secret                                                   |
| `GROQ_MODEL`         | Server         | Required configured text model                                             |
| `GROQ_RESPONSE_MODE` | Server         | `json_schema` by default; `json_object` explicitly opts out of schema mode |
| `CLIENT_URL`         | Server         | Required comma-separated exact HTTP(S) origins; no wildcard or path        |
| `PORT`               | Server         | `5000`                                                                     |
| `AI_TIMEOUT_MS`      | Server         | `45000`, at most 45000                                                     |
| `AI_MAX_ATTEMPTS`    | Server         | `3`, from 1 to 3                                                           |
| `SERVER_ENV_FILE`    | Server process | Optional absolute or working-directory-relative environment file           |
| `NODE_ENV`           | Server host    | Set `production` for deployed processes                                    |
| `VITE_API_BASE_URL`  | Client build   | `/api` locally; deployed backend URL ending in `/api`                      |

Never prefix a server secret with `VITE_`. Never put server values in the client environment directory. The example model was selected from the [Groq structured-output documentation](https://console.groq.com/docs/structured-outputs) during initial implementation; recheck availability, schema support and output budget before deployment. Configure JSON Object mode explicitly if the chosen model does not support schema mode.

## Atlas

Use separate development, test and production databases, with dedicated database users limited to `readWrite` on their own database. URL-encode credentials in the SRV connection string and retain TLS. Add only developer and backend egress IPs to Atlas's access list. Prefer stable egress or a private connection in production. Rotate database and Groq credentials in host secrets and revoke previous credentials.

Startup connects before listening and creates the `expiresAt` index with `expireAfterSeconds: 0`. TTL cleanup is asynchronous, so application queries immediately reject expired cases. Choose a backup policy suitable for the Atlas tier. Seven-day anonymous cases can be treated as disposable, but explicitly record the production recovery policy before launch.

## Hosting

This is a workspace monorepo; both client and server import public rules from `shared/`. Deploy from the repository root so shared files are included.

- **Frontend/Vercel:** use the repository root, `npm run build`, output `client/dist`, and root `vercel.json` SPA rewrite. Set `VITE_API_BASE_URL` to the deployed backend `/api` URL.
- **Backend:** use a persistent Node host. Install dependencies from the root, then start with `npm start -w server`. Inject server variables and set `CLIENT_URL` to the exact frontend origin. Ensure backend egress is permitted by Atlas. For a reverse proxy, configure Express trust proxy deliberately for that host before relying on IP limits; do not blindly trust arbitrary proxy headers.

SIGTERM/SIGINT drain HTTP requests and close the pool with a bounded shutdown deadline. Unexpected process failures trigger shutdown so the host can restart a clean process. Verify health, deep links and a complete real-provider game after deployment. No deployment is complete until those URLs have been validated.
