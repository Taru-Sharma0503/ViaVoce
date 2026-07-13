import { Router } from 'express';
import { getTranslationsForCall } from '../controllers/translations.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:callId', requireAuth, getTranslationsForCall);

export default router;
