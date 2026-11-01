import { readEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createGroqClient } from './services/groqClient.js';
import { createCaseGenerator } from './services/caseGeneratorService.js';
import { createApp } from './app.js';
import mongoose from 'mongoose';

let server;
let shuttingDown = false;
async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  try {
    if (server)
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    await mongoose.disconnect();
    clearTimeout(deadline);
    process.exitCode = exitCode;
  } catch {
    console.error('Server shutdown failed.');
    process.exitCode = 1;
  }
}
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    void shutdown();
  });
for (const event of ['unhandledRejection', 'uncaughtException'])
  process.on(event, () => {
    console.error('Unexpected server failure. Shutting down safely.');
    void shutdown(1);
  });

try {
  const env = readEnv();
  await connectDatabase(env.MONGODB_URI);
  const app = createApp({
    generate: createCaseGenerator(createGroqClient(env), env),
    origins: env.CLIENT_URL.split(',').map((origin) => origin.trim()),
  });
  server = app.listen(env.PORT);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  console.log(`Mystery API listening on port ${env.PORT}`);
} catch {
  console.error(
    'Server startup failed. Check config/server/.env, Atlas connectivity, and port availability.',
  );
  await shutdown(1);
}
