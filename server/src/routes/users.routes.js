import { Router } from 'express';
import { getUserById, updatePreferences } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:id', requireAuth, getUserById);
router.patch('/:id/preferences', requireAuth, updatePreferences);

export default router;
