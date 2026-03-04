import { Router, Request, Response } from 'express';
import { createOrder } from '../controllers/order.controller';

const router = Router();

// Guest checkout — no authentication required.
// The order is written directly to Google Sheets.
router.post('/', createOrder);

export default router;
