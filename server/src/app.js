import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createCaseRoutes } from './routes/caseRoutes.js';
import { createGeneralRateLimiter } from './middleware/rateLimiters.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestContext } from './middleware/requestContext.js';
export function createApp({ generate, origins = ['http://localhost:5173'], logger = console }) {
  const app = express();
  app.locals.logger = logger;
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(helmet());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', createGeneralRateLimiter());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/cases', createCaseRoutes(generate));
  app.use((_req, res) =>
    res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Route not found.' } }),
  );
  app.use(errorHandler);
  return app;
}
