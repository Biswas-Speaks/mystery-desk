import { creationSchema, accusationSchema, emptySchema } from '../schemas/requestSchemas.js';
import { createCaseService } from '../services/caseService.js';

export function createCaseController(generateCase) {
  const caseService = createCaseService(generateCase);
  return {
    async create(req, res) {
      const input = creationSchema.parse(req.body);
      res.status(201).json(await caseService.create(input));
    },
    async get(req, res) {
      res.json(await caseService.get(req.caseId));
    },
    async discoverClue(req, res) {
      emptySchema.parse(req.body);
      res.json(await caseService.discoverClue(req.caseId, req.params.clueId));
    },
    async revealHint(req, res) {
      emptySchema.parse(req.body);
      res.json(await caseService.revealHint(req.caseId));
    },
    async accuse(req, res) {
      const { suspectId } = accusationSchema.parse(req.body);
      res.json(await caseService.accuse(req.caseId, suspectId));
    },
    async getResult(req, res) {
      res.json(await caseService.getResult(req.caseId));
    },
  };
}
