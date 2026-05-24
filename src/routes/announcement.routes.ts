import express from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', authenticate, createAnnouncement);
router.put('/:id', authenticate, updateAnnouncement);
router.delete('/:id', authenticate, deleteAnnouncement);

export default router;
