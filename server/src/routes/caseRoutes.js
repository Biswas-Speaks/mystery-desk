import { Router } from 'express';
import { createCaseController } from '../controllers/caseController.js';
import { authenticateCase } from '../middleware/authenticateCase.js';
import { createGenerationRateLimiter } from '../middleware/rateLimiters.js';
export function createCaseRoutes(generate) {
  const router = Router(),
    controller = createCaseController(generate);
  router.post('/', createGenerationRateLimiter(), controller.create);
  router.use('/:id', authenticateCase);
  router.get('/:id', controller.get);
  router.post('/:id/clues/:clueId/discover', controller.discoverClue);
  router.post('/:id/hints', controller.revealHint);
  router.post('/:id/accuse', controller.accuse);
  router.get('/:id/result', controller.getResult);
  return router;
}
