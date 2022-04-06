import bodyParser from 'body-parser';
import { Router } from 'express';
import { getAccountHandler, getEnvironmentHandler, newPositionHandler } from './routeCallbacks';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());

  router.post('/api/new-position', newPositionHandler);
  router.get('/api/env', getEnvironmentHandler);
  router.get('/api/account', getAccountHandler);
  return router;
}
