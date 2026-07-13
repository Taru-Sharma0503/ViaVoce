import { Router } from 'express';
import {
  createCall,
  joinCall,
  endCall,
  getCall,
  getCallHistory,
} from '../controllers/calls.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// NOTE: /history must be declared before /:roomId so Express doesn't
// treat "history" as a roomId value.
router.get('/history', requireAuth, getCallHistory);

router.post('/', requireAuth, createCall);
router.post('/:roomId/join', requireAuth, joinCall);
router.post('/:roomId/end', requireAuth, endCall);
router.get('/:roomId', requireAuth, getCall);

export default router;
