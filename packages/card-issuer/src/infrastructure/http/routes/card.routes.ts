import { Router } from 'express';
import { type CardController } from '../controllers/card.controller.js';

export function buildCardRouter(controller: CardController): Router {
  const router = Router();
  router.post('/cards/issue', controller.issueCard);
  router.get('/health', controller.health);
  return router;
}
