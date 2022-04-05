import bodyParser from 'body-parser';
import { Router } from 'express';
import { getEnvironmentHandler, newPositionCallback } from './routeCallbacks';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());

  router.post('/api/new-position', newPositionCallback);
  router.get('/api/env', getEnvironmentHandler);
  return router;
}
