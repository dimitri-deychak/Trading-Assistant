import bodyParser from 'body-parser';
import { Router } from 'express';
import { getEnvironmentHandler, newPositionCallback } from './routeCallbacks';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());

  // router.get('/api/users', (req, res) => {
  //   res.json(users);
  // });

  // router.get('/api/user/:userId', (req, res) => {
  //   const userId = req.params.userId;
  //   res.json(getUserById(userId));
  // });

  // router.post('/api/set-user', (req, res) => {
  //   res.send(`ok`);
  // });

  router.post('/api/new-position', newPositionCallback);
  router.get('/api/env', getEnvironmentHandler);
  return router;
}
