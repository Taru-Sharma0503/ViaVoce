import { Router } from 'express';

const router = Router();

// GET /api/health - used to verify the server is up and reachable.
// Also useful during the demo to sanity-check deployment before going live.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'viavoce-server',
    timestamp: new Date().toISOString(),
  });
});

export default router;
