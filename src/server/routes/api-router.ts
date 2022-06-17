import bodyParser from 'body-parser';
import { Router } from 'express';
import {
  cancelAndClosePosition,
  clearStateHandler,
  getAccountHandler,
  getEnvironmentHandler,
  getLastTradeHandler,
  newPositionHandler,
  updatePositionHandler,
  getTaHandler,
  getBarsHandler,
  authenticateHandler,
  getBarsAsCSVHandler,
} from './route-callbacks';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());

  router.post('/api/clear-state', clearStateHandler);
  router.post('/api/new-position', newPositionHandler);
  router.post('/api/update-position', updatePositionHandler);
  router.get('/api/last-trade', getLastTradeHandler);
  router.get('/api/env', getEnvironmentHandler);
  router.get('/api/account', getAccountHandler);
  router.post('/api/remove-position', cancelAndClosePosition);
  router.get('/api/ta', getTaHandler);
  router.get('/api/get-bars', getBarsHandler);
  router.get('/api/get-bars-csv', getBarsAsCSVHandler);
  router.get('/api/authenticate', authenticateHandler);
  return router;
}
