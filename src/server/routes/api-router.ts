import bodyParser from 'body-parser';
import { Router } from 'express';
import {
  clearStateHandler,
  getAccountHandler,
  getEnvironmentHandler,
  getLastTradeHandler,
  newPositionHandler,
  updatePositionHandler,
} from './routeCallbacks';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());

  router.post('/api/clear-state', clearStateHandler);
  router.post('/api/new-position', newPositionHandler);
  router.post('/api/update-position', updatePositionHandler);
  router.get('/api/last-trade', getLastTradeHandler);
  router.get('/api/env', getEnvironmentHandler);
  router.get('/api/account', getAccountHandler);
  return router;
}
