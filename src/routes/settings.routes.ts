import express from 'express';
import { getSetting, upsertSetting } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/:key', getSetting);
router.put('/:key', authenticate, upsertSetting);

export default router;
